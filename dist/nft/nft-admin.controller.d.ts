import type { Request } from 'express';
import { NftAdminService } from './nft-admin.service';
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
    constructor(nftAdminService: NftAdminService);
    initializeMarketplace(req: RequestWithUser, body?: {
        feeBps?: number;
    }): Promise<any>;
    getMarketplaceStatus(): Promise<any>;
    createCollection(req: RequestWithUser, dto: CreateCollectionDto, image: Express.Multer.File): Promise<any>;
    createType(dto: CreateTypeDto, files: {
        mainImage?: Express.Multer.File[];
        additionalImages?: Express.Multer.File[];
    }): Promise<any>;
    getAllCollections(): Promise<{
        success: boolean;
        data: import("../entities/nft-collection.entity").NftCollection[];
    }>;
    getTypesByCollection(collectionName: string): Promise<{
        success: boolean;
        data: import("../entities/nft-type.entity").NftType[];
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
}
export {};
