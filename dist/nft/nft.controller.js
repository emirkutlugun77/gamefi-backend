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
const web3_js_1 = require("@solana/web3.js");
const marketplace_response_dto_1 = require("./dto/marketplace-response.dto");
let NftController = class NftController {
    nftService;
    connection;
    adminKeypair;
    constructor(nftService) {
        this.nftService = nftService;
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        const adminPrivateKey = process.env.NFT_ADMIN_PRIVATE_KEY;
        if (!adminPrivateKey) {
            throw new Error('NFT_ADMIN_PRIVATE_KEY environment variable is required');
        }
        this.adminKeypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminPrivateKey)));
        console.log(`✅ Admin wallet loaded: ${this.adminKeypair.publicKey.toString()}`);
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
    async getStakedNFTs(walletAddress) {
        if (!walletAddress) {
            throw new common_1.HttpException({
                success: false,
                message: 'Wallet address is required'
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const stakes = await this.nftService.fetchStakedNFTs(walletAddress);
            return {
                success: true,
                data: {
                    stakes,
                    count: stakes.length
                }
            };
        }
        catch (error) {
            console.error('Error fetching staked NFTs:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch staked NFTs',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPendingRewards(walletAddress, nftMint) {
        if (!walletAddress || !nftMint) {
            throw new common_1.HttpException({
                success: false,
                message: 'Wallet address and NFT mint are required'
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const rewards = await this.nftService.calculatePendingRewards(walletAddress, nftMint);
            return {
                success: true,
                data: rewards
            };
        }
        catch (error) {
            console.error('Error calculating pending rewards:', error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Stake account not found',
                    error: error.message
                }, common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to calculate pending rewards',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async mintNft(body) {
        try {
            const { transaction: txBytes, nftMint, blockhash: clientBlockhash } = body;
            if (!txBytes || !Array.isArray(txBytes)) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid transaction data'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            console.log(`📝 Received transaction for NFT mint: ${nftMint}`);
            console.log(`📦 Transaction size: ${txBytes.length} bytes`);
            console.log(`🔑 Admin wallet: ${this.adminKeypair.publicKey.toString()}`);
            const transaction = web3_js_1.Transaction.from(Buffer.from(txBytes));
            console.log('🔄 Checking blockhash validity...');
            const { blockhash: latestBlockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
            let blockhashToUse = clientBlockhash || latestBlockhash;
            if (!transaction.recentBlockhash || transaction.recentBlockhash.toString() !== latestBlockhash) {
                blockhashToUse = latestBlockhash;
                console.log('🔄 Blockhash expired, using fresh blockhash');
            }
            else {
                console.log('✅ Client blockhash is still valid');
            }
            transaction.recentBlockhash = blockhashToUse;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            if (!transaction.feePayer) {
                transaction.feePayer = this.adminKeypair.publicKey;
            }
            console.log(`📝 Using blockhash: ${blockhashToUse.slice(0, 8)}...`);
            const adminPubkeyStr = this.adminKeypair.publicKey.toString();
            const adminPubkey = this.adminKeypair.publicKey;
            let adminKeyIndex = -1;
            for (let i = 0; i < transaction.instructions.length; i++) {
                const instruction = transaction.instructions[i];
                if (instruction.keys) {
                    const keyIndex = instruction.keys.findIndex((meta) => meta.pubkey.toString() === adminPubkeyStr);
                    if (keyIndex !== -1) {
                        adminKeyIndex = i;
                        break;
                    }
                }
            }
            let needsAdminSignature = false;
            for (const instruction of transaction.instructions) {
                if (instruction.keys) {
                    const adminMeta = instruction.keys.find((meta) => meta.pubkey.toString() === adminPubkeyStr && meta.isSigner);
                    if (adminMeta && adminMeta.isSigner) {
                        needsAdminSignature = true;
                        break;
                    }
                }
            }
            if (!needsAdminSignature) {
                console.warn(`⚠️  Admin wallet ${adminPubkeyStr} may not need to sign, but signing anyway...`);
            }
            transaction.partialSign(this.adminKeypair);
            console.log('✅ Transaction signed by admin');
            const fullySignedTx = transaction.serialize({
                requireAllSignatures: true,
                verifySignatures: false
            });
            console.log(`📤 Sending transaction (${fullySignedTx.length} bytes)...`);
            const signature = await this.connection.sendRawTransaction(fullySignedTx, {
                skipPreflight: false,
                maxRetries: 3,
            });
            console.log(`🚀 Transaction sent: ${signature}`);
            console.log('⏳ Waiting for confirmation...');
            const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }
            console.log('✅ Transaction confirmed!');
            return {
                success: true,
                signature,
                message: 'NFT minted successfully'
            };
        }
        catch (error) {
            console.error('❌ Error minting NFT:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to mint NFT',
                error: error.message || 'Unknown error'
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
__decorate([
    (0, common_1.Get)('staked/:walletAddress'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get staked NFTs for a wallet',
        description: 'Belirtilen wallet adresine ait stake edilmiş NFT\'leri blockchain\'den çeker'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staked NFTs successfully retrieved'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Wallet address is required' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('walletAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getStakedNFTs", null);
__decorate([
    (0, common_1.Get)('rewards/:walletAddress/:nftMint'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get pending rewards for a staked NFT',
        description: 'Belirtilen NFT için bekleyen ödülleri hesaplar'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rewards successfully calculated'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Wallet address and NFT mint are required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Stake account not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Param)('walletAddress')),
    __param(1, (0, common_1.Param)('nftMint')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "getPendingRewards", null);
__decorate([
    (0, common_1.Post)('admin/mint-nft'),
    (0, swagger_1.ApiOperation)({
        summary: 'Sign and send NFT mint transaction',
        description: 'Admin wallet ile transaction\'ı imzalayıp gönderir'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                transaction: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Serialized transaction bytes'
                },
                nftMint: {
                    type: 'string',
                    description: 'NFT mint public key'
                },
                blockhash: {
                    type: 'string',
                    description: 'Transaction blockhash (optional, will be refreshed if expired)'
                }
            },
            required: ['transaction', 'nftMint']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NftController.prototype, "mintNft", null);
exports.NftController = NftController = __decorate([
    (0, swagger_1.ApiTags)('nft'),
    (0, common_1.Controller)('nft'),
    __metadata("design:paramtypes", [nft_service_1.NftService])
], NftController);
//# sourceMappingURL=nft.controller.js.map