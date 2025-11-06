import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Base58 encoded Solana private key',
    example:
      '3mi4bzn28FXZCuULco7vgnFD3RAdzJo6SMt4PZ1MUv5jYmVqbf48kZaZa78tGbTt6MDPPQ1c8LgEwUm1ujhtiHSq',
  })
  @IsString()
  @IsNotEmpty()
  privateKey: string;
}
