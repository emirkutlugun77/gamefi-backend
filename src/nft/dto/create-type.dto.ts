import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateTypeDto {
  @ApiProperty({
    description: 'Admin public key that will sign the transaction',
    example: '8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw',
  })
  @IsString()
  @IsNotEmpty()
  adminPublicKey: string;

  @ApiProperty({
    description: 'Collection name to add this type to',
    example: 'VYBE_BUILDINGS_COLLECTION',
  })
  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @ApiProperty({
    description: 'NFT type name',
    example: 'Wooden House',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Price in SOL',
    example: 0.5,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Maximum supply',
    example: 1000,
  })
  @IsNumber()
  @Min(1)
  maxSupply: number;

  @ApiProperty({
    description: 'Staking reward in SOL per month (optional)',
    example: 0.01,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stakingAmount?: number;

  @ApiProperty({
    description: 'NFT description for metadata',
    example: 'A basic wooden house for your village',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Main image URL or base64 data',
    example: 'https://example.com/house.png',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Additional images (optional)',
    example: [
      'https://example.com/house2.png',
      'https://example.com/house3.png',
    ],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  additionalImages?: string[];

  @ApiProperty({
    description: 'NFT attributes (optional)',
    example: [
      { trait_type: 'Rarity', value: 'Common' },
      { trait_type: 'Type', value: 'Building' },
    ],
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        trait_type: { type: 'string' },
        value: { type: 'string' },
      },
    },
  })
  @IsOptional()
  attributes?: Array<{ trait_type: string; value: string }>;
}
