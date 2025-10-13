import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { TaskValidatorService } from './task-validator.service';
import { Task } from '../entities/task.entity';
import { UserTask } from '../entities/user-task.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, UserTask, User])],
  controllers: [AchievementsController],
  providers: [AchievementsService, TaskValidatorService],
  exports: [AchievementsService, TaskValidatorService],
})
export class AchievementsModule {}
