import { NftService, MarketplaceData, NFTCollection, NFTItemType, Marketplace } from './nft.service';
export declare class NftController {
    private readonly nftService;
    private readonly connection;
    private readonly adminKeypair;
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
    getStakedNFTs(walletAddress: string): Promise<{
        success: boolean;
        data: {
            stakes: any[];
            count: number;
        };
    }>;
    getPendingRewards(walletAddress: string, nftMint: string): Promise<{
        success: boolean;
        data: any;
    }>;
    mintNft(body: {
        transaction: number[];
        nftMint: string;
        blockhash?: string;
    }): Promise<{
        success: boolean;
        signature: string;
        message: string;
    }>;
}
