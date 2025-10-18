export declare class CreateTypeDto {
    adminPublicKey: string;
    collectionName: string;
    name: string;
    price: number;
    maxSupply: number;
    stakingAmount?: number;
    description: string;
    image: string;
    additionalImages?: string[];
    attributes?: Array<{
        trait_type: string;
        value: string;
    }>;
}
