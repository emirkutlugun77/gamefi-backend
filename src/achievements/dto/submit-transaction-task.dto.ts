import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
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

  @ApiProperty({ description: 'Transaction signature from Solana', example: '5wHu7QRa8F3X...' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.SOL_TRANSFER,
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @ApiPropertyOptional({
    description: 'Override required confirmations (defaults to task config)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  required_confirmations?: number;
}
