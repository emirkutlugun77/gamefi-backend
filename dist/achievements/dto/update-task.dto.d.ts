import { TaskType, TaskStatus } from '../../entities/task.entity';
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    type?: TaskType;
    reward_points?: number;
    config?: Record<string, any>;
    verification_config?: Record<string, any>;
    is_repeatable?: boolean;
    max_completions?: number;
    start_date?: string;
    end_date?: string;
    display_order?: number;
    status?: TaskStatus;
}
