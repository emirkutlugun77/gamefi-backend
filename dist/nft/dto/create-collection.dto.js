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
exports.CreateCollectionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCollectionDto {
    adminPublicKey;
    name;
    symbol;
    royalty;
    description;
    image;
}
exports.CreateCollectionDto = CreateCollectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin public key that will sign the transaction',
        example: '8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "adminPublicKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection name',
        example: 'VYBE_BUILDINGS_COLLECTION',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection symbol',
        example: 'VYBEB',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Royalty percentage (0-100)',
        example: 5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateCollectionDto.prototype, "royalty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection description for metadata',
        example: 'Buildings collection for VYBE game',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Collection image URL or base64 data',
        example: 'https://example.com/collection.png',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCollectionDto.prototype, "image", void 0);
//# sourceMappingURL=create-collection.dto.js.map