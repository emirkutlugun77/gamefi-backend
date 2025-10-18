export declare class CreateStoreConfigDto {
    tabName: string;
    collectionName: string;
    displayName: string;
    collectionId?: string;
    sortOrder?: number;
}
export declare class UpdateStoreConfigDto {
    collectionName?: string;
    displayName?: string;
    collectionId?: string;
    isActive?: boolean;
    sortOrder?: number;
}
