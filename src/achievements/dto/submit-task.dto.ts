import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsObject, IsOptional } from 'class-validator';

export class SubmitTaskDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  task_id!: number;

  @ApiProperty({ example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' })
  @IsString()
  publicKey!: string;

  @ApiPropertyOptional({
    example: { tweetUrl: 'https://twitter.com/user/status/123456789' },
    description: 'Proof/evidence for task completion',
  })
  @IsOptional()
  @IsObject()
  submission_data?: Record<string, any>;
}
