import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { UserTask } from '../entities/user-task.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';
export declare class AchievementsService {
    private readonly taskRepository;
    private readonly userTaskRepository;
    private readonly userRepository;
    constructor(taskRepository: Repository<Task>, userTaskRepository: Repository<UserTask>, userRepository: Repository<User>);
    createTask(createTaskDto: CreateTaskDto): Promise<Task>;
    getAllTasks(): Promise<Task[]>;
    getActiveTasks(): Promise<Task[]>;
    getTaskById(id: number): Promise<Task>;
    updateTask(id: number, updateTaskDto: UpdateTaskDto): Promise<Task>;
    deleteTask(id: number): Promise<void>;
    getUserTasks(publicKey: string): Promise<UserTask[]>;
    getUserTasksWithDetails(publicKey: string): Promise<any[]>;
    submitTask(submitTaskDto: SubmitTaskDto): Promise<UserTask>;
    verifyTask(verifyTaskDto: VerifyTaskDto): Promise<UserTask>;
    getPendingVerifications(): Promise<UserTask[]>;
    getUserStats(publicKey: string): Promise<any>;
    private canCompleteTask;
}
