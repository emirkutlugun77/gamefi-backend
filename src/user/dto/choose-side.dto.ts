import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChooseSideDto {
  @ApiProperty({ example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;

  @ApiProperty({ example: 'HOLY 7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' })
  @IsString()
  @IsNotEmpty()
  side!: string;
}


