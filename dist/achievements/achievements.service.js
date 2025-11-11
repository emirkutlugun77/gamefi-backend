"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../entities/task.entity");
const user_task_entity_1 = require("../entities/user-task.entity");
const user_entity_1 = require("../entities/user.entity");
const nft_collection_entity_1 = require("../entities/nft-collection.entity");
const nft_type_entity_1 = require("../entities/nft-type.entity");
const task_transaction_entity_1 = require("../entities/task-transaction.entity");
const task_input_user_entity_1 = require("../entities/task-input-user.entity");
const user_code_service_1 = require("./services/user-code.service");
const user_code_entity_1 = require("../entities/user-code.entity");
let AchievementsService = class AchievementsService {
    taskRepository;
    userTaskRepository;
    userRepository;
    nftCollectionRepository;
    nftTypeRepository;
    taskInputUserRepository;
    userCodeService;
    constructor(taskRepository, userTaskRepository, userRepository, nftCollectionRepository, nftTypeRepository, taskInputUserRepository, userCodeService) {
        this.taskRepository = taskRepository;
        this.userTaskRepository = userTaskRepository;
        this.userRepository = userRepository;
        this.nftCollectionRepository = nftCollectionRepository;
        this.nftTypeRepository = nftTypeRepository;
        this.taskInputUserRepository = taskInputUserRepository;
        this.userCodeService = userCodeService;
    }
    async createTask(createTaskDto) {
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
        if (savedTask.status === task_entity_1.TaskStatus.ACTIVE) {
            return savedTask;
        }
        const [syncedTask] = await this.syncTaskStatuses([savedTask]);
        return syncedTask;
    }
    async getAllTasks() {
        await this.syncAllTimeBoundTaskStatuses();
        const tasks = await this.taskRepository.find({
            order: { display_order: 'ASC', created_at: 'DESC' },
        });
        return this.syncTaskStatuses(tasks);
    }
    async getActiveTasks() {
        const now = new Date();
        await this.syncAllTimeBoundTaskStatuses();
        const tasks = await this.taskRepository
            .createQueryBuilder('task')
            .where('task.status = :status', { status: task_entity_1.TaskStatus.ACTIVE })
            .andWhere('(task.start_date IS NULL OR task.start_date <= :now)', { now })
            .andWhere('(task.end_date IS NULL OR task.end_date >= :now)', { now })
            .orderBy('task.display_order', 'ASC')
            .addOrderBy('task.created_at', 'DESC')
            .getMany();
        const syncedTasks = await this.syncTaskStatuses(tasks);
        return syncedTasks.filter((task) => task.status === task_entity_1.TaskStatus.ACTIVE);
    }
    async getTaskById(id) {
        const task = await this.taskRepository.findOne({ where: { id } });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.syncTaskStatuses([task]);
        return task;
    }
    async updateTask(id, updateTaskDto) {
        const task = await this.getTaskById(id);
        const isManualStatusUpdate = updateTaskDto.status !== undefined;
        Object.assign(task, {
            ...updateTaskDto,
            start_date: updateTaskDto.start_date
                ? new Date(updateTaskDto.start_date)
                : task.start_date,
            end_date: updateTaskDto.end_date
                ? new Date(updateTaskDto.end_date)
                : task.end_date,
            status: updateTaskDto.status !== undefined
                ? this.normalizeStatus(updateTaskDto.status)
                : task.status,
        });
        const savedTask = await this.taskRepository.save(task);
        if (isManualStatusUpdate && savedTask.status === task_entity_1.TaskStatus.ACTIVE) {
            return savedTask;
        }
        const [syncedTask] = await this.syncTaskStatuses([savedTask]);
        return syncedTask;
    }
    async deleteTask(id) {
        const task = await this.getTaskById(id);
        await this.taskRepository.remove(task);
    }
    async getUserTasks(publicKey) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.userTaskRepository.find({
            where: { user_id: user.id },
            order: { created_at: 'DESC' },
        });
    }
    async getUserTasksWithDetails(publicKey) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const activeTasks = await this.getActiveTasks();
        const userTasks = await this.getUserTasks(publicKey);
        return activeTasks.map((task) => {
            const userTask = userTasks.find((ut) => ut.task_id === task.id);
            return {
                task,
                userProgress: userTask || null,
                canComplete: this.canCompleteTask(task, userTask),
            };
        });
    }
    async submitTask(submitTaskDto) {
        const { task_id, publicKey, submission_data } = submitTaskDto;
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const task = await this.getTaskById(task_id);
        if (task.status !== task_entity_1.TaskStatus.ACTIVE) {
            throw new common_1.BadRequestException('Task is not active');
        }
        const now = new Date();
        if (task.start_date && task.start_date > now) {
            throw new common_1.BadRequestException('Task has not started yet');
        }
        if (task.end_date && task.end_date < now) {
            throw new common_1.BadRequestException('Task has expired');
        }
        let userTask = await this.userTaskRepository.findOne({
            where: { user_id: user.id, task_id: task.id },
        });
        if (userTask) {
            if (!task.is_repeatable && userTask.status === user_task_entity_1.UserTaskStatus.COMPLETED) {
                throw new common_1.BadRequestException('Task already completed and is not repeatable');
            }
            if (task.max_completions &&
                userTask.completion_count >= task.max_completions) {
                throw new common_1.BadRequestException('Maximum completions reached for this task');
            }
            userTask.status = user_task_entity_1.UserTaskStatus.SUBMITTED;
            userTask.submission_data = submission_data || {};
            userTask.started_at = userTask.started_at || now;
        }
        else {
            userTask = this.userTaskRepository.create({
                user_id: user.id,
                task_id: task.id,
                status: user_task_entity_1.UserTaskStatus.SUBMITTED,
                submission_data: submission_data || {},
                started_at: now,
            });
        }
        if (task.verification_config?.autoVerify) {
            userTask.status = user_task_entity_1.UserTaskStatus.COMPLETED;
            userTask.completed_at = now;
            userTask.completion_count += 1;
            userTask.points_earned += task.reward_points;
            user.airdrop_point += task.reward_points;
            await this.userRepository.save(user);
        }
        return this.userTaskRepository.save(userTask);
    }
    async verifyTask(verifyTaskDto) {
        const { user_task_id, approved, rejection_reason } = verifyTaskDto;
        const userTask = await this.userTaskRepository.findOne({
            where: { id: user_task_id },
            relations: ['user', 'task'],
        });
        if (!userTask) {
            throw new common_1.NotFoundException('User task not found');
        }
        if (userTask.status !== user_task_entity_1.UserTaskStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Task is not in submitted state');
        }
        const now = new Date();
        if (approved) {
            userTask.status = user_task_entity_1.UserTaskStatus.COMPLETED;
            userTask.completed_at = now;
            userTask.completion_count += 1;
            userTask.points_earned += userTask.task.reward_points;
            const user = await this.userRepository.findOne({
                where: { id: userTask.user_id },
            });
            if (user) {
                user.airdrop_point += userTask.task.reward_points;
                await this.userRepository.save(user);
            }
        }
        else {
            userTask.status = user_task_entity_1.UserTaskStatus.REJECTED;
            userTask.rejection_reason =
                rejection_reason || 'Task verification failed';
        }
        return this.userTaskRepository.save(userTask);
    }
    async getPendingVerifications() {
        return this.userTaskRepository.find({
            where: { status: user_task_entity_1.UserTaskStatus.SUBMITTED },
            order: { created_at: 'ASC' },
        });
    }
    async getUserStats(publicKey) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userTasks = await this.userTaskRepository.find({
            where: { user_id: user.id },
        });
        const completedTasks = userTasks.filter((ut) => ut.status === user_task_entity_1.UserTaskStatus.COMPLETED);
        const pendingTasks = userTasks.filter((ut) => ut.status === user_task_entity_1.UserTaskStatus.SUBMITTED);
        const totalPointsEarned = userTasks.reduce((sum, ut) => sum + ut.points_earned, 0);
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
                tasksRejected: userTasks.filter((ut) => ut.status === user_task_entity_1.UserTaskStatus.REJECTED).length,
                pointsFromTasks: totalPointsEarned,
            },
        };
    }
    async submitTextTask(taskId, publicKey, textContent) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const task = await this.getTaskById(taskId);
        if (task.type !== task_entity_1.TaskType.SUBMIT_TEXT) {
            throw new common_1.BadRequestException('This task is not a text submission task');
        }
        if (task.status !== task_entity_1.TaskStatus.ACTIVE) {
            throw new common_1.BadRequestException('Task is not active');
        }
        const taskInput = this.taskInputUserRepository.create({
            user_id: user.id,
            task_id: task.id,
            input_type: task_input_user_entity_1.TaskInputType.TEXT,
            content: textContent,
            status: task_input_user_entity_1.TaskInputStatus.PENDING,
        });
        const savedInput = await this.taskInputUserRepository.save(taskInput);
        let userTask = await this.userTaskRepository.findOne({
            where: { user_id: user.id, task_id: task.id },
        });
        const now = new Date();
        if (userTask) {
            userTask.status = user_task_entity_1.UserTaskStatus.SUBMITTED;
            userTask.submission_data = { text: textContent, input_id: savedInput.id };
        }
        else {
            userTask = this.userTaskRepository.create({
                user_id: user.id,
                task_id: task.id,
                status: user_task_entity_1.UserTaskStatus.SUBMITTED,
                submission_data: { text: textContent, input_id: savedInput.id },
                started_at: now,
            });
        }
        await this.userTaskRepository.save(userTask);
        if (task.requires_transaction && task.submission_prompt) {
            const webhookUrl = task.config?.webhook_url || task.verification_config?.webhook_url;
            let videoUrl = null;
            if (webhookUrl) {
                try {
                    const webhookResponse = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prompt: textContent,
                        }),
                    });
                    if (webhookResponse.ok) {
                        const webhookData = await webhookResponse.json();
                        videoUrl = webhookData.video_url || webhookData.url || webhookData.videoUrl;
                    }
                    else {
                        console.error('Webhook request failed:', await webhookResponse.text());
                    }
                }
                catch (error) {
                    console.error('Error calling webhook:', error);
                }
            }
            const userCode = await this.userCodeService.generateCode(user.id, task.id, user_code_entity_1.CodeType.TWITTER_EMBED, {
                video_url: videoUrl,
                webhook_url: webhookUrl,
                required_platform: 'twitter',
                task_type: task.type,
                submission_input_id: savedInput.id,
                user_input: textContent,
            }, 72, 1);
            userTask.submission_data = {
                ...userTask.submission_data,
                generated_code: userCode.code,
                code_expires_at: userCode.expires_at,
                video_url: videoUrl,
                webhook_called: !!webhookUrl,
            };
            await this.userTaskRepository.save(userTask);
        }
        return savedInput;
    }
    async submitImageTask(taskId, publicKey, imageUrl, description, metadata) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const task = await this.getTaskById(taskId);
        if (task.type !== task_entity_1.TaskType.SUBMIT_IMAGE) {
            throw new common_1.BadRequestException('This task is not an image submission task');
        }
        if (task.status !== task_entity_1.TaskStatus.ACTIVE) {
            throw new common_1.BadRequestException('Task is not active');
        }
        const taskInput = this.taskInputUserRepository.create({
            user_id: user.id,
            task_id: task.id,
            input_type: task_input_user_entity_1.TaskInputType.IMAGE,
            content: imageUrl,
            description: description || null,
            metadata: metadata || null,
            status: task_input_user_entity_1.TaskInputStatus.PENDING,
        });
        const savedInput = await this.taskInputUserRepository.save(taskInput);
        let userTask = await this.userTaskRepository.findOne({
            where: { user_id: user.id, task_id: task.id },
        });
        const now = new Date();
        if (userTask) {
            userTask.status = user_task_entity_1.UserTaskStatus.SUBMITTED;
            userTask.submission_data = {
                image_url: imageUrl,
                description,
                metadata,
                input_id: savedInput.id,
            };
        }
        else {
            userTask = this.userTaskRepository.create({
                user_id: user.id,
                task_id: task.id,
                status: user_task_entity_1.UserTaskStatus.SUBMITTED,
                submission_data: {
                    image_url: imageUrl,
                    description,
                    metadata,
                    input_id: savedInput.id,
                },
                started_at: now,
            });
        }
        await this.userTaskRepository.save(userTask);
        return savedInput;
    }
    async reviewTaskInput(inputId, approved, reviewedBy, reviewComment) {
        const taskInput = await this.taskInputUserRepository.findOne({
            where: { id: inputId },
            relations: ['task', 'user'],
        });
        if (!taskInput) {
            throw new common_1.NotFoundException('Task input not found');
        }
        if (taskInput.status !== task_input_user_entity_1.TaskInputStatus.PENDING) {
            throw new common_1.BadRequestException('Task input is not pending review');
        }
        const now = new Date();
        if (approved) {
            taskInput.status = task_input_user_entity_1.TaskInputStatus.APPROVED;
            taskInput.reviewed_by = reviewedBy;
            taskInput.reviewed_at = now;
            taskInput.review_comment = reviewComment || null;
            const userTask = await this.userTaskRepository.findOne({
                where: { user_id: taskInput.user_id, task_id: taskInput.task_id },
            });
            if (userTask) {
                userTask.status = user_task_entity_1.UserTaskStatus.COMPLETED;
                userTask.completed_at = now;
                userTask.completion_count += 1;
                userTask.points_earned += taskInput.task.reward_points;
                const user = await this.userRepository.findOne({
                    where: { id: taskInput.user_id },
                });
                if (user) {
                    user.airdrop_point += taskInput.task.reward_points;
                    await this.userRepository.save(user);
                }
                await this.userTaskRepository.save(userTask);
            }
        }
        else {
            taskInput.status = task_input_user_entity_1.TaskInputStatus.REJECTED;
            taskInput.reviewed_by = reviewedBy;
            taskInput.reviewed_at = now;
            taskInput.review_comment = reviewComment || 'Submission rejected';
            const userTask = await this.userTaskRepository.findOne({
                where: { user_id: taskInput.user_id, task_id: taskInput.task_id },
            });
            if (userTask) {
                userTask.status = user_task_entity_1.UserTaskStatus.REJECTED;
                userTask.rejection_reason = reviewComment || 'Submission rejected';
                await this.userTaskRepository.save(userTask);
            }
        }
        return this.taskInputUserRepository.save(taskInput);
    }
    async getUserTaskInputs(publicKey) {
        const user = await this.userRepository.findOne({ where: { publicKey } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.taskInputUserRepository.find({
            where: { user_id: user.id },
            order: { created_at: 'DESC' },
        });
    }
    async getPendingTaskInputs() {
        return this.taskInputUserRepository.find({
            where: { status: task_input_user_entity_1.TaskInputStatus.PENDING },
            order: { created_at: 'ASC' },
        });
    }
    canCompleteTask(task, userTask) {
        if (task.status !== task_entity_1.TaskStatus.ACTIVE)
            return false;
        const now = new Date();
        if (task.start_date && task.start_date > now)
            return false;
        if (task.end_date && task.end_date < now)
            return false;
        if (!userTask)
            return true;
        if (!task.is_repeatable && userTask.status === user_task_entity_1.UserTaskStatus.COMPLETED)
            return false;
        if (task.max_completions &&
            userTask.completion_count >= task.max_completions)
            return false;
        return true;
    }
    async getTaskConfigOptions() {
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
        const instructionSchemas = {
            [task_entity_1.TaskType.NFT_HOLD]: {
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
            [task_entity_1.TaskType.NFT_MINT]: {
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
            [task_entity_1.TaskType.STAKE_TOKENS]: {
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
            [task_entity_1.TaskType.TOKEN_SWAP]: {
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
        const transactionSchemas = {
            [task_entity_1.TaskType.NFT_MINT]: {
                defaults: {
                    transaction_type: task_transaction_entity_1.TransactionType.NFT_MINT,
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
                                value: task_transaction_entity_1.TransactionType.NFT_MINT,
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
            [task_entity_1.TaskType.TOKEN_SWAP]: {
                defaults: {
                    transaction_type: task_transaction_entity_1.TransactionType.TOKEN_SWAP,
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
                                value: task_transaction_entity_1.TransactionType.TOKEN_SWAP,
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
            [task_entity_1.TaskType.LIQUIDITY_PROVIDE]: {
                defaults: {
                    transaction_type: task_transaction_entity_1.TransactionType.LIQUIDITY_ADD,
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
                                value: task_transaction_entity_1.TransactionType.LIQUIDITY_ADD,
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
            [task_entity_1.TaskType.STAKE_TOKENS]: {
                defaults: {
                    transaction_type: task_transaction_entity_1.TransactionType.STAKE,
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
                                value: task_transaction_entity_1.TransactionType.STAKE,
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
        const requiresTransactionDefaults = {
            [task_entity_1.TaskType.NFT_MINT]: true,
            [task_entity_1.TaskType.TOKEN_SWAP]: true,
            [task_entity_1.TaskType.LIQUIDITY_PROVIDE]: true,
            [task_entity_1.TaskType.STAKE_TOKENS]: true,
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
    normalizeStatus(status) {
        if (!status) {
            return task_entity_1.TaskStatus.ACTIVE;
        }
        if (status === task_entity_1.TaskStatus.SCHEDULED ||
            status === task_entity_1.TaskStatus.EXPIRED) {
            return task_entity_1.TaskStatus.INACTIVE;
        }
        return status;
    }
    computeTimeDrivenStatus(task, now) {
        const start = task.start_date ? new Date(task.start_date).getTime() : null;
        const end = task.end_date ? new Date(task.end_date).getTime() : null;
        const current = now.getTime();
        if (end !== null && end <= current) {
            return task_entity_1.TaskStatus.INACTIVE;
        }
        if (start !== null && start > current) {
            return task_entity_1.TaskStatus.INACTIVE;
        }
        return task_entity_1.TaskStatus.ACTIVE;
    }
    async syncTaskStatuses(tasks) {
        if (!tasks.length) {
            return tasks;
        }
        const now = new Date();
        const tasksToUpdate = [];
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
    async syncAllTimeBoundTaskStatuses() {
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
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_task_entity_1.UserTask)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(nft_collection_entity_1.NftCollection)),
    __param(4, (0, typeorm_1.InjectRepository)(nft_type_entity_1.NftType)),
    __param(5, (0, typeorm_1.InjectRepository)(task_input_user_entity_1.TaskInputUser)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_code_service_1.UserCodeService])
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map