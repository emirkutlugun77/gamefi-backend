import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetByTelegramIdDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  telegramId!: string;
}
