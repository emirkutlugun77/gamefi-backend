import { NftType } from './nft-type.entity';
export declare class NftCollection {
    id: string;
    admin: string;
    name: string;
    symbol: string;
    uri: string;
    royalty: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    nftTypes: NftType[];
}
