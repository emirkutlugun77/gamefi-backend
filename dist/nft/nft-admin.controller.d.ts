import type { Request } from 'express';
import { NftAdminService } from './nft-admin.service';
import { NftService } from './nft.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';
interface RequestWithUser extends Request {
    user: {
        encryptedPrivateKey: string;
        publicKey: string;
    };
}
export declare class NftAdminController {
    private readonly nftAdminService;
    private readonly nftService;
    constructor(nftAdminService: NftAdminService, nftService: NftService);
    initializeMarketplace(req: RequestWithUser, body?: {
        feeBps?: number;
    }): Promise<any>;
    getMarketplaceStatus(): Promise<any>;
    createCollection(req: RequestWithUser, dto: CreateCollectionDto, image: Express.Multer.File): Promise<any>;
    createType(req: RequestWithUser, dto: CreateTypeDto, files: {
        mainImage?: Express.Multer.File[];
        additionalImages?: Express.Multer.File[];
    }): Promise<any>;
    getAllCollections(): Promise<{
        success: boolean;
        data: import("./nft.service").NFTCollection[];
    }>;
    deleteCollection(name: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getTypesByCollection(collectionName?: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    deleteType(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    setStoreConfig(dto: CreateStoreConfigDto): Promise<{
        success: boolean;
        data: import("../entities/store-config.entity").StoreConfig;
        message: string;
    }>;
    updateStoreConfig(tabName: string, dto: UpdateStoreConfigDto): Promise<{
        success: boolean;
        data: import("../entities/store-config.entity").StoreConfig;
        message: string;
    }>;
    getAllStoreConfigs(): Promise<{
        success: boolean;
        data: import("../entities/store-config.entity").StoreConfig[];
    }>;
    getStoreConfig(tabName: string): Promise<{
        success: boolean;
        data: import("../entities/store-config.entity").StoreConfig;
    }>;
    deleteStoreConfig(tabName: string): Promise<{
        success: boolean;
        message: string;
    }>;
    syncCollections(): Promise<{
        success: boolean;
        data: {
            synced: number;
            updated: number;
            created: number;
            collections: any[];
        };
        message: string;
    }>;
    syncTypes(): Promise<{
        success: boolean;
        data: {
            synced: number;
            updated: number;
            created: number;
            skipped: number;
            types: any[];
        };
        message: string;
    }>;
    syncAll(): Promise<{
        success: boolean;
        data: {
            collections: {
                synced: number;
                updated: number;
                created: number;
                collections: any[];
            };
            types: {
                synced: number;
                updated: number;
                created: number;
                skipped: number;
                types: any[];
            };
        };
        message: string;
    }>;
    mintNft(req: RequestWithUser, body: {
        collectionName: string;
        typeName: string;
        collectionMintAddress: string;
        buyerPublicKey: string;
    }): Promise<any>;
}
export {};
