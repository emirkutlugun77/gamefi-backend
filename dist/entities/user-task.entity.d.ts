import { User } from './user.entity';
import { Task } from './task.entity';
export declare enum UserTaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    SUBMITTED = "SUBMITTED",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED"
}
export declare class UserTask {
    id: number;
    user_id: number;
    user: User;
    task_id: number;
    task: Task;
    status: UserTaskStatus;
    submission_data: Record<string, any>;
    verification_result: Record<string, any>;
    completion_count: number;
    points_earned: number;
    started_at: Date;
    completed_at: Date;
    rejection_reason: string;
    created_at: Date;
    updated_at: Date;
}
