import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { TaskTransactionService } from './services/task-transaction.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private transactionService: TaskTransactionService,
  ) {}

  /**
   * Runs every minute to check and update task statuses based on their timing
   * This ensures tasks become ACTIVE, EXPIRED, or SCHEDULED at the exact moment
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleTaskStatusUpdates() {
    const startTime = Date.now();
    this.logger.log('Starting task status update cron job...');

    try {
      const now = new Date();

      // Find all tasks that have time-based conditions (start_date or end_date is not null)
      const timeBoundTasks = await this.taskRepository
        .createQueryBuilder('task')
        .where('task.end_date IS NOT NULL OR task.start_date IS NOT NULL')
        .getMany();

      this.logger.log(`Found ${timeBoundTasks.length} time-bound tasks to check`);

      let updatedCount = 0;
      const updates: Array<{ id: number; oldStatus: TaskStatus; newStatus: TaskStatus }> = [];

      for (const task of timeBoundTasks) {
        const oldStatus = task.status;
        const newStatus = this.computeTimeDrivenStatus(task, now);

        // Only update if status has changed
        if (oldStatus !== newStatus) {
          task.status = newStatus;
          await this.taskRepository.save(task);
          updatedCount++;
          updates.push({
            id: task.id,
            oldStatus,
            newStatus,
          });
          this.logger.log(
            `Task #${task.id} "${task.title}" status changed: ${oldStatus} → ${newStatus}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Task status update completed in ${duration}ms. Updated ${updatedCount}/${timeBoundTasks.length} tasks`,
      );

      if (updates.length > 0) {
        this.logger.debug('Status changes:', JSON.stringify(updates, null, 2));
      }
    } catch (error) {
      this.logger.error('Error during task status update cron job', error.stack);
    }
  }

  /**
   * Monitor pending transactions every 30 seconds
   * Checks blockchain for transaction confirmations and updates task status
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async handleTransactionMonitoring() {
    const startTime = Date.now();
    this.logger.log('Starting transaction monitoring cron job...');

    try {
      const pendingTransactions =
        await this.transactionService.getPendingTransactions();

      if (pendingTransactions.length === 0) {
        this.logger.debug('No pending transactions to monitor');
        return;
      }

      this.logger.log(
        `Found ${pendingTransactions.length} pending transactions to monitor`,
      );

      let confirmedCount = 0;
      let failedCount = 0;
      let stillPendingCount = 0;

      for (const transaction of pendingTransactions) {
        try {
          await this.transactionService.monitorTransaction(transaction.id);

          // Re-fetch to get updated status
          const updated =
            await this.transactionService.getTransactionBySignature(
              transaction.signature,
            );

          if (updated.status === 'CONFIRMED') {
            confirmedCount++;
          } else if (updated.status === 'FAILED') {
            failedCount++;
          } else {
            stillPendingCount++;
          }
        } catch (error) {
          this.logger.error(
            `Error monitoring transaction ${transaction.signature}: ${error.message}`,
          );
          failedCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Transaction monitoring completed in ${duration}ms. ` +
          `Confirmed: ${confirmedCount}, Failed: ${failedCount}, Still Pending: ${stillPendingCount}`,
      );
    } catch (error) {
      this.logger.error(
        'Error during transaction monitoring cron job',
        error.stack,
      );
    }
  }

  /**
   * Computes what the task status should be based on current time and task dates
   * This is the same logic from achievements.service.ts
   */
  private computeTimeDrivenStatus(task: Task, now: Date): TaskStatus {
    const { start_date, end_date, status } = task;

    // If task is manually set to INACTIVE, don't override
    if (status === TaskStatus.INACTIVE && !start_date && !end_date) {
      return TaskStatus.INACTIVE;
    }

    // Check if expired
    if (end_date && now >= end_date) {
      return TaskStatus.EXPIRED;
    }

    // Check if scheduled (not yet started)
    if (start_date && now < start_date) {
      return TaskStatus.SCHEDULED;
    }

    // Task is active (between start and end, or no time constraints)
    return TaskStatus.ACTIVE;
  }
}
