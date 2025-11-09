import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { TaskValidatorService } from './task-validator.service';
import { TaskTransactionService } from './services/task-transaction.service';
import { UserCodeService } from './services/user-code.service';
import { TwitterVerificationService } from './services/twitter-verification.service';
import { PrerequisiteValidatorService } from './services/prerequisite-validator.service';
import { TelegramCodeVerificationService } from './services/telegram-code-verification.service';
import { TaskSchedulerService } from './task-scheduler.service';
import { Task } from '../entities/task.entity';
import { UserTask } from '../entities/user-task.entity';
import { User } from '../entities/user.entity';
import { TaskTransaction } from '../entities/task-transaction.entity';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { UserCode } from '../entities/user-code.entity';
import { TaskInputUser } from '../entities/task-input-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      UserTask,
      User,
      TaskTransaction,
      UserCode,
      NftCollection,
      NftType,
      TaskInputUser,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [
    AchievementsService,
    TaskValidatorService,
    TaskTransactionService,
    UserCodeService,
    TwitterVerificationService,
    PrerequisiteValidatorService,
    TelegramCodeVerificationService,
    TaskSchedulerService,
  ],
  exports: [
    AchievementsService,
    TaskValidatorService,
    TaskTransactionService,
    UserCodeService,
    TwitterVerificationService,
    PrerequisiteValidatorService,
    TelegramCodeVerificationService,
  ],
})
export class AchievementsModule {}
