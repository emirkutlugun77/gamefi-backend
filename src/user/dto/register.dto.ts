import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  telegramId!: string;
}


