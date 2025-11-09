import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';

export class SubmitTextTaskDto {
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
    example: 'This is my creative idea about VYBE NFTs...',
    description: 'Text content submitted by the user',
  })
  @IsString()
  content!: string;
}
