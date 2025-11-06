import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateStoreConfigDto {
  @ApiProperty({
    description: 'Tab name (building, troops, or others)',
    example: 'building',
    enum: ['building', 'troops', 'others'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['building', 'troops', 'others'])
  tabName: string;

  @ApiProperty({
    description: 'Collection name to fetch from',
    example: 'VYBE_BUILDINGS_COLLECTION',
  })
  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @ApiProperty({
    description: 'Display name for the tab',
    example: 'Buildings',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({
    description: 'Collection mint address (optional)',
    example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
    required: false,
  })
  @IsString()
  @IsOptional()
  collectionId?: string;

  @ApiProperty({
    description: 'Sort order for tabs',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateStoreConfigDto {
  @ApiProperty({
    description: 'Collection name to fetch from',
    example: 'VYBE_BUILDINGS_COLLECTION',
    required: false,
  })
  @IsString()
  @IsOptional()
  collectionName?: string;

  @ApiProperty({
    description: 'Display name for the tab',
    example: 'Buildings',
    required: false,
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: 'Collection mint address',
    example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
    required: false,
  })
  @IsString()
  @IsOptional()
  collectionId?: string;

  @ApiProperty({
    description: 'Whether the tab is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sort order for tabs',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
