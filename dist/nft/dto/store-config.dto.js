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
exports.UpdateStoreConfigDto = exports.CreateStoreConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateStoreConfigDto {
    tabName;
    collectionName;
    displayName;
    collectionId;
    sortOrder;
}
exports.CreateStoreConfigDto = CreateStoreConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tab name (building, troops, or others)',
        example: 'building',
        enum: ['building', 'troops', 'others'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['building', 'troops', 'others']),
    __metadata("design:type", String)
], CreateStoreConfigDto.prototype, "tabName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection name to fetch from',
        example: 'VYBE_BUILDINGS_COLLECTION',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStoreConfigDto.prototype, "collectionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display name for the tab',
        example: 'Buildings',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStoreConfigDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection mint address (optional)',
        example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStoreConfigDto.prototype, "collectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order for tabs',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateStoreConfigDto.prototype, "sortOrder", void 0);
class UpdateStoreConfigDto {
    collectionName;
    displayName;
    collectionId;
    isActive;
    sortOrder;
}
exports.UpdateStoreConfigDto = UpdateStoreConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection name to fetch from',
        example: 'VYBE_BUILDINGS_COLLECTION',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreConfigDto.prototype, "collectionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display name for the tab',
        example: 'Buildings',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreConfigDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection mint address',
        example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreConfigDto.prototype, "collectionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the tab is active',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateStoreConfigDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order for tabs',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateStoreConfigDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=store-config.dto.js.map