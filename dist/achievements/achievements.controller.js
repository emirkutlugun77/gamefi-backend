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
exports.AchievementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const achievements_service_1 = require("./achievements.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const submit_task_dto_1 = require("./dto/submit-task.dto");
const verify_task_dto_1 = require("./dto/verify-task.dto");
let AchievementsController = class AchievementsController {
    achievementsService;
    constructor(achievementsService) {
        this.achievementsService = achievementsService;
    }
    async createTask(createTaskDto) {
        try {
            const task = await this.achievementsService.createTask(createTaskDto);
            return {
                success: true,
                data: task,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create task',
                error: error.message,
            }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getTasks(active) {
        try {
            const tasks = active === 'true'
                ? await this.achievementsService.getActiveTasks()
                : await this.achievementsService.getAllTasks();
            return {
                success: true,
                data: tasks,
                count: tasks.length,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve tasks',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTaskById(id) {
        try {
            const task = await this.achievementsService.getTaskById(id);
            return {
                success: true,
                data: task,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateTask(id, updateTaskDto) {
        try {
            const task = await this.achievementsService.updateTask(id, updateTaskDto);
            return {
                success: true,
                data: task,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteTask(id) {
        try {
            await this.achievementsService.deleteTask(id);
            return {
                success: true,
                message: 'Task deleted successfully',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserTasks(publicKey) {
        try {
            const tasks = await this.achievementsService.getUserTasksWithDetails(publicKey);
            return {
                success: true,
                data: tasks,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async submitTask(submitTaskDto) {
        try {
            const userTask = await this.achievementsService.submitTask(submitTaskDto);
            return {
                success: true,
                data: userTask,
                message: userTask.status === 'COMPLETED'
                    ? 'Task completed and points awarded!'
                    : 'Task submitted for verification',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyTask(verifyTaskDto) {
        try {
            const userTask = await this.achievementsService.verifyTask(verifyTaskDto);
            return {
                success: true,
                data: userTask,
                message: userTask.status === 'COMPLETED'
                    ? 'Task approved and points awarded'
                    : 'Task rejected',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPendingVerifications() {
        try {
            const userTasks = await this.achievementsService.getPendingVerifications();
            return {
                success: true,
                data: userTasks,
                count: userTasks.length,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserStats(publicKey) {
        try {
            const stats = await this.achievementsService.getUserStats(publicKey);
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AchievementsController = AchievementsController;
__decorate([
    (0, common_1.Post)('tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new task' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Task created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tasks' }),
    (0, swagger_1.ApiQuery)({ name: 'active', required: false, type: Boolean, description: 'Filter only active tasks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tasks retrieved successfully' }),
    __param(0, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('tasks/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get task by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getTaskById", null);
__decorate([
    (0, common_1.Put)('tasks/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update task' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)('tasks/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete task' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Get)('user-tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user tasks with progress' }),
    (0, swagger_1.ApiQuery)({ name: 'publicKey', required: true, description: 'User public key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User tasks retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserTasks", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit task completion' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or task not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_task_dto_1.SubmitTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "submitTask", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify submitted task (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User task not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_task_dto_1.VerifyTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "verifyTask", null);
__decorate([
    (0, common_1.Get)('pending-verifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending task verifications (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending verifications retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getPendingVerifications", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user achievement statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'publicKey', required: true, description: 'User public key' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User stats retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserStats", null);
exports.AchievementsController = AchievementsController = __decorate([
    (0, swagger_1.ApiTags)('achievements'),
    (0, common_1.Controller)('achievements'),
    __metadata("design:paramtypes", [achievements_service_1.AchievementsService])
], AchievementsController);
//# sourceMappingURL=achievements.controller.js.map