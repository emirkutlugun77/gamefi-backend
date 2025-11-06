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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const solana_contract_service_1 = require("./solana-contract.service");
const nft_service_1 = require("./nft.service");
const auth_service_1 = require("../auth/auth.service");
const axios_1 = __importDefault(require("axios"));
const PROGRAM_ID = new web3_js_1.PublicKey('B6c38JtYJXDiaW2XNJWrueLUULAD4vsxChz1VJk1d9zX');
let NftAdminService = class NftAdminService {
    nftCollectionRepo;
    nftTypeRepo;
    storeConfigRepo;
    solanaContractService;
    nftService;
    authService;
    connection;
    constructor(nftCollectionRepo, nftTypeRepo, storeConfigRepo, solanaContractService, nftService, authService) {
        this.nftCollectionRepo = nftCollectionRepo;
        this.nftTypeRepo = nftTypeRepo;
        this.storeConfigRepo = storeConfigRepo;
        this.solanaContractService = solanaContractService;
        this.nftService = nftService;
        this.authService = authService;
        this.connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
    }
    async uploadToIPFS(metadata) {
        try {
            console.log('Uploading metadata to QuickNode IPFS:', JSON.stringify(metadata, null, 2));
            const apiKey = process.env.QUICKNODE_IPFS_API_KEY;
            if (!apiKey) {
                throw new Error('QUICKNODE_IPFS_API_KEY is not configured');
            }
            const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf-8');
            const fileName = `metadata_${Date.now()}.json`;
            const FormData = require('form-data');
            const form = new FormData();
            form.append('Body', metadataBuffer, {
                filename: fileName,
            });
            form.append('Key', fileName);
            form.append('ContentType', 'application/json');
            const response = await axios_1.default.post('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', form, {
                headers: {
                    'x-api-key': apiKey,
                    ...form.getHeaders(),
                },
            });
            const result = response.data;
            const cid = this.extractCIDFromResponse(result);
            const gatewayBaseUrl = process.env.QUICKNODE_IPFS_GATEWAY_URL ||
                'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
            const gatewayUrl = `${gatewayBaseUrl}/${cid}`;
            console.log('✅ Uploaded metadata to IPFS');
            console.log('   CID:', cid);
            console.log('   Gateway URL:', gatewayUrl);
            return gatewayUrl;
        }
        catch (error) {
            console.error('Error uploading metadata to IPFS:', error);
            const errorMessage = error.response?.data?.message || error.message;
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to upload metadata to IPFS',
                error: errorMessage,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async uploadFileToIPFS(fileBuffer, filename, customName) {
        try {
            console.log('Uploading file to QuickNode IPFS:', filename);
            const apiKey = process.env.QUICKNODE_IPFS_API_KEY;
            if (!apiKey) {
                throw new Error('QUICKNODE_IPFS_API_KEY is not configured');
            }
            const finalFilename = customName || filename;
            const fileKey = `${finalFilename}_${Date.now()}`;
            const contentType = this.getMimeType(filename);
            const FormData = require('form-data');
            const form = new FormData();
            form.append('Body', fileBuffer, {
                filename: filename,
                contentType: contentType,
            });
            form.append('Key', fileKey);
            form.append('ContentType', contentType);
            const response = await axios_1.default.post('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', form, {
                headers: {
                    'x-api-key': apiKey,
                    ...form.getHeaders(),
                },
            });
            const result = response.data;
            const cid = this.extractCIDFromResponse(result);
            const gatewayBaseUrl = process.env.QUICKNODE_IPFS_GATEWAY_URL ||
                'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
            const gatewayUrl = `${gatewayBaseUrl}/${cid}`;
            console.log('✅ File uploaded to IPFS');
            console.log('   CID:', cid);
            console.log('   Gateway URL:', gatewayUrl);
            return gatewayUrl;
        }
        catch (error) {
            console.error('Error uploading file to IPFS:', error);
            const errorMessage = error.response?.data?.message || error.message;
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to upload file to IPFS',
                error: errorMessage,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    extractCIDFromResponse(result) {
        console.log('QuickNode IPFS response (full):', JSON.stringify(result, null, 2));
        let cid = result.pin?.cid ||
            result.cid ||
            result.ipfsHash ||
            result.IpfsHash ||
            result.hash;
        if (!cid && result.requestid) {
            const reqId = result.requestid;
            if (reqId.startsWith('Qm') || reqId.startsWith('b')) {
                cid = reqId;
            }
            else {
                console.warn('⚠️  requestid does not look like a valid CID:', reqId);
                console.warn('   Expected CID to start with "Qm" or "b"');
            }
        }
        if (!cid) {
            console.error('❌ No valid CID found in response');
            console.error('   Available fields:', Object.keys(result));
            console.error('   Full response:', result);
            throw new Error('Failed to get CID from IPFS upload response. Check QuickNode API response format.');
        }
        return cid;
    }
    getMimeType(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            json: 'application/json',
        };
        return mimeTypes[ext || ''] || 'application/octet-stream';
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
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createCollection(dto) {
        try {
            if (dto.adminPublicKey) {
                try {
                    new web3_js_1.PublicKey(dto.adminPublicKey);
                }
                catch (error) {
                    throw new common_1.HttpException({
                        success: false,
                        message: 'Invalid admin public key',
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
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
                            type: 'image/png',
                        },
                    ],
                },
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const collection = this.nftCollectionRepo.create({
                id: `${dto.name}_${Date.now()}`,
                admin: dto.adminPublicKey || 'pending',
                name: dto.name,
                symbol: dto.symbol,
                uri: metadataUri,
                royalty: dto.royalty,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.nftCollectionRepo.save(collection);
            console.log('✅ Collection created in database:', collection);
            return {
                success: true,
                data: {
                    collection,
                    metadata,
                    metadataUri,
                    message: 'Collection created successfully. Please create the collection on-chain using the provided metadata URI.',
                },
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
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createType(dto) {
        try {
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName },
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const mainImageUri = await this.uploadImageToIPFS(dto.image);
            let additionalImageUris = [];
            if (dto.additionalImages && dto.additionalImages.length > 0) {
                console.log('Uploading additional images...');
                additionalImageUris = await Promise.all(dto.additionalImages.map((img) => this.uploadImageToIPFS(img)));
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
                            type: 'image/png',
                        },
                        ...additionalImageUris.map((uri) => ({
                            uri,
                            type: 'image/png',
                        })),
                    ],
                },
                additionalImages: additionalImageUris,
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const priceLamports = Math.floor(dto.price * 1_000_000_000);
            const stakingLamports = dto.stakingAmount
                ? Math.floor(dto.stakingAmount * 1_000_000_000)
                : 0;
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
                updatedAt: new Date(),
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
                    message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.',
                },
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
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllCollections() {
        return this.nftCollectionRepo.find({
            relations: ['nftTypes'],
            order: { createdAt: 'DESC' },
        });
    }
    async getTypesByCollection(collectionName) {
        const collection = await this.nftCollectionRepo.findOne({
            where: { name: collectionName },
        });
        if (!collection) {
            throw new common_1.HttpException({
                success: false,
                message: `Collection not found: ${collectionName}`,
            }, common_1.HttpStatus.NOT_FOUND);
        }
        return this.nftTypeRepo.find({
            where: { collectionId: collection.id },
            order: { createdAt: 'DESC' },
        });
    }
    async syncCollectionsFromBlockchain() {
        try {
            console.log('🔄 Syncing collections from blockchain...');
            const blockchainCollections = await this.solanaContractService.syncCollectionsFromBlockchain();
            let created = 0;
            let updated = 0;
            const syncedCollections = [];
            for (const bcCollection of blockchainCollections) {
                let dbCollection = await this.nftCollectionRepo.findOne({
                    where: { name: bcCollection.name },
                });
                if (dbCollection) {
                    dbCollection.symbol = bcCollection.symbol;
                    dbCollection.uri = bcCollection.uri;
                    dbCollection.royalty = bcCollection.royalty;
                    dbCollection.admin = bcCollection.admin;
                    dbCollection.isActive = bcCollection.isActive;
                    dbCollection.updatedAt = new Date();
                    await this.nftCollectionRepo.save(dbCollection);
                    updated++;
                    console.log(`✅ Updated collection: ${bcCollection.name}`);
                }
                else {
                    dbCollection = this.nftCollectionRepo.create({
                        id: `${bcCollection.name}_${Date.now()}`,
                        name: bcCollection.name,
                        symbol: bcCollection.symbol,
                        uri: bcCollection.uri,
                        royalty: bcCollection.royalty,
                        admin: bcCollection.admin,
                        isActive: bcCollection.isActive,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    await this.nftCollectionRepo.save(dbCollection);
                    created++;
                    console.log(`✅ Created collection: ${bcCollection.name}`);
                }
                syncedCollections.push({
                    ...bcCollection,
                    dbId: dbCollection.id,
                });
            }
            console.log(`✅ Sync complete: ${created} created, ${updated} updated`);
            return {
                synced: blockchainCollections.length,
                created,
                updated,
                collections: syncedCollections,
            };
        }
        catch (error) {
            console.error('Error syncing collections:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to sync collections from blockchain',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async syncTypesFromBlockchain() {
        try {
            console.log('🔄 Syncing NFT types from blockchain...');
            const blockchainTypes = await this.solanaContractService.syncTypesFromBlockchain();
            let created = 0;
            let updated = 0;
            let skipped = 0;
            const syncedTypes = [];
            for (const bcType of blockchainTypes) {
                console.log(`\n🔍 Processing type: ${bcType.name}, collection PDA: ${bcType.collection}`);
                const allCollections = await this.nftCollectionRepo.find();
                const collectionPDA = bcType.collection;
                let collection = null;
                try {
                    const collectionAccountData = await this.solanaContractService.syncCollectionsFromBlockchain();
                    const matchingBcCollection = collectionAccountData.find((c) => c.pubkey === collectionPDA);
                    console.log(`  Matching blockchain collection:`, matchingBcCollection ? matchingBcCollection.name : 'NOT FOUND');
                    if (matchingBcCollection) {
                        collection = await this.nftCollectionRepo.findOne({
                            where: { name: matchingBcCollection.name },
                        });
                        console.log(`  DB collection found:`, collection ? collection.name : 'NOT FOUND');
                    }
                }
                catch (err) {
                    console.error(`  ❌ Error fetching collection for type ${bcType.name}:`, err.message);
                }
                if (!collection) {
                    console.warn(`  ⚠️ Collection not found for type: ${bcType.name} (collection PDA: ${bcType.collection})`);
                    skipped++;
                    continue;
                }
                let dbType = await this.nftTypeRepo.findOne({
                    where: {
                        name: bcType.name,
                        collectionId: collection.id,
                    },
                });
                if (dbType) {
                    dbType.uri = bcType.uri;
                    dbType.price = bcType.price;
                    dbType.maxSupply = bcType.maxSupply;
                    dbType.currentSupply = bcType.currentSupply;
                    dbType.stakingAmount = bcType.stakingAmount;
                    dbType.updatedAt = new Date();
                    await this.nftTypeRepo.save(dbType);
                    updated++;
                    console.log(`✅ Updated NFT type: ${bcType.name}`);
                }
                else {
                    try {
                        const metadataResponse = await fetch(bcType.uri);
                        const metadata = await metadataResponse.json();
                        dbType = this.nftTypeRepo.create({
                            id: bcType.pubkey,
                            collectionId: collection.id,
                            name: bcType.name,
                            uri: bcType.uri,
                            price: bcType.price,
                            maxSupply: bcType.maxSupply,
                            currentSupply: bcType.currentSupply,
                            stakingAmount: bcType.stakingAmount,
                            mainImage: metadata.image || metadata.properties?.files?.[0]?.uri || '',
                            additionalImages: JSON.stringify(metadata.additionalImages || []),
                        });
                        await this.nftTypeRepo.save(dbType);
                        created++;
                        console.log(`✅ Created NFT type: ${bcType.name}`);
                    }
                    catch (fetchError) {
                        console.error(`❌ Failed to fetch metadata for ${bcType.name}:`, fetchError.message);
                        skipped++;
                        continue;
                    }
                }
                syncedTypes.push({
                    ...bcType,
                    dbId: dbType.id,
                    collectionName: collection.name,
                });
            }
            console.log(`✅ Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);
            return {
                synced: blockchainTypes.length,
                created,
                updated,
                skipped,
                types: syncedTypes,
            };
        }
        catch (error) {
            console.error('Error syncing NFT types:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to sync NFT types from blockchain',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAllTypes() {
        return this.nftTypeRepo.find({
            order: { createdAt: 'DESC' },
        });
    }
    async setStoreConfig(dto) {
        const collection = await this.nftCollectionRepo.findOne({
            where: { name: dto.collectionName },
        });
        if (!collection) {
            throw new common_1.HttpException({
                success: false,
                message: `Collection not found: ${dto.collectionName}`,
            }, common_1.HttpStatus.NOT_FOUND);
        }
        let config = await this.storeConfigRepo.findOne({
            where: { tabName: dto.tabName },
        });
        if (config) {
            config.collectionName = dto.collectionName;
            config.displayName = dto.displayName;
            config.collectionId = dto.collectionId || collection.id;
            config.sortOrder =
                dto.sortOrder !== undefined ? dto.sortOrder : config.sortOrder;
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
                updatedAt: new Date(),
            });
        }
        return this.storeConfigRepo.save(config);
    }
    async updateStoreConfig(tabName, dto) {
        const config = await this.storeConfigRepo.findOne({
            where: { tabName },
        });
        if (!config) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`,
            }, common_1.HttpStatus.NOT_FOUND);
        }
        if (dto.collectionName) {
            const { collections } = await this.nftService.fetchCollections();
            const collection = collections.find((c) => c.name === dto.collectionName);
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found on blockchain: ${dto.collectionName}`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            config.collectionName = dto.collectionName;
            config.collectionId = `${dto.collectionName}_${Date.now()}`;
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
            order: { sortOrder: 'ASC' },
        });
    }
    async getStoreConfig(tabName) {
        const config = await this.storeConfigRepo.findOne({
            where: { tabName },
        });
        if (!config) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`,
            }, common_1.HttpStatus.NOT_FOUND);
        }
        return config;
    }
    async deleteStoreConfig(tabName) {
        const result = await this.storeConfigRepo.delete({ tabName });
        if (result.affected === 0) {
            throw new common_1.HttpException({
                success: false,
                message: `Store config not found for tab: ${tabName}`,
            }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async createCollectionWithFile(dto, imageFile) {
        try {
            if (dto.adminPublicKey) {
                try {
                    new web3_js_1.PublicKey(dto.adminPublicKey);
                }
                catch (error) {
                    throw new common_1.HttpException({
                        success: false,
                        message: 'Invalid admin public key',
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            if (!imageFile) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Image file is required',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const imageFilename = `${dto.name}_collection_image`;
            const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname, imageFilename);
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
                            type: imageFile.mimetype,
                        },
                    ],
                },
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            console.log('✅ Metadata uploaded to IPFS:', metadataUri);
            return {
                success: true,
                data: {
                    metadata,
                    metadataUri,
                    imageUri,
                    message: 'Metadata uploaded to IPFS successfully! Now create a new Keypair for collection mint and call /nft-admin/collection/create-transaction endpoint with the mint public key.',
                },
            };
        }
        catch (error) {
            console.error('Error creating collection metadata:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create collection metadata',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTypeWithFiles(dto, files) {
        try {
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName },
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            if (!files.mainImage || files.mainImage.length === 0) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Main image file is required',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const mainImageFile = files.mainImage[0];
            const mainImageUri = await this.uploadFileToIPFS(mainImageFile.buffer, mainImageFile.originalname);
            let additionalImageUris = [];
            if (files.additionalImages && files.additionalImages.length > 0) {
                console.log('Uploading additional images...');
                additionalImageUris = await Promise.all(files.additionalImages.map((file) => this.uploadFileToIPFS(file.buffer, file.originalname)));
            }
            let attributes = [];
            if (dto.attributes) {
                try {
                    attributes =
                        typeof dto.attributes === 'string'
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
                    type: mainImageFile.mimetype,
                },
                ...additionalImageUris.map((uri, idx) => ({
                    uri,
                    type: files.additionalImages
                        ? files.additionalImages[idx].mimetype
                        : 'image/png',
                })),
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
                    files: allFiles,
                },
                additionalImages: additionalImageUris,
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
            const stakingLamports = dto.stakingAmount
                ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000)
                : 0;
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
                updatedAt: new Date(),
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
                    message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.',
                },
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
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createCollectionWithAuth(encryptedPrivateKey, dto, imageFile) {
        try {
            console.log('Creating collection with auth:', dto.name);
            const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
            if (!isInitialized) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Marketplace is not initialized. Please initialize the marketplace first using POST /nft-admin/initialize-marketplace endpoint.',
                    error: 'MARKETPLACE_NOT_INITIALIZED',
                }, common_1.HttpStatus.PRECONDITION_FAILED);
            }
            const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);
            const collectionMintKeypair = web3_js_1.Keypair.generate();
            console.log('Admin:', adminKeypair.publicKey.toString());
            console.log('Collection Mint:', collectionMintKeypair.publicKey.toString());
            const imageFilename = `${dto.name}_collection_image`;
            const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname, imageFilename);
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
                            type: this.getMimeType(imageFile.originalname),
                        },
                    ],
                },
                seller_fee_basis_points: dto.royalty * 100,
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const result = await this.solanaContractService.createAndSubmitCollection(adminKeypair, collectionMintKeypair, dto.name, dto.symbol, metadataUri, dto.royalty);
            const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;
            console.log('✅ Collection created successfully!');
            console.log('   Signature:', result.signature);
            console.log('   Explorer:', explorerUrl);
            return {
                success: true,
                data: {
                    signature: result.signature,
                    collectionPda: result.collectionPda,
                    collectionMint: result.collectionMint,
                    metadataUri,
                    imageUri,
                    explorerUrl,
                    message: 'Collection created successfully on Solana!',
                },
            };
        }
        catch (error) {
            console.error('Error in createCollectionWithAuth:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create collection',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async initializeMarketplaceWithAuth(encryptedPrivateKey, feeBps = 500) {
        try {
            console.log('Initializing marketplace with auth, fee:', feeBps, 'bps');
            const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
            if (isInitialized) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Marketplace is already initialized',
                }, common_1.HttpStatus.CONFLICT);
            }
            const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);
            console.log('Admin:', adminKeypair.publicKey.toString());
            const result = await this.solanaContractService.initializeMarketplace(adminKeypair, feeBps);
            const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;
            console.log('✅ Marketplace initialized successfully!');
            console.log('   Signature:', result.signature);
            console.log('   Marketplace PDA:', result.marketplacePda);
            console.log('   Explorer:', explorerUrl);
            return {
                success: true,
                data: {
                    signature: result.signature,
                    marketplacePda: result.marketplacePda,
                    feeBps,
                    explorerUrl,
                    message: 'Marketplace initialized successfully! You can now create collections.',
                },
            };
        }
        catch (error) {
            console.error('Error in initializeMarketplaceWithAuth:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to initialize marketplace',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async checkMarketplaceStatus() {
        try {
            const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
            const marketplacePda = this.solanaContractService.getMarketplacePda();
            return {
                success: true,
                data: {
                    isInitialized,
                    marketplacePda: marketplacePda.toString(),
                    message: isInitialized
                        ? 'Marketplace is initialized and ready!'
                        : 'Marketplace is not initialized. Please initialize it first.',
                },
            };
        }
        catch (error) {
            console.error('Error checking marketplace status:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to check marketplace status',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createTypeWithAuth(encryptedPrivateKey, dto, files) {
        try {
            console.log('Creating NFT type with auth:', dto.name);
            const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);
            console.log('Admin:', adminKeypair.publicKey.toString());
            console.log('Collection:', dto.collectionName);
            console.log('Type:', dto.name);
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: dto.collectionName },
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection not found: ${dto.collectionName}`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            if (!files.mainImage || files.mainImage.length === 0) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Main image file is required',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const mainImageFile = files.mainImage[0];
            const imageFilename = `${dto.collectionName}_${dto.name}_main`;
            const mainImageUri = await this.uploadFileToIPFS(mainImageFile.buffer, mainImageFile.originalname, imageFilename);
            let additionalImageUris = [];
            if (files.additionalImages && files.additionalImages.length > 0) {
                console.log('Uploading additional images...');
                additionalImageUris = await Promise.all(files.additionalImages.map((file, idx) => {
                    const additionalFilename = `${dto.collectionName}_${dto.name}_additional_${idx}`;
                    return this.uploadFileToIPFS(file.buffer, file.originalname, additionalFilename);
                }));
            }
            let attributes = [];
            if (dto.attributes) {
                try {
                    attributes =
                        typeof dto.attributes === 'string'
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
                    type: mainImageFile.mimetype,
                },
                ...additionalImageUris.map((uri, idx) => ({
                    uri,
                    type: files.additionalImages
                        ? files.additionalImages[idx].mimetype
                        : 'image/png',
                })),
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
                    files: allFiles,
                },
                additionalImages: additionalImageUris,
            };
            const metadataUri = await this.uploadToIPFS(metadata);
            const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
            const stakingLamports = dto.stakingAmount
                ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000)
                : 0;
            console.log('Creating NFT type on-chain:', {
                collection: dto.collectionName,
                type: dto.name,
                uri: metadataUri,
                price: priceLamports,
                maxSupply: dto.maxSupply,
                stakingAmount: stakingLamports,
            });
            const result = await this.solanaContractService.createAndSubmitNftType(adminKeypair, dto.collectionName, dto.name, metadataUri, priceLamports, Number(dto.maxSupply), stakingLamports);
            const nftType = this.nftTypeRepo.create({
                id: result.nftTypePda,
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
                updatedAt: new Date(),
            });
            await this.nftTypeRepo.save(nftType);
            const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;
            console.log('✅ NFT type created successfully!');
            console.log('   Signature:', result.signature);
            console.log('   Explorer:', explorerUrl);
            return {
                success: true,
                data: {
                    signature: result.signature,
                    nftTypePda: result.nftTypePda,
                    nftType,
                    metadata,
                    metadataUri,
                    mainImageUri,
                    additionalImageUris,
                    priceLamports,
                    stakingLamports,
                    explorerUrl,
                    message: 'NFT type created successfully on Solana!',
                },
            };
        }
        catch (error) {
            console.error('Error in createTypeWithAuth:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create NFT type',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async mintNftWithAuth(encryptedPrivateKey, collectionName, typeName, collectionMintAddress, buyerPublicKey) {
        try {
            console.log('Minting NFT with auth:', {
                collectionName,
                typeName,
                buyerPublicKey,
            });
            const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);
            console.log('Admin:', adminKeypair.publicKey.toString());
            console.log('Buyer:', buyerPublicKey);
            let buyerPubkey;
            try {
                buyerPubkey = new web3_js_1.PublicKey(buyerPublicKey);
            }
            catch (error) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Invalid buyer public key',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (adminKeypair.publicKey.toString() !== buyerPublicKey) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Minting requires buyer signature. For now, buyer must be the same as admin. Use the admin wallet as buyer.',
                    error: 'BUYER_SIGNATURE_REQUIRED',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.solanaContractService.mintNftFromCollection(adminKeypair, adminKeypair, collectionName, typeName, collectionMintAddress);
            const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;
            console.log('✅ NFT minted successfully!');
            console.log('   Signature:', result.signature);
            console.log('   NFT Mint:', result.nftMint);
            console.log('   Explorer:', explorerUrl);
            return {
                success: true,
                data: {
                    signature: result.signature,
                    nftMint: result.nftMint,
                    buyerTokenAccount: result.buyerTokenAccount,
                    explorerUrl,
                    message: 'NFT minted successfully on Solana!',
                },
            };
        }
        catch (error) {
            console.error('Error in mintNftWithAuth:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to mint NFT',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteCollectionFromDatabase(collectionName) {
        try {
            console.log(`🗑️ Deleting collection from database: ${collectionName}`);
            const collection = await this.nftCollectionRepo.findOne({
                where: { name: collectionName },
            });
            if (!collection) {
                throw new common_1.HttpException({
                    success: false,
                    message: `Collection '${collectionName}' not found in database`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            await this.nftTypeRepo.delete({ collectionId: collection.id });
            console.log(`  ✓ Deleted associated NFT types`);
            await this.nftCollectionRepo.delete({ id: collection.id });
            console.log(`  ✓ Deleted collection from database`);
            console.log(`✅ Collection '${collectionName}' removed from database (still exists on blockchain)`);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error deleting collection from database:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to delete collection from database',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteTypeFromDatabase(typeId) {
        try {
            console.log(`🗑️ Deleting NFT type from database: ${typeId}`);
            const type = await this.nftTypeRepo.findOne({
                where: { id: typeId },
            });
            if (!type) {
                throw new common_1.HttpException({
                    success: false,
                    message: `NFT type with ID '${typeId}' not found in database`,
                }, common_1.HttpStatus.NOT_FOUND);
            }
            await this.nftTypeRepo.delete({ id: typeId });
            console.log(`  ✓ Deleted NFT type from database`);
            console.log(`✅ NFT type '${type.name}' removed from database (still exists on blockchain)`);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            console.error('Error deleting NFT type from database:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to delete NFT type from database',
                error: error.message,
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
        typeorm_2.Repository,
        solana_contract_service_1.SolanaContractService,
        nft_service_1.NftService,
        auth_service_1.AuthService])
], NftAdminService);
//# sourceMappingURL=nft-admin.service.js.map