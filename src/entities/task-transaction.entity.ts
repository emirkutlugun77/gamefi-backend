import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserTask } from './user-task.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export enum TransactionType {
  TOKEN_TRANSFER = 'TOKEN_TRANSFER',
  SOL_TRANSFER = 'SOL_TRANSFER',
  NFT_MINT = 'NFT_MINT',
  NFT_TRANSFER = 'NFT_TRANSFER',
  TOKEN_SWAP = 'TOKEN_SWAP',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  LIQUIDITY_ADD = 'LIQUIDITY_ADD',
  LIQUIDITY_REMOVE = 'LIQUIDITY_REMOVE',
  CUSTOM = 'CUSTOM',
}

@Entity('task_transactions')
@Index(['user_task_id'])
@Index(['signature'])
@Index(['status'])
export class TaskTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_task_id: number;

  @ManyToOne(() => UserTask, { eager: true })
  @JoinColumn({ name: 'user_task_id' })
  userTask: UserTask;

  // Transaction signature from Solana blockchain
  @Column({ type: 'varchar', length: 255, unique: true })
  signature: string;

  // Type of transaction
  @Column({ type: 'enum', enum: TransactionType })
  transaction_type: TransactionType;

  // Transaction status
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // Dynamic transaction configuration
  // Example: { "amount": 1.5, "token_mint": "...", "recipient": "...", "memo": "..." }
  @Column({ type: 'jsonb', nullable: true })
  transaction_config: Record<string, any>;

  // Transaction metadata (amount, tokens involved, etc.)
  @Column({ type: 'jsonb', nullable: true })
  transaction_metadata: Record<string, any>;

  // Number of confirmations received
  @Column({ type: 'int', default: 0 })
  confirmations: number;

  // Required confirmations for task completion
  @Column({ type: 'int', default: 1 })
  required_confirmations: number;

  // Blockchain slot when transaction was processed
  @Column({ type: 'bigint', nullable: true })
  slot: bigint | null;

  // Block time timestamp
  @Column({ type: 'timestamp', nullable: true })
  block_time: Date | null;

  // Error message if transaction failed
  @Column({ type: 'text', nullable: true })
  error_message: string;

  // Fee paid for the transaction (in lamports)
  @Column({ type: 'bigint', nullable: true })
  fee: bigint | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
