import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, IsObject, IsDateString, Min, IsArray, IsNumber } from 'class-validator';
import { TaskType, TaskStatus, TaskDifficulty, TaskPriority, TaskCategory } from '../../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Tweet about VYBE' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Tweet with #VYBE and #Solana hashtags to earn points' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: TaskType, example: TaskType.TWITTER_TWEET })
  @IsEnum(TaskType)
  type!: TaskType;

  @ApiProperty({ example: 50, description: 'Points awarded for completing this task' })
  @IsInt()
  @Min(0)
  reward_points!: number;

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

  @ApiPropertyOptional({ enum: TaskDifficulty, example: TaskDifficulty.EASY })
  @IsOptional()
  @IsEnum(TaskDifficulty)
  difficulty?: TaskDifficulty;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.NORMAL })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskCategory, example: TaskCategory.SOCIAL_MEDIA })
  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @ApiPropertyOptional({
    example: ['viral', 'beginner-friendly', 'high-reward'],
    description: 'Tags for organization and filtering'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'https://cdn.vybe.com/icons/twitter.png',
    description: 'Icon/image URL for the task'
  })
  @IsOptional()
  @IsString()
  icon_url?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Required level to access this task'
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  required_level?: number;

  @ApiPropertyOptional({
    example: [1, 2],
    description: 'Task IDs that must be completed first'
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  prerequisite_task_ids?: number[];

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Bonus multiplier for rewards (e.g., 1.5 = 50% bonus)'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reward_multiplier?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Estimated time to complete in minutes'
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimated_time_minutes?: number;
}
