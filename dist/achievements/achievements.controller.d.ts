import { AchievementsService } from './achievements.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';
import { SubmitTransactionTaskDto } from './dto/submit-transaction-task.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyTwitterCodeDto } from './dto/verify-twitter-code.dto';
import { CheckTransactionStatusDto } from './dto/check-transaction-status.dto';
import { SubmitTextTaskDto } from './dto/submit-text-task.dto';
import { SubmitImageTaskDto } from './dto/submit-image-task.dto';
import { ReviewTaskInputDto } from './dto/review-task-input.dto';
import { TaskTransactionService } from './services/task-transaction.service';
import { UserCodeService } from './services/user-code.service';
import { TwitterVerificationService } from './services/twitter-verification.service';
import { PrerequisiteValidatorService } from './services/prerequisite-validator.service';
export declare class AchievementsController {
    private readonly achievementsService;
    private readonly transactionService;
    private readonly codeService;
    private readonly twitterService;
    private readonly prerequisiteService;
    constructor(achievementsService: AchievementsService, transactionService: TaskTransactionService, codeService: UserCodeService, twitterService: TwitterVerificationService, prerequisiteService: PrerequisiteValidatorService);
    createTask(createTaskDto: CreateTaskDto): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task;
    }>;
    getTasks(active?: string): Promise<{
        success: boolean;
        data: import("../entities/task.entity").Task[];
        count: number;
    }>;
    getTaskConfigOptions(): Promise<{
        success: boolean;
        data: Record<string, any>;
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
    submitTextTask(dto: SubmitTextTaskDto): Promise<{
        success: boolean;
        data: import("../entities/task-input-user.entity").TaskInputUser;
        message: string;
    }>;
    submitImageTask(dto: SubmitImageTaskDto): Promise<{
        success: boolean;
        data: import("../entities/task-input-user.entity").TaskInputUser;
        message: string;
    }>;
    reviewTaskInput(dto: ReviewTaskInputDto): Promise<{
        success: boolean;
        data: import("../entities/task-input-user.entity").TaskInputUser;
        message: string;
    }>;
    getUserTaskInputs(publicKey: string): Promise<{
        success: boolean;
        data: import("../entities/task-input-user.entity").TaskInputUser[];
        count: number;
    }>;
    getPendingTaskInputs(): Promise<{
        success: boolean;
        data: import("../entities/task-input-user.entity").TaskInputUser[];
        count: number;
    }>;
    submitTransactionTask(dto: SubmitTransactionTaskDto): Promise<{
        success: boolean;
        data: {
            userTask: import("../entities/user-task.entity").UserTask;
            transaction: import("../entities/task-transaction.entity").TaskTransaction;
        };
        message: string;
    }>;
    checkTransactionStatus(dto: CheckTransactionStatusDto): Promise<{
        success: boolean;
        data: import("../entities/task-transaction.entity").TaskTransaction;
    }>;
    generateCode(dto: GenerateCodeDto): Promise<{
        success: boolean;
        data: {
            code: string;
            expires_at: Date;
            metadata: Record<string, any>;
        };
        message: string;
    }>;
    getMyCodes(publicKey: string): Promise<{
        success: boolean;
        data: import("../entities/user-code.entity").UserCode[];
        count: number;
    }>;
    verifyTwitterCode(dto: VerifyTwitterCodeDto): Promise<{
        success: boolean;
        data: import("./services/twitter-verification.service").TwitterVerificationResult;
        message: string;
    }>;
    checkPrerequisites(taskId: number, publicKey: string): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            failedConditions: string[];
        };
        message: string;
    }>;
}
