import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Admin wallet public key',
    example: 'Fn4P5PRhr7H58Ye1qcnaMvqDZAk3HGsgm6hDaXkVf46M'
  })
  @IsString()
  @IsNotEmpty()
  adminPublicKey: string;

  @ApiProperty({
    description: 'Collection name',
    example: 'VYBE_BUILDINGS_COLLECTION'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Collection symbol',
    example: 'VYBEB'
  })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({
    description: 'Royalty percentage (0-100)',
    example: 5
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  royalty: number;

  @ApiProperty({
    description: 'Collection description for metadata',
    example: 'Buildings collection for VYBE game'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Collection image URL or base64 data',
    example: 'https://example.com/collection.png'
  })
  @IsString()
  @IsNotEmpty()
  image: string;
}
