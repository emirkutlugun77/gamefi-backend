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
exports.MarketplaceInfoResponseDto = exports.UserNFTsResponseDto = exports.CollectionsResponseDto = exports.MarketplaceDataResponseDto = exports.UserNFTDto = exports.NFTItemTypeDto = exports.NFTCollectionDto = exports.MarketplaceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MarketplaceDto {
    admin;
    fee_bps;
    total_collections;
    bump;
}
exports.MarketplaceDto = MarketplaceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Marketplace admin public key' }),
    __metadata("design:type", String)
], MarketplaceDto.prototype, "admin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Fee in basis points (e.g., 500 = 5%)',
        example: 500,
    }),
    __metadata("design:type", Number)
], MarketplaceDto.prototype, "fee_bps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of collections', example: 3 }),
    __metadata("design:type", Number)
], MarketplaceDto.prototype, "total_collections", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PDA bump seed', example: 252 }),
    __metadata("design:type", Number)
], MarketplaceDto.prototype, "bump", void 0);
class NFTCollectionDto {
    admin;
    name;
    symbol;
    uri;
    royalty;
    mint;
    is_active;
    bump;
    pda;
}
exports.NFTCollectionDto = NFTCollectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection admin public key' }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "admin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection name', example: 'VYBE_SUPERHEROES' }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection symbol', example: 'HEROES' }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metadata URI' }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "uri", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Royalty in basis points', example: 500 }),
    __metadata("design:type", Number)
], NFTCollectionDto.prototype, "royalty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection mint public key' }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "mint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether collection is active', example: true }),
    __metadata("design:type", Boolean)
], NFTCollectionDto.prototype, "is_active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PDA bump seed' }),
    __metadata("design:type", Number)
], NFTCollectionDto.prototype, "bump", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection PDA address', required: false }),
    __metadata("design:type", String)
], NFTCollectionDto.prototype, "pda", void 0);
class NFTItemTypeDto {
    collection;
    name;
    uri;
    price;
    max_supply;
    current_supply;
    bump;
    mainImage;
    additionalImages;
    stakingAmount;
}
exports.NFTItemTypeDto = NFTItemTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Parent collection PDA' }),
    __metadata("design:type", String)
], NFTItemTypeDto.prototype, "collection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item type name', example: 'Knight' }),
    __metadata("design:type", String)
], NFTItemTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metadata URI' }),
    __metadata("design:type", String)
], NFTItemTypeDto.prototype, "uri", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Price in lamports', example: 50000000 }),
    __metadata("design:type", Number)
], NFTItemTypeDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Maximum supply', example: 100000 }),
    __metadata("design:type", Number)
], NFTItemTypeDto.prototype, "max_supply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current supply', example: 0 }),
    __metadata("design:type", Number)
], NFTItemTypeDto.prototype, "current_supply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PDA bump seed' }),
    __metadata("design:type", Number)
], NFTItemTypeDto.prototype, "bump", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Main image URL', required: false }),
    __metadata("design:type", String)
], NFTItemTypeDto.prototype, "mainImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional images array', required: false }),
    __metadata("design:type", Array)
], NFTItemTypeDto.prototype, "additionalImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Staking reward amount per month',
        required: false,
        example: 100,
    }),
    __metadata("design:type", Number)
], NFTItemTypeDto.prototype, "stakingAmount", void 0);
class UserNFTDto {
    mint;
    metadata;
    name;
    image;
    mainImage;
    additionalImages;
    collectionName;
}
exports.UserNFTDto = UserNFTDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT mint address' }),
    __metadata("design:type", String)
], UserNFTDto.prototype, "mint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT metadata JSON', required: false }),
    __metadata("design:type", Object)
], UserNFTDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT name', example: 'Knight #001' }),
    __metadata("design:type", String)
], UserNFTDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NFT image URL' }),
    __metadata("design:type", String)
], UserNFTDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Main image URL', required: false }),
    __metadata("design:type", String)
], UserNFTDto.prototype, "mainImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional images array', required: false }),
    __metadata("design:type", Array)
], UserNFTDto.prototype, "additionalImages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collection name', required: false }),
    __metadata("design:type", String)
], UserNFTDto.prototype, "collectionName", void 0);
class MarketplaceDataResponseDto {
    success;
    data;
}
exports.MarketplaceDataResponseDto = MarketplaceDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], MarketplaceDataResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Marketplace data including collections and item types',
    }),
    __metadata("design:type", Object)
], MarketplaceDataResponseDto.prototype, "data", void 0);
class CollectionsResponseDto {
    success;
    data;
}
exports.CollectionsResponseDto = CollectionsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], CollectionsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Collections and item types data' }),
    __metadata("design:type", Object)
], CollectionsResponseDto.prototype, "data", void 0);
class UserNFTsResponseDto {
    success;
    data;
}
exports.UserNFTsResponseDto = UserNFTsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserNFTsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User NFTs data' }),
    __metadata("design:type", Object)
], UserNFTsResponseDto.prototype, "data", void 0);
class MarketplaceInfoResponseDto {
    success;
    data;
}
exports.MarketplaceInfoResponseDto = MarketplaceInfoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], MarketplaceInfoResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: MarketplaceDto }),
    __metadata("design:type", MarketplaceDto)
], MarketplaceInfoResponseDto.prototype, "data", void 0);
//# sourceMappingURL=marketplace-response.dto.js.map