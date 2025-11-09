import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { UserTask, UserTaskStatus } from '../../entities/user-task.entity';
import { User } from '../../entities/user.entity';
import { TaskTransaction, TransactionStatus } from '../../entities/task-transaction.entity';
import { Connection, PublicKey } from '@solana/web3.js';

interface PrerequisiteCondition {
  type: string;
  [key: string]: any;
}

interface PrerequisiteConfig {
  operator: 'AND' | 'OR';
  conditions: PrerequisiteCondition[];
}

@Injectable()
export class PrerequisiteValidatorService {
  private connection: Connection;

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TaskTransaction)
    private readonly transactionRepository: Repository<TaskTransaction>,
  ) {
    const endpoint = process.env.QUICKNODE_ENDPOINT || 'https://api.devnet.solana.com';
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Check if user meets all prerequisites for a task
   */
  async validatePrerequisites(
    taskId: number,
    userId: number,
  ): Promise<{ valid: boolean; failedConditions: string[] }> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      return { valid: false, failedConditions: ['Task not found'] };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { valid: false, failedConditions: ['User not found'] };
    }

    const failedConditions: string[] = [];

    // Check required level
    if (task.required_level > 0) {
      // Assuming user has a level field (you might need to add this)
      // For now, we'll skip this check or calculate level from points
      // const userLevel = Math.floor(user.airdrop_point / 100); // Example calculation
      // if (userLevel < task.required_level) {
      //   failedConditions.push(`Requires level ${task.required_level}`);
      // }
    }

    // Check simple prerequisite task IDs
    if (task.prerequisite_task_ids && task.prerequisite_task_ids.length > 0) {
      const completedTasks = await this.userTaskRepository.find({
        where: {
          user_id: userId,
          task_id: In(task.prerequisite_task_ids),
          status: UserTaskStatus.COMPLETED,
        },
      });

      const completedTaskIds = completedTasks.map(t => t.task_id);
      const missingTasks = task.prerequisite_task_ids.filter(
        id => !completedTaskIds.includes(id),
      );

      if (missingTasks.length > 0) {
        failedConditions.push(`Must complete tasks: ${missingTasks.join(', ')}`);
      }
    }

    // Check dynamic prerequisite conditions
    if (task.prerequisite_conditions) {
      const config = task.prerequisite_conditions as PrerequisiteConfig;
      const conditionResults = await this.evaluateConditions(config.conditions, user);

      if (config.operator === 'AND') {
        const failedDynamic = conditionResults.filter(r => !r.valid);
        if (failedDynamic.length > 0) {
          failedConditions.push(...failedDynamic.map(r => r.message));
        }
      } else if (config.operator === 'OR') {
        const anyPassed = conditionResults.some(r => r.valid);
        if (!anyPassed) {
          failedConditions.push(
            `Must meet at least one condition: ${conditionResults.map(r => r.message).join(' OR ')}`,
          );
        }
      }
    }

    return {
      valid: failedConditions.length === 0,
      failedConditions,
    };
  }

  /**
   * Evaluate multiple conditions
   */
  private async evaluateConditions(
    conditions: PrerequisiteCondition[],
    user: User,
  ): Promise<{ valid: boolean; message: string }[]> {
    const results = await Promise.all(
      conditions.map(condition => this.evaluateCondition(condition, user)),
    );
    return results;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: PrerequisiteCondition,
    user: User,
  ): Promise<{ valid: boolean; message: string }> {
    switch (condition.type) {
      case 'task_completed':
        return this.checkTaskCompleted(user.id, condition.task_ids || []);

      case 'min_points':
        return this.checkMinPoints(user, condition.points || 0);

      case 'min_level':
        return this.checkMinLevel(user, condition.level || 0);

      case 'nft_hold':
        return this.checkNftHold(
          user.publicKey,
          condition.collection_mint,
          condition.min_amount || 1,
        );

      case 'transaction_completed':
        return this.checkTransactionCompleted(
          user.id,
          condition.transaction_type,
          condition.min_amount,
        );

      case 'min_task_completions':
        return this.checkMinTaskCompletions(user.id, condition.count || 1);

      case 'specific_date_after':
        return this.checkDateAfter(condition.date);

      case 'specific_date_before':
        return this.checkDateBefore(condition.date);

      case 'wallet_balance':
        return this.checkWalletBalance(user.publicKey, condition.min_balance || 0);

      default:
        return {
          valid: false,
          message: `Unknown condition type: ${condition.type}`,
        };
    }
  }

  private async checkTaskCompleted(
    userId: number,
    taskIds: number[],
  ): Promise<{ valid: boolean; message: string }> {
    const completedTasks = await this.userTaskRepository.find({
      where: {
        user_id: userId,
        task_id: In(taskIds),
        status: UserTaskStatus.COMPLETED,
      },
    });

    const valid = completedTasks.length === taskIds.length;
    return {
      valid,
      message: valid ? 'Tasks completed' : `Must complete tasks: ${taskIds.join(', ')}`,
    };
  }

  private checkMinPoints(
    user: User,
    minPoints: number,
  ): { valid: boolean; message: string } {
    const valid = user.airdrop_point >= minPoints;
    return {
      valid,
      message: valid
        ? `Has ${user.airdrop_point} points`
        : `Need ${minPoints} points (have ${user.airdrop_point})`,
    };
  }

  private checkMinLevel(
    user: User,
    minLevel: number,
  ): { valid: boolean; message: string } {
    // Calculate level from points (example: 100 points = 1 level)
    const userLevel = Math.floor(user.airdrop_point / 100);
    const valid = userLevel >= minLevel;
    return {
      valid,
      message: valid
        ? `Has level ${userLevel}`
        : `Need level ${minLevel} (have ${userLevel})`,
    };
  }

  private async checkNftHold(
    publicKey: string,
    collectionMint: string,
    minAmount: number,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      // This would require NFT checking logic
      // For now, return a placeholder
      return {
        valid: true,
        message: 'NFT check not fully implemented',
      };
    } catch (error) {
      return {
        valid: false,
        message: `NFT check failed: ${error.message}`,
      };
    }
  }

  private async checkTransactionCompleted(
    userId: number,
    transactionType?: string,
    minAmount?: number,
  ): Promise<{ valid: boolean; message: string }> {
    const userTasks = await this.userTaskRepository.find({
      where: { user_id: userId },
    });

    const userTaskIds = userTasks.map(ut => ut.id);

    const where: any = {
      user_task_id: In(userTaskIds),
      status: TransactionStatus.CONFIRMED,
    };

    if (transactionType) {
      where.transaction_type = transactionType;
    }

    const transactions = await this.transactionRepository.find({ where });

    if (transactions.length === 0) {
      return {
        valid: false,
        message: `No ${transactionType || 'transaction'} found`,
      };
    }

    if (minAmount) {
      // Check if any transaction meets min amount
      const meetsAmount = transactions.some(tx => {
        const amount = tx.transaction_metadata?.totalChange || 0;
        return amount >= minAmount;
      });

      return {
        valid: meetsAmount,
        message: meetsAmount
          ? 'Transaction amount requirement met'
          : `Need transaction of at least ${minAmount}`,
      };
    }

    return {
      valid: true,
      message: `Found ${transactions.length} transaction(s)`,
    };
  }

  private async checkMinTaskCompletions(
    userId: number,
    minCount: number,
  ): Promise<{ valid: boolean; message: string }> {
    const completedTasks = await this.userTaskRepository.find({
      where: {
        user_id: userId,
        status: UserTaskStatus.COMPLETED,
      },
    });

    const valid = completedTasks.length >= minCount;
    return {
      valid,
      message: valid
        ? `Completed ${completedTasks.length} tasks`
        : `Need ${minCount} completed tasks (have ${completedTasks.length})`,
    };
  }

  private checkDateAfter(dateString: string): { valid: boolean; message: string } {
    const targetDate = new Date(dateString);
    const now = new Date();
    const valid = now >= targetDate;
    return {
      valid,
      message: valid
        ? 'Date requirement met'
        : `Available after ${targetDate.toLocaleDateString()}`,
    };
  }

  private checkDateBefore(dateString: string): { valid: boolean; message: string } {
    const targetDate = new Date(dateString);
    const now = new Date();
    const valid = now <= targetDate;
    return {
      valid,
      message: valid
        ? 'Date requirement met'
        : `Only available before ${targetDate.toLocaleDateString()}`,
    };
  }

  private async checkWalletBalance(
    publicKey: string,
    minBalance: number,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      const balanceInSol = balance / 1e9;

      const valid = balanceInSol >= minBalance;
      return {
        valid,
        message: valid
          ? `Wallet has ${balanceInSol.toFixed(4)} SOL`
          : `Need ${minBalance} SOL (have ${balanceInSol.toFixed(4)})`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Balance check failed: ${error.message}`,
      };
    }
  }
}
