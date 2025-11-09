import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckTransactionStatusDto {
  @ApiProperty({ description: 'Transaction signature', example: '5wHu7QR...' })
  @IsNotEmpty()
  @IsString()
  signature: string;
}
