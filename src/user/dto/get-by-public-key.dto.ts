import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetByPublicKeyDto {
  @ApiProperty({ example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;
}
