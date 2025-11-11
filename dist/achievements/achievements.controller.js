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
const submit_transaction_task_dto_1 = require("./dto/submit-transaction-task.dto");
const generate_code_dto_1 = require("./dto/generate-code.dto");
const verify_twitter_code_dto_1 = require("./dto/verify-twitter-code.dto");
const check_transaction_status_dto_1 = require("./dto/check-transaction-status.dto");
const submit_text_task_dto_1 = require("./dto/submit-text-task.dto");
const submit_image_task_dto_1 = require("./dto/submit-image-task.dto");
const review_task_input_dto_1 = require("./dto/review-task-input.dto");
const task_transaction_service_1 = require("./services/task-transaction.service");
const user_code_service_1 = require("./services/user-code.service");
const twitter_verification_service_1 = require("./services/twitter-verification.service");
const prerequisite_validator_service_1 = require("./services/prerequisite-validator.service");
let AchievementsController = class AchievementsController {
    achievementsService;
    transactionService;
    codeService;
    twitterService;
    prerequisiteService;
    constructor(achievementsService, transactionService, codeService, twitterService, prerequisiteService) {
        this.achievementsService = achievementsService;
        this.transactionService = transactionService;
        this.codeService = codeService;
        this.twitterService = twitterService;
        this.prerequisiteService = prerequisiteService;
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
    async getTaskConfigOptions() {
        try {
            const options = await this.achievementsService.getTaskConfigOptions();
            return {
                success: true,
                data: options,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to load task configuration options',
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
    async submitTextTask(dto) {
        try {
            const taskInput = await this.achievementsService.submitTextTask(dto.task_id, dto.publicKey, dto.content);
            return {
                success: true,
                data: taskInput,
                message: 'Text submitted successfully for review',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async submitImageTask(dto) {
        try {
            const taskInput = await this.achievementsService.submitImageTask(dto.task_id, dto.publicKey, dto.image_url, dto.description, dto.metadata);
            return {
                success: true,
                data: taskInput,
                message: 'Image submitted successfully for review',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async reviewTaskInput(dto) {
        try {
            const taskInput = await this.achievementsService.reviewTaskInput(dto.input_id, dto.approved, dto.reviewed_by, dto.review_comment);
            return {
                success: true,
                data: taskInput,
                message: dto.approved
                    ? 'Task input approved and points awarded'
                    : 'Task input rejected',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserTaskInputs(publicKey) {
        try {
            const inputs = await this.achievementsService.getUserTaskInputs(publicKey);
            return {
                success: true,
                data: inputs,
                count: inputs.length,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPendingTaskInputs() {
        try {
            const inputs = await this.achievementsService.getPendingTaskInputs();
            return {
                success: true,
                data: inputs,
                count: inputs.length,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async submitTransactionTask(dto) {
        try {
            const userTask = await this.achievementsService.submitTask({
                task_id: dto.task_id,
                publicKey: dto.publicKey,
                submission_data: {
                    signature: dto.signature,
                    transaction_type: dto.transaction_type,
                },
            });
            const transaction = await this.transactionService.createTransaction(userTask.id, dto.signature, dto.transaction_type, dto.transaction_config, dto.required_confirmations || 1);
            return {
                success: true,
                data: {
                    userTask,
                    transaction,
                },
                message: 'Transaction task submitted. Waiting for confirmation...',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkTransactionStatus(dto) {
        try {
            const transaction = await this.transactionService.verifyTransaction(dto.signature);
            return {
                success: true,
                data: transaction,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateCode(dto) {
        try {
            const userCode = await this.codeService.generateCodeForUser(dto.publicKey, dto.task_id, dto.code_type, dto.metadata, dto.expires_in_hours);
            return {
                success: true,
                data: {
                    code: userCode.code,
                    expires_at: userCode.expires_at,
                    metadata: userCode.metadata,
                },
                message: 'Code generated successfully',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMyCodes(publicKey) {
        try {
            const codes = await this.codeService.getCodesForUser(publicKey);
            return {
                success: true,
                data: codes,
                count: codes.length,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyTwitterCode(dto) {
        try {
            const result = await this.twitterService.verifyTweetWithCodeAndVideo(dto.code, dto.tweet_url, dto.video_url);
            return {
                success: result.verified,
                data: result,
                message: result.message,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkPrerequisites(taskId, publicKey) {
        try {
            const user = await this.achievementsService['userRepository'].findOne({
                where: { publicKey },
            });
            if (!user) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            const result = await this.prerequisiteService.validatePrerequisites(taskId, user.id);
            return {
                success: true,
                data: result,
                message: result.valid
                    ? 'All prerequisites met'
                    : 'Some prerequisites are not met',
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
    (0, swagger_1.ApiQuery)({
        name: 'active',
        required: false,
        type: Boolean,
        description: 'Filter only active tasks',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tasks retrieved successfully' }),
    __param(0, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)('tasks/config-options'),
    (0, swagger_1.ApiOperation)({ summary: 'Get config metadata for task creation' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration metadata retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getTaskConfigOptions", null);
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
    (0, swagger_1.ApiQuery)({
        name: 'publicKey',
        required: true,
        description: 'User public key',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User tasks retrieved successfully',
    }),
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
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Pending verifications retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getPendingVerifications", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user achievement statistics' }),
    (0, swagger_1.ApiQuery)({
        name: 'publicKey',
        required: true,
        description: 'User public key',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User stats retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Post)('submit-text'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit text for a text submission task' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Text submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or task not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_text_task_dto_1.SubmitTextTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "submitTextTask", null);
__decorate([
    (0, common_1.Post)('submit-image'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit image for an image submission task' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or task not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_image_task_dto_1.SubmitImageTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "submitImageTask", null);
__decorate([
    (0, common_1.Post)('review-task-input'),
    (0, swagger_1.ApiOperation)({ summary: 'Review and approve/reject task input (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Task input reviewed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Task input not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_task_input_dto_1.ReviewTaskInputDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "reviewTaskInput", null);
__decorate([
    (0, common_1.Get)('user-task-inputs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user task inputs (text/image submissions)' }),
    (0, swagger_1.ApiQuery)({
        name: 'publicKey',
        required: true,
        description: 'User public key',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User task inputs retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getUserTaskInputs", null);
__decorate([
    (0, common_1.Get)('pending-task-inputs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending task inputs for review (Admin)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Pending task inputs retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getPendingTaskInputs", null);
__decorate([
    (0, common_1.Post)('submit-transaction-task'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a transaction-based task' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction task submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_transaction_task_dto_1.SubmitTransactionTaskDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "submitTransactionTask", null);
__decorate([
    (0, common_1.Post)('check-transaction-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check transaction status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction status retrieved' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_transaction_status_dto_1.CheckTransactionStatusDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "checkTransactionStatus", null);
__decorate([
    (0, common_1.Post)('generate-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a verification code for a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Code generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_code_dto_1.GenerateCodeDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "generateCode", null);
__decorate([
    (0, common_1.Get)('my-codes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user codes' }),
    (0, swagger_1.ApiQuery)({ name: 'publicKey', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Codes retrieved successfully' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "getMyCodes", null);
__decorate([
    (0, common_1.Post)('verify-twitter-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Twitter code and video embed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification completed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_twitter_code_dto_1.VerifyTwitterCodeDto]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "verifyTwitterCode", null);
__decorate([
    (0, common_1.Get)('check-prerequisites/:taskId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if user meets task prerequisites' }),
    (0, swagger_1.ApiParam)({ name: 'taskId', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'publicKey', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prerequisites checked' }),
    __param(0, (0, common_1.Param)('taskId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AchievementsController.prototype, "checkPrerequisites", null);
exports.AchievementsController = AchievementsController = __decorate([
    (0, swagger_1.ApiTags)('achievements'),
    (0, common_1.Controller)('achievements'),
    __metadata("design:paramtypes", [achievements_service_1.AchievementsService,
        task_transaction_service_1.TaskTransactionService,
        user_code_service_1.UserCodeService,
        twitter_verification_service_1.TwitterVerificationService,
        prerequisite_validator_service_1.PrerequisiteValidatorService])
], AchievementsController);
//# sourceMappingURL=achievements.controller.js.map