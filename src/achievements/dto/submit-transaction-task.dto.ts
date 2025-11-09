import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../entities/task-transaction.entity';

export class SubmitTransactionTaskDto {
  @ApiProperty({ description: 'Task ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  task_id: number;

  @ApiProperty({ description: 'User public key (Solana wallet)', example: '7xKXtg2CW87d97...' })
  @IsNotEmpty()
  @IsString()
  publicKey: string;

  @ApiProperty({ description: 'Transaction signature', example: '5wHu7QR...' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.TOKEN_SWAP,
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @ApiPropertyOptional({ description: 'Transaction configuration data', example: { amount: 100 } })
  @IsOptional()
  @IsObject()
  transaction_config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Required confirmations', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  required_confirmations?: number;
}
