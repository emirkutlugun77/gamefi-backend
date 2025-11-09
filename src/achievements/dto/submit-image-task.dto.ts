import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsObject, IsOptional } from 'class-validator';

export class SubmitImageTaskDto {
  @ApiProperty({ example: 1, description: 'Task ID' })
  @IsInt()
  task_id!: number;

  @ApiProperty({
    example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe',
    description: 'User wallet public key',
  })
  @IsString()
  publicKey!: string;

  @ApiProperty({
    example: 'https://example.com/images/my-artwork.png',
    description: 'URL of the uploaded image',
  })
  @IsString()
  image_url!: string;

  @ApiPropertyOptional({
    example: 'This is my VYBE artwork inspired by...',
    description: 'Optional description of the image',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: {
      width: 1920,
      height: 1080,
      format: 'png',
      file_size_mb: 2.5,
    },
    description: 'Optional metadata about the image (dimensions, format, size)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
