import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, IsObject, IsDateString, Min } from 'class-validator';
import { TaskType, TaskStatus } from '../../entities/task.entity';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Tweet about VYBE' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Tweet with #VYBE and #Solana hashtags to earn points' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskType, example: TaskType.TWITTER_TWEET })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ example: 50, description: 'Points awarded for completing this task' })
  @IsOptional()
  @IsInt()
  @Min(0)
  reward_points?: number;

  @ApiPropertyOptional({
    example: { hashtags: ['#VYBE', '#Solana'], minLength: 50 },
    description: 'Dynamic configuration based on task type'
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    example: { requireManualApproval: false, autoVerify: true },
    description: 'Verification settings'
  })
  @IsOptional()
  @IsObject()
  verification_config?: Record<string, any>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_repeatable?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_completions?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
