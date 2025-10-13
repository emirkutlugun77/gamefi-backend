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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const choose_side_dto_1 = require("./dto/choose-side.dto");
const register_dto_1 = require("./dto/register.dto");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async getUsers() {
        return this.userService.findAll();
    }
    async getByPublicKey(publicKey) {
        if (!publicKey) {
            return { success: false, data: null };
        }
        const user = await this.userService.findByPublicKey(publicKey);
        return { success: true, data: user };
    }
    async getByTelegramId(telegramId) {
        if (!telegramId) {
            return { success: false, data: null };
        }
        const user = await this.userService.findByTelegramId(telegramId);
        return { success: true, data: user };
    }
    async getUser(id) {
        return this.userService.findOneById(id);
    }
    async register(body) {
        const user = await this.userService.register(body.publicKey, body.telegramId);
        return { success: true, data: user };
    }
    async chooseSide(body) {
        const user = await this.userService.chooseSide(body.publicKey, body.side);
        return { success: true, data: user };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List users' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('by-public-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by public key' }),
    (0, swagger_1.ApiQuery)({ name: 'publicKey', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'telegramId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User found' }),
    __param(0, (0, common_1.Query)('publicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getByPublicKey", null);
__decorate([
    (0, common_1.Get)('by-telegram-id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by telegram ID' }),
    (0, swagger_1.ApiQuery)({ name: 'telegramId', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Query)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getByTelegramId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register user by public key' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('choose-side'),
    (0, swagger_1.ApiOperation)({ summary: 'Choose side for user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [choose_side_dto_1.ChooseSideDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "chooseSide", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map