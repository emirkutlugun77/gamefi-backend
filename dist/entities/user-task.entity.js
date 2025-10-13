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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTask = exports.UserTaskStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const task_entity_1 = require("./task.entity");
var UserTaskStatus;
(function (UserTaskStatus) {
    UserTaskStatus["PENDING"] = "PENDING";
    UserTaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    UserTaskStatus["SUBMITTED"] = "SUBMITTED";
    UserTaskStatus["COMPLETED"] = "COMPLETED";
    UserTaskStatus["REJECTED"] = "REJECTED";
})(UserTaskStatus || (exports.UserTaskStatus = UserTaskStatus = {}));
let UserTask = class UserTask {
    id;
    user_id;
    user;
    task_id;
    task;
    status;
    submission_data;
    verification_result;
    completion_count;
    points_earned;
    started_at;
    completed_at;
    rejection_reason;
    created_at;
    updated_at;
};
exports.UserTask = UserTask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], UserTask.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserTask.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], UserTask.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", task_entity_1.Task)
], UserTask.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserTaskStatus, default: UserTaskStatus.PENDING }),
    __metadata("design:type", String)
], UserTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserTask.prototype, "submission_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserTask.prototype, "verification_result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTask.prototype, "completion_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UserTask.prototype, "points_earned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserTask.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], UserTask.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], UserTask.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserTask.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserTask.prototype, "updated_at", void 0);
exports.UserTask = UserTask = __decorate([
    (0, typeorm_1.Entity)('user_tasks'),
    (0, typeorm_1.Index)(['user_id', 'task_id'])
], UserTask);
//# sourceMappingURL=user-task.entity.js.map