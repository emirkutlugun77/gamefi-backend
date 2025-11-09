import { TaskType, TaskStatus, TaskDifficulty, TaskPriority, TaskCategory } from '../../entities/task.entity';
export declare class CreateTaskDto {
    title: string;
    description: string;
    type: TaskType;
    reward_points: number;
    config?: Record<string, any>;
    verification_config?: Record<string, any>;
    requires_transaction?: boolean;
    transaction_config?: Record<string, any>;
    is_repeatable?: boolean;
    max_completions?: number;
    start_date?: string;
    end_date?: string;
    display_order?: number;
    status?: TaskStatus;
    difficulty?: TaskDifficulty;
    priority?: TaskPriority;
    category?: TaskCategory;
    tags?: string[];
    icon_url?: string;
    required_level?: number;
    prerequisite_task_ids?: number[];
    reward_multiplier?: number;
    estimated_time_minutes?: number;
    star_rate?: number;
}
