import { NftCollection } from './nft-collection.entity';
import { UserNft } from './user-nft.entity';
export declare class NftType {
    id: string;
    collectionId: string;
    name: string;
    uri: string;
    price: string;
    maxSupply: string;
    currentSupply: string;
    createdAt: Date;
    updatedAt: Date;
    collection: NftCollection;
    userNfts: UserNft[];
}
