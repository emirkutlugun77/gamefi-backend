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
exports.NftController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nft_service_1 = require("./nft.service");
const marketplace_response_dto_1 = require("./dto/marketplace-response.dto");
let NftController = class NftController {
    nftService;
    constructor(nftService) {
        this.nftService = nftService;
    }
    async getMarketplaceData() {
        try {
            const data = await this.nftService.getMarketplaceData();
            return {
                success: true,
                data
            };
        }
        catch (error) {
            console.error('Error fetching marketplace data:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch marketplace data',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCollections() {
        try {
            const { collections, itemTypesByCollection } = await this.nftService.fetchCollections();
            return {
                success: true,
                data: {
                    collections,
                    itemTypesByCollection
                }
            };
        }
        catch (error) {
            console.error('Error fetching collections:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch collections',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserNFTs(walletAddress) {
        if (!walletAddress) {
            throw new common_1.HttpException({
                success: false,
                message: 'Wallet address is required'
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const nfts = await this.nftService.fetchUserNFTs(walletAddress);
            return {
                success: true,
                data: {
                    nfts,
                    count: nfts.length
                }
            };
        }
        catch (error) {
            console.error('Error fetching user NFTs:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch user NFTs',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCollectionNFTs(collectionAddress) {
        try {
            const nfts = await this.nftService.getCollectionNFTs(collectionAddress);
            return {
                success: true,
                data: {
                    nfts,
                    count: nfts.length,
                    collection: collectionAddress || 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN'
                }
            };
        }
        catch (error) {
            console.error('Error fetching collection NFTs:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch collection NFTs',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMarketplaceInfo() {
        try {
            const marketplace = await this.nftService.fetchMarketplace();
            return {
                success: true,
                data: marketplace
            };
        }
        catch (error) {
            console.error('Error fetching marketplace info:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch marketplace info',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.NftController = NftController;
__decorate([
    (0, common_1.Get)('marketplace'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get complete marketplace data',
        description: 'Marketplace bilgileri, tüm koleksiyonlar ve item tiplerini blockchain\'den çeker'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Marketplace data successfully retrieved',
        type: marketplace_response_dto_1.MarketplaceDataResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getMarketplaceData", null);
__decorate([
    (0, common_1.Get)('collections'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get collections and item types',
        description: 'Sadece koleksiyonlar ve item tiplerini blockchain\'den çeker'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Collections successfully retrieved',
        type: marketplace_response_dto_1.CollectionsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getCollections", null);
__decorate([
    (0, common_1.Get)('user-nfts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user NFTs',
        description: 'Belirtilen wallet adresine ait NFT\'leri blockchain\'den çeker'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'wallet',
        description: 'Solana wallet public key',
        example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe',
        required: true
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User NFTs successfully retrieved',
        type: marketplace_response_dto_1.UserNFTsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Wallet address is required' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)('wallet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getUserNFTs", null);
__decorate([
    (0, common_1.Get)('collection-nfts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all NFTs in target collection',
        description: 'DAS API ile target collection\'daki tüm NFT\'leri çeker (VYBE_SUPERHEROES)'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'collection',
        description: 'Collection mint address (optional, defaults to VYBE_SUPERHEROES)',
        example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
        required: false
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Collection NFTs successfully retrieved',
        type: marketplace_response_dto_1.UserNFTsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)('collection')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getCollectionNFTs", null);
__decorate([
    (0, common_1.Get)('marketplace-info'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get marketplace info',
        description: 'Sadece marketplace temel bilgilerini blockchain\'den çeker'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Marketplace info successfully retrieved',
        type: marketplace_response_dto_1.MarketplaceInfoResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getMarketplaceInfo", null);
exports.NftController = NftController = __decorate([
    (0, swagger_1.ApiTags)('nft'),
    (0, common_1.Controller)('nft'),
    __metadata("design:paramtypes", [nft_service_1.NftService])
], NftController);
//# sourceMappingURL=nft.controller.js.map