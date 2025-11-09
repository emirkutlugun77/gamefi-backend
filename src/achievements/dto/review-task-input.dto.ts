import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsString, IsOptional } from 'class-validator';

export class ReviewTaskInputDto {
  @ApiProperty({ example: 1, description: 'Task input ID' })
  @IsInt()
  input_id!: number;

  @ApiProperty({
    example: true,
    description: 'Whether to approve or reject the submission',
  })
  @IsBoolean()
  approved!: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID of the admin/reviewer approving or rejecting',
  })
  @IsInt()
  reviewed_by!: number;

  @ApiPropertyOptional({
    example: 'Great submission!',
    description: 'Optional comment from the reviewer',
  })
  @IsOptional()
  @IsString()
  review_comment?: string;
}
