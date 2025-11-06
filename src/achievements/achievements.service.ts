import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { UserTask, UserTaskStatus } from '../entities/user-task.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========== TASK MANAGEMENT ==========

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      start_date: createTaskDto.start_date
        ? new Date(createTaskDto.start_date)
        : undefined,
      end_date: createTaskDto.end_date
        ? new Date(createTaskDto.end_date)
        : undefined,
    });
    return this.taskRepository.save(task);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
  }

  async getActiveTasks(): Promise<Task[]> {
    const now = new Date();
    return this.taskRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.ACTIVE })
      .andWhere('(task.start_date IS NULL OR task.start_date <= :now)', { now })
      .andWhere('(task.end_date IS NULL OR task.end_date >= :now)', { now })
      .orderBy('task.display_order', 'ASC')
      .addOrderBy('task.created_at', 'DESC')
      .getMany();
  }

  async getTaskById(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTaskById(id);

    Object.assign(task, {
      ...updateTaskDto,
      start_date: updateTaskDto.start_date
        ? new Date(updateTaskDto.start_date)
        : task.start_date,
      end_date: updateTaskDto.end_date
        ? new Date(updateTaskDto.end_date)
        : task.end_date,
    });

    return this.taskRepository.save(task);
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
}
