export declare class MarketplaceDto {
    admin: string;
    fee_bps: number;
    total_collections: number;
    bump: number;
}
export declare class NFTCollectionDto {
    admin: string;
    name: string;
    symbol: string;
    uri: string;
    royalty: number;
    mint: string;
    is_active: boolean;
    bump: number;
    pda?: string;
}
export declare class NFTItemTypeDto {
    collection: string;
    name: string;
    uri: string;
    price: number;
    max_supply: number;
    current_supply: number;
    bump: number;
}
export declare class UserNFTDto {
    mint: string;
    metadata?: any;
    name?: string;
    image?: string;
    collectionName?: string;
}
export declare class MarketplaceDataResponseDto {
    success: boolean;
    data: {
        marketplace: MarketplaceDto | null;
        collections: NFTCollectionDto[];
        itemTypesByCollection: Record<string, NFTItemTypeDto[]>;
    };
}
export declare class CollectionsResponseDto {
    success: boolean;
    data: {
        collections: NFTCollectionDto[];
        itemTypesByCollection: Record<string, NFTItemTypeDto[]>;
    };
}
export declare class UserNFTsResponseDto {
    success: boolean;
    data: {
        nfts: UserNFTDto[];
        count: number;
    };
}
export declare class MarketplaceInfoResponseDto {
    success: boolean;
    data: MarketplaceDto;
}
