import { Repository } from 'typeorm';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { StoreConfig } from '../entities/store-config.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';
import { SolanaContractService } from './solana-contract.service';
import { NftService } from './nft.service';
import { AuthService } from '../auth/auth.service';
export declare class NftAdminService {
    private nftCollectionRepo;
    private nftTypeRepo;
    private storeConfigRepo;
    solanaContractService: SolanaContractService;
    private nftService;
    private authService;
    private connection;
    constructor(nftCollectionRepo: Repository<NftCollection>, nftTypeRepo: Repository<NftType>, storeConfigRepo: Repository<StoreConfig>, solanaContractService: SolanaContractService, nftService: NftService, authService: AuthService);
    uploadToIPFS(metadata: any): Promise<string>;
    uploadFileToIPFS(fileBuffer: Buffer, filename: string, customName?: string): Promise<string>;
    private extractCIDFromResponse;
    private getMimeType;
    uploadImageToIPFS(imageData: string): Promise<string>;
    createCollection(dto: CreateCollectionDto): Promise<any>;
    createType(dto: CreateTypeDto): Promise<any>;
    getAllCollections(): Promise<NftCollection[]>;
    getTypesByCollection(collectionName: string): Promise<NftType[]>;
    syncCollectionsFromBlockchain(): Promise<{
        synced: number;
        updated: number;
        created: number;
        collections: any[];
    }>;
    syncTypesFromBlockchain(): Promise<{
        synced: number;
        updated: number;
        created: number;
        skipped: number;
        types: any[];
    }>;
    getAllTypes(): Promise<NftType[]>;
    setStoreConfig(dto: CreateStoreConfigDto): Promise<StoreConfig>;
    updateStoreConfig(tabName: string, dto: UpdateStoreConfigDto): Promise<StoreConfig>;
    getAllStoreConfigs(): Promise<StoreConfig[]>;
    getStoreConfig(tabName: string): Promise<StoreConfig>;
    deleteStoreConfig(tabName: string): Promise<void>;
    createCollectionWithFile(dto: CreateCollectionDto, imageFile: Express.Multer.File): Promise<any>;
    createTypeWithFiles(dto: CreateTypeDto, files: {
        mainImage?: Express.Multer.File[];
        additionalImages?: Express.Multer.File[];
    }): Promise<any>;
    createCollectionWithAuth(encryptedPrivateKey: string, dto: CreateCollectionDto, imageFile: Express.Multer.File): Promise<any>;
    initializeMarketplaceWithAuth(encryptedPrivateKey: string, feeBps?: number): Promise<any>;
    checkMarketplaceStatus(): Promise<any>;
    createTypeWithAuth(encryptedPrivateKey: string, dto: CreateTypeDto, files: {
        mainImage?: Express.Multer.File[];
        additionalImages?: Express.Multer.File[];
    }): Promise<any>;
    mintNftWithAuth(encryptedPrivateKey: string, collectionName: string, typeName: string, collectionMintAddress: string, buyerPublicKey: string): Promise<any>;
    deleteCollectionFromDatabase(collectionName: string): Promise<void>;
    deleteTypeFromDatabase(typeId: string): Promise<void>;
}
