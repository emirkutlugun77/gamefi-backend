import { TaskType } from '../entities/task.entity';
export declare class TaskValidatorService {
    validateTaskConfig(type: TaskType, config: any): {
        valid: boolean;
        errors: string[];
    };
    validateSubmission(type: TaskType, config: any, submissionData: any): {
        valid: boolean;
        errors: string[];
    };
    validatePrerequisites(prerequisiteTaskIds: number[], userId: number, getUserTasksFunc: (userId: number, taskIds: number[]) => Promise<any[]>): Promise<{
        valid: boolean;
        missingTaskIds: number[];
    }>;
    validateTaskAvailability(task: any): {
        available: boolean;
        reason?: string;
    };
    validateRepeatableTask(task: any, currentCompletions: number): {
        canRepeat: boolean;
        reason?: string;
    };
    private isValidUrl;
    private isTwitterUrl;
    private isInstagramUrl;
    calculateRewardPoints(basePoints: number, multiplier?: number): number;
    validateHashtags(text: string, requiredHashtags: string[]): {
        valid: boolean;
        missing: string[];
    };
    validateMentions(text: string, requiredMentions: string[]): {
        valid: boolean;
        missing: string[];
    };
    validateKeywords(text: string, requiredKeywords: string[]): {
        valid: boolean;
        missing: string[];
    };
    validateQuizAnswers(questions: any[], userAnswers: number[]): {
        correct: number;
        total: number;
        passed: boolean;
        minRequired: number;
    };
}
