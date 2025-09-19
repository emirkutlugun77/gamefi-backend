import { NftType } from './nft-type.entity';
export declare class UserNft {
    id: number;
    ownerPublicKey: string;
    nftMintAddress: string;
    nftTypeId: string;
    purchaseTransaction: string;
    purchasePrice: string;
    purchasedAt: Date;
    isActive: boolean;
    nftType: NftType;
}
