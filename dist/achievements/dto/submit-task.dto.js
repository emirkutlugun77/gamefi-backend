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
exports.SubmitTaskDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SubmitTaskDto {
    task_id;
    publicKey;
    submission_data;
}
exports.SubmitTaskDto = SubmitTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SubmitTaskDto.prototype, "task_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitTaskDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: { tweetUrl: 'https://twitter.com/user/status/123456789' },
        description: 'Proof/evidence for task completion',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitTaskDto.prototype, "submission_data", void 0);
//# sourceMappingURL=submit-task.dto.js.map