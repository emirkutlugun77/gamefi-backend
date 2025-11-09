import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CodeType } from '../../entities/user-code.entity';

export class GenerateCodeDto {
  @ApiProperty({ description: 'User public key (Solana wallet)', example: '7xKXtg2CW87d97...' })
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @ApiPropertyOptional({ description: 'Task ID (optional)', example: 1 })
  @IsOptional()
  @IsNumber()
  task_id?: number;

  @ApiPropertyOptional({
    description: 'Code type',
    enum: CodeType,
    example: CodeType.TWITTER_EMBED,
    default: CodeType.TASK_VERIFICATION,
  })
  @IsOptional()
  @IsEnum(CodeType)
  code_type?: CodeType;

  @ApiPropertyOptional({
    description: 'Additional metadata for the code',
    example: { video_url: 'https://...', required_platform: 'twitter' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Hours until code expires', example: 72, default: 72 })
  @IsOptional()
  @IsNumber()
  expires_in_hours?: number;
}
