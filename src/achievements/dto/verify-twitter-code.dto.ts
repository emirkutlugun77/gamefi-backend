import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyTwitterCodeDto {
  @ApiProperty({ description: 'Verification code', example: 'ABCD-EFGH-IJKL' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Tweet URL containing the code and video',
    example: 'https://twitter.com/user/status/123456789',
  })
  @IsNotEmpty()
  @IsString()
  tweet_url: string;

  @ApiPropertyOptional({
    description: 'Required video URL (optional)',
    example: 'https://example.com/video.mp4',
  })
  @IsOptional()
  @IsString()
  video_url?: string;
}
