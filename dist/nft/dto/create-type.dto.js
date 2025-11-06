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
exports.CreateTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTypeDto {
    collectionName;
    name;
    price;
    maxSupply;
    stakingAmount;
    description;
    image;
    additionalImages;
    attributes;
}
exports.CreateTypeDto = CreateTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection name to add this type to',
        example: 'VYBE_BUILDINGS_COLLECTION',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTypeDto.prototype, "collectionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT type name',
        example: 'Wooden House',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Price in SOL',
        example: 0.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTypeDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Maximum supply',
        example: 1000,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateTypeDto.prototype, "maxSupply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Staking reward in SOL per month (optional)',
        example: 0.01,
        required: false,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTypeDto.prototype, "stakingAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT description for metadata',
        example: 'A basic wooden house for your village',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Main image URL or base64 data',
        example: 'https://example.com/house.png',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTypeDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional images (optional)',
        example: [
            'https://example.com/house2.png',
            'https://example.com/house3.png',
        ],
        required: false,
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateTypeDto.prototype, "additionalImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT attributes (optional)',
        example: [
            { trait_type: 'Rarity', value: 'Common' },
            { trait_type: 'Type', value: 'Building' },
        ],
        required: false,
        type: 'array',
        items: {
            type: 'object',
            properties: {
                trait_type: { type: 'string' },
                value: { type: 'string' },
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTypeDto.prototype, "attributes", void 0);
//# sourceMappingURL=create-type.dto.js.map