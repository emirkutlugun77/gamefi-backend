import { PublicKey } from '@solana/web3.js';
export interface Marketplace {
    admin: PublicKey;
    fee_bps: number;
    total_collections: number;
    bump: number;
}
export interface NFTCollection {
    admin: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    royalty: number;
    mint: PublicKey;
    is_active: boolean;
    bump: number;
    pda?: PublicKey;
}
export interface NFTItemType {
    collection: PublicKey;
    name: string;
    uri: string;
    price: number;
    max_supply: number;
    current_supply: number;
    staking_amount: number;
    bump: number;
}
export interface MarketplaceData {
    marketplace: Marketplace | null;
    collections: NFTCollection[];
    itemTypesByCollection: Record<string, NFTItemType[]>;
}
export declare class NftService {
    private connection;
    private umi;
    private collectionsCache;
    private collectionsCacheTime;
    private metadataCache;
    private userNFTsCache;
    private readonly CACHE_DURATION;
    private readonly METADATA_CACHE_DURATION;
    private readonly USER_NFTS_CACHE_DURATION;
    constructor();
    private fetchMetadataWithCache;
    private extractImagesFromMetadata;
    private getMarketplacePDA;
    private getCollectionPDA;
    private getMetadataPDA;
    fetchMarketplace(): Promise<Marketplace | null>;
    fetchCollections(): Promise<{
        collections: NFTCollection[];
        itemTypesByCollection: Record<string, NFTItemType[]>;
    }>;
    fetchUserNFTs(walletAddress: string): Promise<any[]>;
    private transformDasAsset;
    private loadMetadataFromUrisSync;
    private loadMetadataFromUris;
    private loadMetadataInBackgroundBatch;
    private loadMetadataInBackground;
    private processTokenAccountFast;
    private processTokenAccount;
    getCollectionNFTs(collectionAddress?: string): Promise<any[]>;
    getMarketplaceData(): Promise<MarketplaceData>;
}
