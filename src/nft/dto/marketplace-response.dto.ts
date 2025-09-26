import { ApiProperty } from '@nestjs/swagger';

export class MarketplaceDto {
  @ApiProperty({ description: 'Marketplace admin public key' })
  admin: string;

  @ApiProperty({ description: 'Fee in basis points (e.g., 500 = 5%)', example: 500 })
  fee_bps: number;

  @ApiProperty({ description: 'Total number of collections', example: 3 })
  total_collections: number;

  @ApiProperty({ description: 'PDA bump seed', example: 252 })
  bump: number;
}

export class NFTCollectionDto {
  @ApiProperty({ description: 'Collection admin public key' })
  admin: string;

  @ApiProperty({ description: 'Collection name', example: 'VYBE_SUPERHEROES' })
  name: string;

  @ApiProperty({ description: 'Collection symbol', example: 'HEROES' })
  symbol: string;

  @ApiProperty({ description: 'Metadata URI' })
  uri: string;

  @ApiProperty({ description: 'Royalty in basis points', example: 500 })
  royalty: number;

  @ApiProperty({ description: 'Collection mint public key' })
  mint: string;

  @ApiProperty({ description: 'Whether collection is active', example: true })
  is_active: boolean;

  @ApiProperty({ description: 'PDA bump seed' })
  bump: number;

  @ApiProperty({ description: 'Collection PDA address', required: false })
  pda?: string;
}

export class NFTItemTypeDto {
  @ApiProperty({ description: 'Parent collection PDA' })
  collection: string;

  @ApiProperty({ description: 'Item type name', example: 'Knight' })
  name: string;

  @ApiProperty({ description: 'Metadata URI' })
  uri: string;

  @ApiProperty({ description: 'Price in lamports', example: 50000000 })
  price: number;

  @ApiProperty({ description: 'Maximum supply', example: 100000 })
  max_supply: number;

  @ApiProperty({ description: 'Current supply', example: 0 })
  current_supply: number;

  @ApiProperty({ description: 'PDA bump seed' })
  bump: number;

  @ApiProperty({ description: 'Main image URL', required: false })
  mainImage?: string;

  @ApiProperty({ description: 'Additional images array', required: false })
  additionalImages?: string[];
}

export class UserNFTDto {
  @ApiProperty({ description: 'NFT mint address' })
  mint: string;

  @ApiProperty({ description: 'NFT metadata JSON', required: false })
  metadata?: any;

  @ApiProperty({ description: 'NFT name', example: 'Knight #001' })
  name?: string;

  @ApiProperty({ description: 'NFT image URL' })
  image?: string;

  @ApiProperty({ description: 'Main image URL', required: false })
  mainImage?: string;

  @ApiProperty({ description: 'Additional images array', required: false })
  additionalImages?: string[];

  @ApiProperty({ description: 'Collection name', required: false })
  collectionName?: string;
}

export class MarketplaceDataResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'Marketplace data including collections and item types' })
  data: {
    marketplace: MarketplaceDto | null;
    collections: NFTCollectionDto[];
    itemTypesByCollection: Record<string, NFTItemTypeDto[]>;
  };
}

export class CollectionsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'Collections and item types data' })
  data: {
    collections: NFTCollectionDto[];
    itemTypesByCollection: Record<string, NFTItemTypeDto[]>;
  };
}

export class UserNFTsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'User NFTs data' })
  data: {
    nfts: UserNFTDto[];
    count: number;
  };
}

export class MarketplaceInfoResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: MarketplaceDto })
  data: MarketplaceDto;
}
