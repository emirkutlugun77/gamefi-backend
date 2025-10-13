import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsString, IsOptional } from 'class-validator';

export class VerifyTaskDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  user_task_id!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ example: 'Tweet does not contain required hashtags' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
