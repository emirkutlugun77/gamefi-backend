import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

export enum UserTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

@Entity('user_tasks')
@Index(['user_id', 'task_id'])
export class UserTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  task_id: number;

  @ManyToOne(() => Task, { eager: true })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'enum', enum: UserTaskStatus, default: UserTaskStatus.PENDING })
  status: UserTaskStatus;

  // Proof/evidence submitted by user (e.g., tweet URL, screenshot URL, etc.)
  @Column({ type: 'jsonb', nullable: true })
  submission_data: Record<string, any>;

  // Verification result and metadata
  @Column({ type: 'jsonb', nullable: true })
  verification_result: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  completion_count: number;

  @Column({ type: 'int', default: 0 })
  points_earned: number;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
