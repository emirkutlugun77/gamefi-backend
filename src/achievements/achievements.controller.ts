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

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

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
}
