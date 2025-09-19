import { NftService, MarketplaceData, NFTCollection, NFTItemType, Marketplace } from './nft.service';
export declare class NftController {
    private readonly nftService;
    constructor(nftService: NftService);
    getMarketplaceData(): Promise<{
        success: boolean;
        data: MarketplaceData;
    }>;
    getCollections(): Promise<{
        success: boolean;
        data: {
            collections: NFTCollection[];
            itemTypesByCollection: Record<string, NFTItemType[]>;
        };
    }>;
    getUserNFTs(walletAddress: string): Promise<{
        success: boolean;
        data: {
            nfts: any[];
            count: number;
        };
    }>;
    getCollectionNFTs(collectionAddress?: string): Promise<{
        success: boolean;
        data: {
            nfts: any[];
            count: number;
            collection: string;
        };
    }>;
    getMarketplaceInfo(): Promise<{
        success: boolean;
        data: Marketplace | null;
    }>;
}
