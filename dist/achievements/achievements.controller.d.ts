import { AchievementsService } from './achievements.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';
export declare class AchievementsController {
    private readonly achievementsService;
    constructor(achievementsService: AchievementsService);
    createTask(createTaskDto: CreateTaskDto): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task;
    }>;
    getTasks(active?: string): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task[];
        count: number;
    }>;
    getTaskById(id: number): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task;
    }>;
    updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task;
    }>;
    deleteTask(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserTasks(publicKey: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    submitTask(submitTaskDto: SubmitTaskDto): Promise<{
        success: boolean;
        data: import("../entities/user-task.entity").UserTask;
        message: string;
    }>;
    verifyTask(verifyTaskDto: VerifyTaskDto): Promise<{
        success: boolean;
        data: import("../entities/user-task.entity").UserTask;
        message: string;
    }>;
    getPendingVerifications(): Promise<{
        success: boolean;
        data: import("../entities/user-task.entity").UserTask[];
        count: number;
    }>;
    getUserStats(publicKey: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
