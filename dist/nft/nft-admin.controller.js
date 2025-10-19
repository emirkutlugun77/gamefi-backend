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
exports.NftAdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const nft_admin_service_1 = require("./nft-admin.service");
const create_collection_dto_1 = require("./dto/create-collection.dto");
const create_type_dto_1 = require("./dto/create-type.dto");
const store_config_dto_1 = require("./dto/store-config.dto");
let NftAdminController = class NftAdminController {
    nftAdminService;
    constructor(nftAdminService) {
        this.nftAdminService = nftAdminService;
    }
    async initializeMarketplace(req, body) {
        try {
            const feeBps = body?.feeBps || 500;
            return await this.nftAdminService.initializeMarketplaceWithAuth(req.user.encryptedPrivateKey, feeBps);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in initializeMarketplace controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to initialize marketplace',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMarketplaceStatus() {
        try {
            return await this.nftAdminService.checkMarketplaceStatus();
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in getMarketplaceStatus controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to get marketplace status',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createCollection(req, dto, image) {
        try {
            return await this.nftAdminService.createCollectionWithAuth(req.user.encryptedPrivateKey, dto, image);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in createCollection controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create collection',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createType(dto, files) {
        try {
            return await this.nftAdminService.createTypeWithFiles(dto, files);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in createType controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create NFT type',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllCollections() {
        try {
            const collections = await this.nftAdminService.getAllCollections();
            return {
                success: true,
                data: collections
            };
        }
        catch (error) {
            console.error('Error in getAllCollections controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch collections',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTypesByCollection(collectionName) {
        if (!collectionName) {
            throw new common_1.HttpException({
                success: false,
                message: 'Collection name is required'
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const types = await this.nftAdminService.getTypesByCollection(collectionName);
            return {
                success: true,
                data: types
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in getTypesByCollection controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch NFT types',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async setStoreConfig(dto) {
        try {
            const config = await this.nftAdminService.setStoreConfig(dto);
            return {
                success: true,
                data: config,
                message: 'Store configuration set successfully'
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in setStoreConfig controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to set store configuration',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateStoreConfig(tabName, dto) {
        try {
            const config = await this.nftAdminService.updateStoreConfig(tabName, dto);
            return {
                success: true,
                data: config,
                message: 'Store configuration updated successfully'
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in updateStoreConfig controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to update store configuration',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllStoreConfigs() {
        try {
            const configs = await this.nftAdminService.getAllStoreConfigs();
            return {
                success: true,
                data: configs
            };
        }
        catch (error) {
            console.error('Error in getAllStoreConfigs controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch store configurations',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStoreConfig(tabName) {
        try {
            const config = await this.nftAdminService.getStoreConfig(tabName);
            return {
                success: true,
                data: config
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in getStoreConfig controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch store configuration',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteStoreConfig(tabName) {
        try {
            await this.nftAdminService.deleteStoreConfig(tabName);
            return {
                success: true,
                message: 'Store configuration deleted successfully'
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error in deleteStoreConfig controller:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to delete store configuration',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.NftAdminController = NftAdminController;
__decorate([
    (0, common_1.Post)('initialize-marketplace'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initialize marketplace on Solana',
        description: 'Initializes the NFT marketplace smart contract. This must be done once before creating any collections. Requires JWT authentication.'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                feeBps: { type: 'number', example: 500, description: 'Marketplace fee in basis points (500 = 5%)' }
            }
        },
        required: false
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Marketplace initialized successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        signature: { type: 'string', example: '5Kq...' },
                        marketplacePda: { type: 'string', example: '9Aqrcm...' },
                        feeBps: { type: 'number', example: 500 },
                        explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing JWT token'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Marketplace already initialized'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "initializeMarketplace", null);
__decorate([
    (0, common_1.Get)('marketplace-status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Check marketplace initialization status',
        description: 'Check if the marketplace has been initialized on Solana'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Marketplace status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        isInitialized: { type: 'boolean', example: true },
                        marketplacePda: { type: 'string', example: '9Aqrcm...' },
                        message: { type: 'string', example: 'Marketplace is initialized and ready!' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "getMarketplaceStatus", null);
__decorate([
    (0, common_1.Post)('collection'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create NFT collection on Solana',
        description: 'Uploads image + metadata to IPFS, creates collection on-chain and returns transaction signature. Requires JWT authentication. Note: Marketplace must be initialized first.'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['name', 'symbol', 'royalty', 'description'],
            properties: {
                name: { type: 'string', example: 'VYBE_BUILDINGS_COLLECTION' },
                symbol: { type: 'string', example: 'VYBEB' },
                royalty: { type: 'number', example: 5 },
                description: { type: 'string', example: 'Buildings collection for VYBE game' },
                image: { type: 'string', format: 'binary', description: 'Collection image file' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Collection created successfully on Solana',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        signature: { type: 'string', example: '5Kq...' },
                        collectionPda: { type: 'string', example: '9Aqrcm...' },
                        collectionMint: { type: 'string', example: 'Cv7jep...' },
                        metadataUri: { type: 'string', example: 'ipfs://QmX...' },
                        explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing JWT token'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_collection_dto_1.CreateCollectionDto, Object]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "createCollection", null);
__decorate([
    (0, common_1.Post)('type'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'mainImage', maxCount: 1 },
        { name: 'additionalImages', maxCount: 10 }
    ])),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create NFT type with IPFS metadata',
        description: 'Creates a new NFT type for a collection and uploads images + metadata to IPFS via QuickNode'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['adminPublicKey', 'collectionName', 'name', 'price', 'maxSupply', 'description'],
            properties: {
                adminPublicKey: { type: 'string', example: 'Fn4P5PRhr7H58Ye1qcnaMvqDZAk3HGsgm6hDaXkVf46M' },
                collectionName: { type: 'string', example: 'VYBE_BUILDINGS_COLLECTION' },
                name: { type: 'string', example: 'Wooden House' },
                price: { type: 'number', example: 0.5 },
                maxSupply: { type: 'number', example: 1000 },
                stakingAmount: { type: 'number', example: 0.01 },
                description: { type: 'string', example: 'A basic wooden house for your village' },
                attributes: { type: 'string', example: '[{"trait_type":"Rarity","value":"Common"}]' },
                mainImage: { type: 'string', format: 'binary', description: 'Main NFT image file' },
                additionalImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Additional image files (optional)' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'NFT type created successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        nftType: { type: 'object' },
                        metadata: { type: 'object' },
                        metadataUri: { type: 'string', example: 'ipfs://QmX...' },
                        priceLamports: { type: 'number' },
                        stakingLamports: { type: 'number' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - Invalid input data'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Collection not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_type_dto_1.CreateTypeDto, Object]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "createType", null);
__decorate([
    (0, common_1.Get)('collections'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all collections',
        description: 'Retrieves all NFT collections from the database'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Collections retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { type: 'object' }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "getAllCollections", null);
__decorate([
    (0, common_1.Get)('types'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get NFT types by collection',
        description: 'Retrieves all NFT types for a specific collection'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'collection',
        description: 'Collection name',
        example: 'VYBE_BUILDINGS_COLLECTION',
        required: true
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'NFT types retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'array',
                    items: { type: 'object' }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Collection name is required'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Collection not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Query)('collection')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "getTypesByCollection", null);
__decorate([
    (0, common_1.Post)('store-config'),
    (0, swagger_1.ApiOperation)({
        summary: 'Set store configuration',
        description: 'Create or update store tab configuration (building, troops, others)'
    }),
    (0, swagger_1.ApiBody)({ type: store_config_dto_1.CreateStoreConfigDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Store configuration set successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Collection not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [store_config_dto_1.CreateStoreConfigDto]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "setStoreConfig", null);
__decorate([
    (0, common_1.Put)('store-config/:tabName'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update store configuration',
        description: 'Update an existing store tab configuration'
    }),
    (0, swagger_1.ApiParam)({
        name: 'tabName',
        description: 'Tab name (building, troops, or others)',
        example: 'building'
    }),
    (0, swagger_1.ApiBody)({ type: store_config_dto_1.UpdateStoreConfigDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store configuration updated successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Store configuration not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Param)('tabName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, store_config_dto_1.UpdateStoreConfigDto]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "updateStoreConfig", null);
__decorate([
    (0, common_1.Get)('store-configs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all store configurations',
        description: 'Retrieves all store tab configurations'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store configurations retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "getAllStoreConfigs", null);
__decorate([
    (0, common_1.Get)('store-config/:tabName'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get store configuration by tab name',
        description: 'Retrieves store configuration for a specific tab'
    }),
    (0, swagger_1.ApiParam)({
        name: 'tabName',
        description: 'Tab name (building, troops, or others)',
        example: 'building'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store configuration retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Store configuration not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Param)('tabName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "getStoreConfig", null);
__decorate([
    (0, common_1.Delete)('store-config/:tabName'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete store configuration',
        description: 'Deletes store configuration for a specific tab'
    }),
    (0, swagger_1.ApiParam)({
        name: 'tabName',
        description: 'Tab name (building, troops, or others)',
        example: 'building'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store configuration deleted successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Store configuration not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Internal server error'
    }),
    __param(0, (0, common_1.Param)('tabName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftAdminController.prototype, "deleteStoreConfig", null);
exports.NftAdminController = NftAdminController = __decorate([
    (0, swagger_1.ApiTags)('nft-admin'),
    (0, common_1.Controller)('nft-admin'),
    __metadata("design:paramtypes", [nft_admin_service_1.NftAdminService])
], NftAdminController);
//# sourceMappingURL=nft-admin.controller.js.map