import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { VerifyTaskDto } from './dto/verify-task.dto';
import { SubmitTransactionTaskDto } from './dto/submit-transaction-task.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { VerifyTwitterCodeDto } from './dto/verify-twitter-code.dto';
import { CheckTransactionStatusDto } from './dto/check-transaction-status.dto';
import { TaskTransactionService } from './services/task-transaction.service';
import { UserCodeService } from './services/user-code.service';
import { TwitterVerificationService } from './services/twitter-verification.service';
import { PrerequisiteValidatorService } from './services/prerequisite-validator.service';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly transactionService: TaskTransactionService,
    private readonly codeService: UserCodeService,
    private readonly twitterService: TwitterVerificationService,
    private readonly prerequisiteService: PrerequisiteValidatorService,
  ) {}

  // ========== TASK MANAGEMENT ==========

  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    try {
      const task = await this.achievementsService.createTask(createTaskDto);
      return {
        success: true,
        data: task,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create task',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter only active tasks',
  })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async getTasks(@Query('active') active?: string) {
    try {
      const tasks =
        active === 'true'
          ? await this.achievementsService.getActiveTasks()
          : await this.achievementsService.getAllTasks();

      return {
        success: true,
        data: tasks,
        count: tasks.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve tasks',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tasks/config-options')
  @ApiOperation({ summary: 'Get config metadata for task creation' })
  @ApiResponse({
    status: 200,
    description: 'Configuration metadata retrieved successfully',
  })
  async getTaskConfigOptions() {
    try {
      const options = await this.achievementsService.getTaskConfigOptions();
      return {
        success: true,
        data: options,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to load task configuration options',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(@Param('id', ParseIntPipe) id: number) {
    try {
      const task = await this.achievementsService.getTaskById(id);
      return {
        success: true,
        data: task,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('tasks/:id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    try {
      const task = await this.achievementsService.updateTask(id, updateTaskDto);
      return {
        success: true,
        data: task,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.achievementsService.deleteTask(id);
      return {
        success: true,
        message: 'Task deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========== USER TASK MANAGEMENT ==========

  @Get('user-tasks')
  @ApiOperation({ summary: 'Get user tasks with progress' })
  @ApiQuery({
    name: 'publicKey',
    required: true,
    description: 'User public key',
  })
  @ApiResponse({
    status: 200,
    description: 'User tasks retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTasks(@Query('publicKey') publicKey: string) {
    try {
      const tasks =
        await this.achievementsService.getUserTasksWithDetails(publicKey);
      return {
        success: true,
        data: tasks,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit task completion' })
  @ApiResponse({ status: 200, description: 'Task submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or task not found' })
  async submitTask(@Body() submitTaskDto: SubmitTaskDto) {
    try {
      const userTask = await this.achievementsService.submitTask(submitTaskDto);
      return {
        success: true,
        data: userTask,
        message:
          userTask.status === 'COMPLETED'
            ? 'Task completed and points awarded!'
            : 'Task submitted for verification',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify submitted task (Admin)' })
  @ApiResponse({ status: 200, description: 'Task verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User task not found' })
  async verifyTask(@Body() verifyTaskDto: VerifyTaskDto) {
    try {
      const userTask = await this.achievementsService.verifyTask(verifyTaskDto);
      return {
        success: true,
        data: userTask,
        message:
          userTask.status === 'COMPLETED'
            ? 'Task approved and points awarded'
            : 'Task rejected',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pending-verifications')
  @ApiOperation({ summary: 'Get pending task verifications (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Pending verifications retrieved successfully',
  })
  async getPendingVerifications() {
    try {
      const userTasks =
        await this.achievementsService.getPendingVerifications();
      return {
        success: true,
        data: userTasks,
        count: userTasks.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user achievement statistics' })
  @ApiQuery({
    name: 'publicKey',
    required: true,
    description: 'User public key',
  })
  @ApiResponse({
    status: 200,
    description: 'User stats retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Query('publicKey') publicKey: string) {
    try {
      const stats = await this.achievementsService.getUserStats(publicKey);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========== TRANSACTION-BASED TASKS ==========

  @Post('submit-transaction-task')
  @ApiOperation({ summary: 'Submit a transaction-based task' })
  @ApiResponse({ status: 200, description: 'Transaction task submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async submitTransactionTask(@Body() dto: SubmitTransactionTaskDto) {
    try {
      // First, submit the task
      const userTask = await this.achievementsService.submitTask({
        task_id: dto.task_id,
        publicKey: dto.publicKey,
        submission_data: {
          signature: dto.signature,
          transaction_type: dto.transaction_type,
        },
      });

      // Create transaction record
      const transaction = await this.transactionService.createTransaction(
        userTask.id,
        dto.signature,
        dto.transaction_type,
        dto.transaction_config,
        dto.required_confirmations || 1,
      );

      return {
        success: true,
        data: {
          userTask,
          transaction,
        },
        message: 'Transaction task submitted. Waiting for confirmation...',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-transaction-status')
  @ApiOperation({ summary: 'Check transaction status' })
  @ApiResponse({ status: 200, description: 'Transaction status retrieved' })
  async checkTransactionStatus(@Body() dto: CheckTransactionStatusDto) {
    try {
      const transaction = await this.transactionService.verifyTransaction(dto.signature);
      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========== CODE GENERATION & VERIFICATION ==========

  @Post('generate-code')
  @ApiOperation({ summary: 'Generate a verification code for a user' })
  @ApiResponse({ status: 200, description: 'Code generated successfully' })
  async generateCode(@Body() dto: GenerateCodeDto) {
    try {
      const userCode = await this.codeService.generateCodeForUser(
        dto.publicKey,
        dto.task_id,
        dto.code_type,
        dto.metadata,
        dto.expires_in_hours,
      );

      return {
        success: true,
        data: {
          code: userCode.code,
          expires_at: userCode.expires_at,
          metadata: userCode.metadata,
        },
        message: 'Code generated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-codes')
  @ApiOperation({ summary: 'Get user codes' })
  @ApiQuery({ name: 'publicKey', required: true })
  @ApiResponse({ status: 200, description: 'Codes retrieved successfully' })
  async getMyCodes(@Query('publicKey') publicKey: string) {
    try {
      const codes = await this.codeService.getCodesForUser(publicKey);
      return {
        success: true,
        data: codes,
        count: codes.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-twitter-code')
  @ApiOperation({ summary: 'Verify Twitter code and video embed' })
  @ApiResponse({ status: 200, description: 'Verification completed' })
  async verifyTwitterCode(@Body() dto: VerifyTwitterCodeDto) {
    try {
      const result = await this.twitterService.verifyTweetWithCodeAndVideo(
        dto.code,
        dto.tweet_url,
        dto.video_url,
      );

      return {
        success: result.verified,
        data: result,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========== PREREQUISITE VALIDATION ==========

  @Get('check-prerequisites/:taskId')
  @ApiOperation({ summary: 'Check if user meets task prerequisites' })
  @ApiParam({ name: 'taskId', type: Number })
  @ApiQuery({ name: 'publicKey', required: true })
  @ApiResponse({ status: 200, description: 'Prerequisites checked' })
  async checkPrerequisites(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('publicKey') publicKey: string,
  ) {
    try {
      // Get user ID from public key
      const user = await this.achievementsService['userRepository'].findOne({
        where: { publicKey },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const result = await this.prerequisiteService.validatePrerequisites(taskId, user.id);

      return {
        success: true,
        data: result,
        message: result.valid
          ? 'All prerequisites met'
          : 'Some prerequisites are not met',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
