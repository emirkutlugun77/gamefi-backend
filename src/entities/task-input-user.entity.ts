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

export enum TaskInputType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export enum TaskInputStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('task_input_users')
@Index(['user_id', 'task_id'])
export class TaskInputUser {
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

  @Column({ type: 'enum', enum: TaskInputType })
  input_type: TaskInputType;

  // For TEXT type: stores the submitted text
  // For IMAGE type: stores the image URL or file path
  @Column({ type: 'text' })
  content: string;

  // Optional description for image submissions
  @Column({ type: 'text', nullable: true })
  description: string;

  // Metadata about the submission (e.g., file size, image dimensions, etc.)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: TaskInputStatus,
    default: TaskInputStatus.PENDING,
  })
  status: TaskInputStatus;

  // Reviewer's comment or rejection reason
  @Column({ type: 'text', nullable: true })
  review_comment: string;

  // Admin/reviewer who approved/rejected
  @Column({ type: 'int', nullable: true })
  reviewed_by: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
