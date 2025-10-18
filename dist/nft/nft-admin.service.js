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
exports.NftAdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const web3_js_1 = require("@solana/web3.js");
const nft_collection_entity_1 = require("../entities/nft-collection.entity");
const nft_type_entity_1 = require("../entities/nft-type.entity");
const store_config_entity_1 = require("../entities/store-config.entity");
const PROGRAM_ID = new web3_js_1.PublicKey('Cvz71nzvusTyvH6GzeuHSVKPAGABH2q5tw2HRJdmzvEj');
const QUICKNODE_IPFS_URL = 'https://skilled-aged-lambo.solana-devnet.quiknode.pro/e9123242ac843b701a00c0975743cf7f13953692';
let NftAdminService = class NftAdminService {
    nftCollectionRepo;
    nftTypeRepo;
    storeConfigRepo;
    connection;
    constructor(nftCollectionRepo, nftTypeRepo, storeConfigRepo) {
        this.nftCollectionRepo = nftCollectionRepo;
        this.nftTypeRepo = nftTypeRepo;
        this.storeConfigRepo = storeConfigRepo;
        this.connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
    }
    async uploadToIPFS(metadata) {
        try {
            console.log('Uploading to QuickNode IPFS:', JSON.stringify(metadata, null, 2));
            const response = await fetch(`${QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: 'metadata.json',
                    content: JSON.stringify(metadata)
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('IPFS upload failed:', errorText);
                throw new Error(`IPFS upload failed: ${response.statusText}`);
            }
            const result = await response.json();
            const ipfsHash = result.Hash;
            const ipfsUri = `ipfs://${ipfsHash}`;
            console.log('✅ Uploaded to IPFS:', ipfsUri);
            return ipfsUri;
        }
        catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to upload metadata to IPFS',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async uploadFileToIPFS(fileBuffer, filename) {
        try {
            console.log('Uploading file to IPFS:', filename);
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', fileBuffer, filename);
            const response = await fetch(`${QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {
                method: 'POST',
                body: form,
                headers: form.getHeaders(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('IPFS file upload failed:', errorText);
                throw new Error(`File upload failed: ${response.statusText}`);
            }
            const result = await response.json();
            const ipfsUri = `ipfs://${result.Hash}`;
            console.log('✅ File uploaded to IPFS:', ipfsUri);
            return ipfsUri;
        }
        catch (error) {
            console.error('Error uploading file to IPFS:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to upload file to IPFS',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async uploadImageToIPFS(imageData) {
        try {
            if (imageData.startsWith('ipfs://')) {
                return imageData;
            }
            if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
                return imageData;
            }
            if (imageData.startsWith('data:image')) {
                console.log('Uploading base64 image to IPFS...');
                const base64Data = imageData.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                return await this.uploadFileToIPFS(buffer, 'image.png');
            }
            return imageData;
        }
        catch (error) {
            console.error('Error uploading image to IPFS:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to upload image to IPFS',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createCollection(dto) {
        try {
            let adminPubkey;
            try {
                adminPubkey = new web3_js_1.PublicKey(dto.adminPublicKey);
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid admin public key'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const imageUri = await this.uploadImageToIPFS(dto.image);
            const metadata = {
                name: dto.name,
                symbol: dto.symbol,
                description: dto.description,
                image: imageUri,
                external_url: 'https://vybe.game',
                attributes: [],
                properties: {
                    category: 'image',
                    files: [
                        {
                            uri: imageUri,
                            type: 'image/png'
                        }
                    ]
                }
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const collection = this.nftCollectionRepo.create({
                id: `${dto.name}_${Date.now()}`,
                admin: dto.adminPublicKey,
                name: dto.name,
                symbol: dto.symbol,
                uri: metadataUri,
                royalty: dto.royalty,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await this.nftCollectionRepo.save(collection);
            console.log('✅ Collection created in database:', collection);
            return {
                success: true,
                data: {
                    collection,
                    metadata,
                    metadataUri,
                    message: 'Collection created successfully. Please create the collection on-chain using the provided metadata URI.'
                }
            };
        }
        catch (error) {
            console.error('Error creating collection:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create collection',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createType(dto) {
        try {
            let adminPubkey;
            try {
                adminPubkey = new web3_js_1.PublicKey(dto.adminPublicKey);
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid admin public key'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName }
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const mainImageUri = await this.uploadImageToIPFS(dto.image);
            let additionalImageUris = [];
            if (dto.additionalImages && dto.additionalImages.length > 0) {
                console.log('Uploading additional images...');
                additionalImageUris = await Promise.all(dto.additionalImages.map(img => this.uploadImageToIPFS(img)));
            }
            const metadata = {
                name: dto.name,
                symbol: collection.symbol,
                description: dto.description,
                image: mainImageUri,
                external_url: 'https://vybe.game',
                attributes: dto.attributes || [],
                properties: {
                    category: 'image',
                    files: [
                        {
                            uri: mainImageUri,
                            type: 'image/png'
                        },
                        ...additionalImageUris.map(uri => ({
                            uri,
                            type: 'image/png'
                        }))
                    ]
                },
                additionalImages: additionalImageUris
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const priceLamports = Math.floor(dto.price * 1_000_000_000);
            const stakingLamports = dto.stakingAmount ? Math.floor(dto.stakingAmount * 1_000_000_000) : 0;
            const nftType = this.nftTypeRepo.create({
                id: `${dto.collectionName}_${dto.name}_${Date.now()}`,
                collectionId: collection.id,
                name: dto.name,
                uri: metadataUri,
                price: priceLamports.toString(),
                maxSupply: dto.maxSupply.toString(),
                currentSupply: '0',
                stakingAmount: stakingLamports.toString(),
                mainImage: mainImageUri,
                additionalImages: JSON.stringify(additionalImageUris),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await this.nftTypeRepo.save(nftType);
            console.log('✅ NFT Type created in database:', nftType);
            return {
                success: true,
                data: {
                    nftType,
                    metadata,
                    metadataUri,
                    priceLamports,
                    stakingLamports,
                    message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.'
                }
            };
        }
        catch (error) {
            console.error('Error creating NFT type:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create NFT type',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllCollections() {
        return this.nftCollectionRepo.find({
            relations: ['nftTypes'],
            order: { createdAt: 'DESC' }
        });
    }
    async getTypesByCollection(collectionName) {
        const collection = await this.nftCollectionRepo.findOne({
            where: { name: collectionName }
        });
        if (!collection) {
            throw new common_1.HttpException({
                success: false,
                message: `Collection not found: ${collectionName}`
            }, common_1.HttpStatus.NOT_FOUND);
        }
        return this.nftTypeRepo.find({
            where: { collectionId: collection.id },
            order: { createdAt: 'DESC' }
        });
    }
    async setStoreConfig(dto) {
        const collection = await this.nftCollectionRepo.findOne({
            where: { name: dto.collectionName }
        });
        if (!collection) {
            throw new common_1.HttpException({
                success: false,
                message: `Collection not found: ${dto.collectionName}`
            }, common_1.HttpStatus.NOT_FOUND);
        }
        let config = await this.storeConfigRepo.findOne({
            where: { tabName: dto.tabName }
        });
        if (config) {
            config.collectionName = dto.collectionName;
            config.displayName = dto.displayName;
            config.collectionId = dto.collectionId || collection.id;
            config.sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : config.sortOrder;
            config.updatedAt = new Date();
        }
        else {
            config = this.storeConfigRepo.create({
                tabName: dto.tabName,
                collectionName: dto.collectionName,
                displayName: dto.displayName,
                collectionId: dto.collectionId || collection.id,
                isActive: true,
                sortOrder: dto.sortOrder || 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        return this.storeConfigRepo.save(config);
    }
    async updateStoreConfig(tabName, dto) {
        const config = await this.storeConfigRepo.findOne({
            where: { tabName }
        });
        if (!config) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`
            }, common_1.HttpStatus.NOT_FOUND);
        }
        if (dto.collectionName) {
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName }
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`
                }, common_1.HttpStatus.NOT_FOUND);
            }
            config.collectionName = dto.collectionName;
            config.collectionId = collection.id;
        }
        if (dto.displayName !== undefined)
            config.displayName = dto.displayName;
        if (dto.collectionId !== undefined)
            config.collectionId = dto.collectionId;
        if (dto.isActive !== undefined)
            config.isActive = dto.isActive;
        if (dto.sortOrder !== undefined)
            config.sortOrder = dto.sortOrder;
        config.updatedAt = new Date();
        return this.storeConfigRepo.save(config);
    }
    async getAllStoreConfigs() {
        return this.storeConfigRepo.find({
            order: { sortOrder: 'ASC' }
        });
    }
    async getStoreConfig(tabName) {
        const config = await this.storeConfigRepo.findOne({
            where: { tabName }
        });
        if (!config) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`
            }, common_1.HttpStatus.NOT_FOUND);
        }
        return config;
    }
    async deleteStoreConfig(tabName) {
        const result = await this.storeConfigRepo.delete({ tabName });
        if (result.affected === 0) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`
            }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async createCollectionWithFile(dto, imageFile) {
        try {
            let adminPubkey;
            try {
                adminPubkey = new web3_js_1.PublicKey(dto.adminPublicKey);
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid admin public key'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (!imageFile) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Image file is required'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname);
            const metadata = {
                name: dto.name,
                symbol: dto.symbol,
                description: dto.description,
                image: imageUri,
                external_url: 'https://vybe.game',
                attributes: [],
                properties: {
                    category: 'image',
                    files: [
                        {
                            uri: imageUri,
                            type: imageFile.mimetype
                        }
                    ]
                }
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const collection = this.nftCollectionRepo.create({
                id: `${dto.name}_${Date.now()}`,
                admin: dto.adminPublicKey,
                name: dto.name,
                symbol: dto.symbol,
                uri: metadataUri,
                royalty: dto.royalty,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await this.nftCollectionRepo.save(collection);
            console.log('✅ Collection created with file upload:', collection);
            return {
                success: true,
                data: {
                    collection,
                    metadata,
                    metadataUri,
                    message: 'Collection created successfully. Please create the collection on-chain using the provided metadata URI.'
                }
            };
        }
        catch (error) {
            console.error('Error creating collection with file:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create collection',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTypeWithFiles(dto, files) {
        try {
            let adminPubkey;
            try {
                adminPubkey = new web3_js_1.PublicKey(dto.adminPublicKey);
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid admin public key'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName }
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`
                }, common_1.HttpStatus.NOT_FOUND);
            }
            if (!files.mainImage || files.mainImage.length === 0) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Main image file is required'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const mainImageFile = files.mainImage[0];
            const mainImageUri = await this.uploadFileToIPFS(mainImageFile.buffer, mainImageFile.originalname);
            let additionalImageUris = [];
            if (files.additionalImages && files.additionalImages.length > 0) {
                console.log('Uploading additional images...');
                additionalImageUris = await Promise.all(files.additionalImages.map(file => this.uploadFileToIPFS(file.buffer, file.originalname)));
            }
            let attributes = [];
            if (dto.attributes) {
                try {
                    attributes = typeof dto.attributes === 'string'
                        ? JSON.parse(dto.attributes)
                        : dto.attributes;
                }
                catch (e) {
                    console.warn('Failed to parse attributes:', e);
                }
            }
            const allFiles = [
                {
                    uri: mainImageUri,
                    type: mainImageFile.mimetype
                },
                ...additionalImageUris.map((uri, idx) => ({
                    uri,
                    type: files.additionalImages ? files.additionalImages[idx].mimetype : 'image/png'
                }))
            ];
            const metadata = {
                name: dto.name,
                symbol: collection.symbol,
                description: dto.description,
                image: mainImageUri,
                external_url: 'https://vybe.game',
                attributes,
                properties: {
                    category: 'image',
                    files: allFiles
                },
                additionalImages: additionalImageUris
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
            const stakingLamports = dto.stakingAmount ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000) : 0;
            const nftType = this.nftTypeRepo.create({
                id: `${dto.collectionName}_${dto.name}_${Date.now()}`,
                collectionId: collection.id,
                name: dto.name,
                uri: metadataUri,
                price: priceLamports.toString(),
                maxSupply: dto.maxSupply.toString(),
                currentSupply: '0',
                stakingAmount: stakingLamports.toString(),
                mainImage: mainImageUri,
                additionalImages: JSON.stringify(additionalImageUris),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await this.nftTypeRepo.save(nftType);
            console.log('✅ NFT Type created with file uploads:', nftType);
            return {
                success: true,
                data: {
                    nftType,
                    metadata,
                    metadataUri,
                    priceLamports,
                    stakingLamports,
                    message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.'
                }
            };
        }
        catch (error) {
            console.error('Error creating NFT type with files:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create NFT type',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.NftAdminService = NftAdminService;
exports.NftAdminService = NftAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(nft_collection_entity_1.NftCollection)),
    __param(1, (0, typeorm_1.InjectRepository)(nft_type_entity_1.NftType)),
    __param(2, (0, typeorm_1.InjectRepository)(store_config_entity_1.StoreConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NftAdminService);
//# sourceMappingURL=nft-admin.service.js.map