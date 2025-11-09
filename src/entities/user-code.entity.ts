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
import { User } from './user.entity';
import { Task } from './task.entity';

export enum UserCodeStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum CodeType {
  TASK_VERIFICATION = 'TASK_VERIFICATION',
  TWITTER_EMBED = 'TWITTER_EMBED',
  TELEGRAM_AUTH = 'TELEGRAM_AUTH',
  CUSTOM = 'CUSTOM',
}

@Entity('user_codes')
@Index(['user_id', 'task_id'])
@Index(['code'], { unique: true })
@Index(['status'])
export class UserCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  task_id: number;

  @ManyToOne(() => Task, { eager: true, nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  // Unique generated code
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  // Type of code
  @Column({ type: 'enum', enum: CodeType, default: CodeType.TASK_VERIFICATION })
  code_type: CodeType;

  // Status of the code
  @Column({ type: 'enum', enum: UserCodeStatus, default: UserCodeStatus.ACTIVE })
  status: UserCodeStatus;

  // Additional data for the code (e.g., video URL, embed URL, etc.)
  // Example: { "video_url": "https://...", "required_platform": "twitter", "embed_type": "video" }
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // When the code was used
  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  // When the code expires
  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  // Verification result when code is used
  // Example: { "tweet_url": "...", "verified": true, "video_found": true, "code_found": true }
  @Column({ type: 'jsonb', nullable: true })
  verification_result: Record<string, any>;

  // Number of times the code can be used (default: 1)
  @Column({ type: 'int', default: 1 })
  max_uses: number;

  // Number of times the code has been used
  @Column({ type: 'int', default: 0 })
  use_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
