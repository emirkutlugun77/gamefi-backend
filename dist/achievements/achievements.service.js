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
let AchievementsService = class AchievementsService {
    taskRepository;
    userTaskRepository;
    userRepository;
    constructor(taskRepository, userTaskRepository, userRepository) {
        this.taskRepository = taskRepository;
        this.userTaskRepository = userTaskRepository;
        this.userRepository = userRepository;
    }
    async createTask(createTaskDto) {
        const task = this.taskRepository.create({
            ...createTaskDto,
            start_date: createTaskDto.start_date ? new Date(createTaskDto.start_date) : undefined,
            end_date: createTaskDto.end_date ? new Date(createTaskDto.end_date) : undefined,
        });
        return this.taskRepository.save(task);
    }
    async getAllTasks() {
        return this.taskRepository.find({
            order: { display_order: 'ASC', created_at: 'DESC' },
        });
    }
    async getActiveTasks() {
        const now = new Date();
        return this.taskRepository
            .createQueryBuilder('task')
            .where('task.status = :status', { status: task_entity_1.TaskStatus.ACTIVE })
            .andWhere('(task.start_date IS NULL OR task.start_date <= :now)', { now })
            .andWhere('(task.end_date IS NULL OR task.end_date >= :now)', { now })
            .orderBy('task.display_order', 'ASC')
            .addOrderBy('task.created_at', 'DESC')
            .getMany();
    }
    async getTaskById(id) {
        const task = await this.taskRepository.findOne({ where: { id } });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async updateTask(id, updateTaskDto) {
        const task = await this.getTaskById(id);
        Object.assign(task, {
            ...updateTaskDto,
            start_date: updateTaskDto.start_date ? new Date(updateTaskDto.start_date) : task.start_date,
            end_date: updateTaskDto.end_date ? new Date(updateTaskDto.end_date) : task.end_date,
        });
        return this.taskRepository.save(task);
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
        return activeTasks.map(task => {
            const userTask = userTasks.find(ut => ut.task_id === task.id);
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
            if (task.max_completions && userTask.completion_count >= task.max_completions) {
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
            const user = await this.userRepository.findOne({ where: { id: userTask.user_id } });
            if (user) {
                user.airdrop_point += userTask.task.reward_points;
                await this.userRepository.save(user);
            }
        }
        else {
            userTask.status = user_task_entity_1.UserTaskStatus.REJECTED;
            userTask.rejection_reason = rejection_reason || 'Task verification failed';
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
        const completedTasks = userTasks.filter(ut => ut.status === user_task_entity_1.UserTaskStatus.COMPLETED);
        const pendingTasks = userTasks.filter(ut => ut.status === user_task_entity_1.UserTaskStatus.SUBMITTED);
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
                tasksRejected: userTasks.filter(ut => ut.status === user_task_entity_1.UserTaskStatus.REJECTED).length,
                pointsFromTasks: totalPointsEarned,
            },
        };
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
        if (task.max_completions && userTask.completion_count >= task.max_completions)
            return false;
        return true;
    }
};
exports.AchievementsService = AchievementsService;
exports.AchievementsService = AchievementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_task_entity_1.UserTask)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AchievementsService);
//# sourceMappingURL=achievements.service.js.map