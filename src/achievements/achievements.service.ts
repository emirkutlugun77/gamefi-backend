import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskType } from '../entities/task.entity';
import { UserTask, UserTaskStatus } from '../entities/user-task.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { TransactionType } from '../entities/task-transaction.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NftCollection)
    private readonly nftCollectionRepository: Repository<NftCollection>,
    @InjectRepository(NftType)
    private readonly nftTypeRepository: Repository<NftType>,
  ) {}

  // ========== TASK MANAGEMENT ==========

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: this.normalizeStatus(createTaskDto.status),
      start_date: createTaskDto.start_date
        ? new Date(createTaskDto.start_date)
        : undefined,
      end_date: createTaskDto.end_date
        ? new Date(createTaskDto.end_date)
        : undefined,
    });
    const savedTask = await this.taskRepository.save(task);

    // Skip automatic sync if task was created with ACTIVE status
    // This allows creating tasks that are immediately active regardless of dates
    if (savedTask.status === TaskStatus.ACTIVE) {
      return savedTask;
    }

    const [syncedTask] = await this.syncTaskStatuses([savedTask]);
    return syncedTask;
  }

  async getAllTasks(): Promise<Task[]> {
    await this.syncAllTimeBoundTaskStatuses();
    const tasks = await this.taskRepository.find({
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
    return this.syncTaskStatuses(tasks);
  }

  async getActiveTasks(): Promise<Task[]> {
    const now = new Date();
    await this.syncAllTimeBoundTaskStatuses();
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.ACTIVE })
      .andWhere('(task.start_date IS NULL OR task.start_date <= :now)', { now })
      .andWhere('(task.end_date IS NULL OR task.end_date >= :now)', { now })
      .orderBy('task.display_order', 'ASC')
      .addOrderBy('task.created_at', 'DESC')
      .getMany();
    const syncedTasks = await this.syncTaskStatuses(tasks);
    return syncedTasks.filter((task) => task.status === TaskStatus.ACTIVE);
  }

  async getTaskById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.syncTaskStatuses([task]);
    return task;
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTaskById(id);

    // Check if status is being explicitly updated
    const isManualStatusUpdate = updateTaskDto.status !== undefined;

    Object.assign(task, {
      ...updateTaskDto,
      start_date: updateTaskDto.start_date
        ? new Date(updateTaskDto.start_date)
        : task.start_date,
      end_date: updateTaskDto.end_date
        ? new Date(updateTaskDto.end_date)
        : task.end_date,
      status:
        updateTaskDto.status !== undefined
          ? this.normalizeStatus(updateTaskDto.status)
          : task.status,
    });

    const savedTask = await this.taskRepository.save(task);

    // Skip automatic sync if status was manually set to ACTIVE
    // This allows admins to override time-based status logic
    if (isManualStatusUpdate && savedTask.status === TaskStatus.ACTIVE) {
      return savedTask;
    }

    const [syncedTask] = await this.syncTaskStatuses([savedTask]);
    return syncedTask;
  }

  async deleteTask(id: number): Promise<void> {
    const task = await this.getTaskById(id);
    await this.taskRepository.remove(task);
  }

  // ========== USER TASK MANAGEMENT ==========

  async getUserTasks(publicKey: string): Promise<UserTask[]> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userTaskRepository.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
  }

  async getUserTasksWithDetails(publicKey: string): Promise<any[]> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeTasks = await this.getActiveTasks();
    const userTasks = await this.getUserTasks(publicKey);

    // Map tasks with user progress
    return activeTasks.map((task) => {
      const userTask = userTasks.find((ut) => ut.task_id === task.id);
      return {
        task,
        userProgress: userTask || null,
        canComplete: this.canCompleteTask(task, userTask),
      };
    });
  }

  async submitTask(submitTaskDto: SubmitTaskDto): Promise<UserTask> {
    const { task_id, publicKey, submission_data } = submitTaskDto;

    // Get user
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get task
    const task = await this.getTaskById(task_id);

    // Check if task is active and within date range
    if (task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('Task is not active');
    }

    const now = new Date();
    if (task.start_date && task.start_date > now) {
      throw new BadRequestException('Task has not started yet');
    }
    if (task.end_date && task.end_date < now) {
      throw new BadRequestException('Task has expired');
    }

    // Check if user already has this task
    let userTask = await this.userTaskRepository.findOne({
      where: { user_id: user.id, task_id: task.id },
    });

    if (userTask) {
      // Check if task is repeatable
      if (!task.is_repeatable && userTask.status === UserTaskStatus.COMPLETED) {
        throw new BadRequestException(
          'Task already completed and is not repeatable',
        );
      }

      // Check max completions
      if (
        task.max_completions &&
        userTask.completion_count >= task.max_completions
      ) {
        throw new BadRequestException(
          'Maximum completions reached for this task',
        );
      }

      // Update existing user task
      userTask.status = UserTaskStatus.SUBMITTED;
      userTask.submission_data = submission_data || {};
      userTask.started_at = userTask.started_at || now;
    } else {
      // Create new user task
      userTask = this.userTaskRepository.create({
        user_id: user.id,
        task_id: task.id,
        status: UserTaskStatus.SUBMITTED,
        submission_data: submission_data || {},
        started_at: now,
      });
    }

    // Auto-verify if configured
    if (task.verification_config?.autoVerify) {
      userTask.status = UserTaskStatus.COMPLETED;
      userTask.completed_at = now;
      userTask.completion_count += 1;
      userTask.points_earned += task.reward_points;

      // Award points to user
      user.airdrop_point += task.reward_points;
      await this.userRepository.save(user);
    }

    return this.userTaskRepository.save(userTask);
  }

  async verifyTask(verifyTaskDto: VerifyTaskDto): Promise<UserTask> {
    const { user_task_id, approved, rejection_reason } = verifyTaskDto;

    const userTask = await this.userTaskRepository.findOne({
      where: { id: user_task_id },
      relations: ['user', 'task'],
    });

    if (!userTask) {
      throw new NotFoundException('User task not found');
    }

    if (userTask.status !== UserTaskStatus.SUBMITTED) {
      throw new BadRequestException('Task is not in submitted state');
    }

    const now = new Date();

    if (approved) {
      // Approve and award points
      userTask.status = UserTaskStatus.COMPLETED;
      userTask.completed_at = now;
      userTask.completion_count += 1;
      userTask.points_earned += userTask.task.reward_points;

      // Award points to user
      const user = await this.userRepository.findOne({
        where: { id: userTask.user_id },
      });
      if (user) {
        user.airdrop_point += userTask.task.reward_points;
        await this.userRepository.save(user);
      }
    } else {
      // Reject
      userTask.status = UserTaskStatus.REJECTED;
      userTask.rejection_reason =
        rejection_reason || 'Task verification failed';
    }

    return this.userTaskRepository.save(userTask);
  }

  async getPendingVerifications(): Promise<UserTask[]> {
    return this.userTaskRepository.find({
      where: { status: UserTaskStatus.SUBMITTED },
      order: { created_at: 'ASC' },
    });
  }

  async getUserStats(publicKey: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userTasks = await this.userTaskRepository.find({
      where: { user_id: user.id },
    });

    const completedTasks = userTasks.filter(
      (ut) => ut.status === UserTaskStatus.COMPLETED,
    );
    const pendingTasks = userTasks.filter(
      (ut) => ut.status === UserTaskStatus.SUBMITTED,
    );
    const totalPointsEarned = userTasks.reduce(
      (sum, ut) => sum + ut.points_earned,
      0,
    );

    return {
      user: {
        publicKey: user.publicKey,
        telegramId: user.telegramId,
        chosenSide: user.chosenSide,
        totalPoints: user.airdrop_point,
      },
      stats: {
        tasksCompleted: completedTasks.length,
        tasksPending: pendingTasks.length,
        tasksRejected: userTasks.filter(
          (ut) => ut.status === UserTaskStatus.REJECTED,
        ).length,
        pointsFromTasks: totalPointsEarned,
      },
    };
  }

  // ========== HELPER METHODS ==========

  private canCompleteTask(task: Task, userTask?: UserTask): boolean {
    if (task.status !== TaskStatus.ACTIVE) return false;

    const now = new Date();
    if (task.start_date && task.start_date > now) return false;
    if (task.end_date && task.end_date < now) return false;

    if (!userTask) return true;

    if (!task.is_repeatable && userTask.status === UserTaskStatus.COMPLETED)
      return false;

    if (
      task.max_completions &&
      userTask.completion_count >= task.max_completions
    )
      return false;

    return true;
  }

  async getTaskConfigOptions(): Promise<Record<string, any>> {
    const [collections, nftTypes] = await Promise.all([
      this.nftCollectionRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
      this.nftTypeRepository.find({
        order: { name: 'ASC' },
      }),
    ]);

    const collectionOptions = collections.map((collection) => ({
      value: collection.id,
      label: collection.name,
      symbol: collection.symbol,
    }));

    const typeOptions = nftTypes.map((type) => ({
      value: type.id,
      label: type.name,
      collectionId: type.collectionId,
    }));

    const instructionSchemas: Record<string, any> = {
      [TaskType.NFT_HOLD]: {
        defaults: {
          minAmount: 1,
        },
        fields: [
          {
            name: 'collectionMint',
            label: 'NFT Koleksiyonu',
            type: 'select',
            required: true,
            options: collectionOptions,
          },
          {
            name: 'typeId',
            label: 'NFT Tipi',
            type: 'select',
            required: false,
            options: typeOptions,
            dependsOn: 'collectionMint',
          },
          {
            name: 'minAmount',
            label: 'Minimum NFT Adedi',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
      [TaskType.NFT_MINT]: {
        defaults: {
          quantity: 1,
        },
        fields: [
          {
            name: 'collectionMint',
            label: 'Mint Edilecek Koleksiyon',
            type: 'select',
            required: true,
            options: collectionOptions,
          },
          {
            name: 'typeId',
            label: 'NFT Tipi',
            type: 'select',
            required: true,
            options: typeOptions,
            dependsOn: 'collectionMint',
          },
          {
            name: 'quantity',
            label: 'Mint Adedi',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
          {
            name: 'allowlistOnly',
            label: 'Sadece Allowlist Kullanıcıları',
            type: 'checkbox',
            required: false,
            defaultValue: false,
          },
        ],
      },
      [TaskType.STAKE_TOKENS]: {
        fields: [
          {
            name: 'stakePoolId',
            label: 'Stake Pool Kimliği',
            type: 'text',
            required: true,
            placeholder: 'Stake pool adresini girin',
          },
          {
            name: 'minAmount',
            label: 'Minimum Stake Miktarı',
            type: 'number',
            required: false,
            min: 0,
          },
          {
            name: 'lockPeriodDays',
            label: 'Kilitleme Süresi (gün)',
            type: 'number',
            required: false,
            min: 0,
          },
        ],
      },
      [TaskType.TOKEN_SWAP]: {
        fields: [
          {
            name: 'platform',
            label: 'Swap Platformu',
            type: 'text',
            placeholder: 'Örn: Jupiter',
            required: false,
          },
          {
            name: 'allowedRoutes',
            label: 'İzinli Swap Rotaları',
            type: 'textarea',
            placeholder: 'Comma-separated route IDs',
            required: false,
          },
        ],
      },
    };

    const transactionSchemas: Record<string, any> = {
      [TaskType.NFT_MINT]: {
        defaults: {
          transaction_type: TransactionType.NFT_MINT,
          required_confirmations: 1,
        },
        fields: [
          {
            name: 'transaction_type',
            label: 'İşlem Tipi',
            type: 'select',
            required: true,
            options: [
              {
                value: TransactionType.NFT_MINT,
                label: 'NFT Mint',
              },
            ],
          },
          {
            name: 'payment_token_mint',
            label: 'Ödeme Token Mint',
            type: 'text',
            required: false,
          },
          {
            name: 'max_price',
            label: 'Maksimum Mint Ücreti',
            type: 'number',
            required: false,
            min: 0,
          },
          {
            name: 'required_confirmations',
            label: 'Gerekli Onay Sayısı',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
      [TaskType.TOKEN_SWAP]: {
        defaults: {
          transaction_type: TransactionType.TOKEN_SWAP,
          allow_any_amount: true,
          required_confirmations: 1,
        },
        fields: [
          {
            name: 'transaction_type',
            label: 'İşlem Tipi',
            type: 'select',
            required: true,
            options: [
              {
                value: TransactionType.TOKEN_SWAP,
                label: 'Token Swap',
              },
            ],
          },
          {
            name: 'from_token_mint',
            label: 'Kaynak Token Mint',
            type: 'text',
            required: true,
            placeholder: 'Örn: So111111...',
          },
          {
            name: 'to_token_mint',
            label: 'Hedef Token Mint',
            type: 'text',
            required: true,
          },
          {
            name: 'min_amount',
            label: 'Minimum Swap Tutarı',
            type: 'number',
            required: false,
            min: 0,
          },
          {
            name: 'allow_any_amount',
            label: 'Herhangi Bir Miktara İzin Ver',
            type: 'checkbox',
            defaultValue: true,
          },
          {
            name: 'required_confirmations',
            label: 'Gerekli Onay Sayısı',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
      [TaskType.LIQUIDITY_PROVIDE]: {
        defaults: {
          transaction_type: TransactionType.LIQUIDITY_ADD,
          required_confirmations: 1,
        },
        fields: [
          {
            name: 'transaction_type',
            label: 'İşlem Tipi',
            type: 'select',
            required: true,
            options: [
              {
                value: TransactionType.LIQUIDITY_ADD,
                label: 'Likidite Ekle',
              },
            ],
          },
          {
            name: 'pool_address',
            label: 'Likidite Havuzu Adresi',
            type: 'text',
            required: true,
          },
          {
            name: 'token_mint_a',
            label: 'Token A Mint',
            type: 'text',
            required: true,
          },
          {
            name: 'token_mint_b',
            label: 'Token B Mint',
            type: 'text',
            required: true,
          },
          {
            name: 'required_confirmations',
            label: 'Gerekli Onay Sayısı',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
      [TaskType.STAKE_TOKENS]: {
        defaults: {
          transaction_type: TransactionType.STAKE,
          required_confirmations: 1,
        },
        fields: [
          {
            name: 'transaction_type',
            label: 'İşlem Tipi',
            type: 'select',
            required: true,
            options: [
              {
                value: TransactionType.STAKE,
                label: 'Stake',
              },
            ],
          },
          {
            name: 'stake_pool_id',
            label: 'Stake Pool Kimliği',
            type: 'text',
            required: true,
          },
          {
            name: 'min_amount',
            label: 'Minimum Stake',
            type: 'number',
            required: false,
            min: 0,
          },
          {
            name: 'required_confirmations',
            label: 'Gerekli Onay Sayısı',
            type: 'number',
            required: true,
            min: 1,
            defaultValue: 1,
          },
        ],
      },
    };

    const requiresTransactionDefaults: Partial<Record<TaskType, boolean>> = {
      [TaskType.NFT_MINT]: true,
      [TaskType.TOKEN_SWAP]: true,
      [TaskType.LIQUIDITY_PROVIDE]: true,
      [TaskType.STAKE_TOKENS]: true,
    };

    return {
      generatedAt: new Date().toISOString(),
      instructionSchemas,
      transactionSchemas,
      references: {
        nftCollections: collectionOptions,
        nftTypes: typeOptions,
      },
      requiresTransactionDefaults,
    };
  }

  private normalizeStatus(status?: TaskStatus): TaskStatus {
    if (!status) {
      return TaskStatus.ACTIVE;
    }
    if (
      status === TaskStatus.SCHEDULED ||
      status === TaskStatus.EXPIRED
    ) {
      return TaskStatus.INACTIVE;
    }
    return status;
  }

  private computeTimeDrivenStatus(task: Task, now: Date): TaskStatus {
    const start = task.start_date ? new Date(task.start_date).getTime() : null;
    const end = task.end_date ? new Date(task.end_date).getTime() : null;
    const current = now.getTime();

    if (end !== null && end <= current) {
      return TaskStatus.INACTIVE;
    }

    if (start !== null && start > current) {
      return TaskStatus.INACTIVE;
    }

    return TaskStatus.ACTIVE;
  }

  private async syncTaskStatuses(tasks: Task[]): Promise<Task[]> {
    if (!tasks.length) {
      return tasks;
    }

    const now = new Date();
    const tasksToUpdate: Task[] = [];

    for (const task of tasks) {
      const normalizedStatus = this.normalizeStatus(task.status);
      let nextStatus = normalizedStatus;

      if (task.start_date || task.end_date) {
        nextStatus = this.computeTimeDrivenStatus(task, now);
      }

      if (task.status !== nextStatus) {
        task.status = nextStatus;
        tasksToUpdate.push(task);
      }
    }

    if (tasksToUpdate.length) {
      await this.taskRepository.save(tasksToUpdate);
    }

    return tasks;
  }

  private async syncAllTimeBoundTaskStatuses(): Promise<void> {
    const timeBoundTasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.start_date IS NOT NULL')
      .orWhere('task.end_date IS NOT NULL')
      .getMany();

    if (!timeBoundTasks.length) {
      return;
    }

    await this.syncTaskStatuses(timeBoundTasks);
  }
}
