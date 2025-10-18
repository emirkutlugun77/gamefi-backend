import { Repository } from 'typeorm';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { StoreConfig } from '../entities/store-config.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';
export declare class NftAdminService {
    private nftCollectionRepo;
    private nftTypeRepo;
    private storeConfigRepo;
    private connection;
    constructor(nftCollectionRepo: Repository<NftCollection>, nftTypeRepo: Repository<NftType>, storeConfigRepo: Repository<StoreConfig>);
    uploadToIPFS(metadata: any): Promise<string>;
    uploadFileToIPFS(fileBuffer: Buffer, filename: string): Promise<string>;
    uploadImageToIPFS(imageData: string): Promise<string>;
    createCollection(dto: CreateCollectionDto): Promise<any>;
    createType(dto: CreateTypeDto): Promise<any>;
    getAllCollections(): Promise<NftCollection[]>;
    getTypesByCollection(collectionName: string): Promise<NftType[]>;
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
}
