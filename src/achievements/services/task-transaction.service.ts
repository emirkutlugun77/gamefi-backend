import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TaskTransaction,
  TransactionStatus,
  TransactionType,
} from '../../entities/task-transaction.entity';
import { UserTask, UserTaskStatus } from '../../entities/user-task.entity';
import { Connection, PublicKey } from '@solana/web3.js';

@Injectable()
export class TaskTransactionService {
  private connection: Connection;

  constructor(
    @InjectRepository(TaskTransaction)
    private readonly transactionRepository: Repository<TaskTransaction>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
  ) {
    // Initialize Solana connection
    const endpoint = process.env.QUICKNODE_ENDPOINT || 'https://api.devnet.solana.com';
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Create a new transaction record for a task
   */
  async createTransaction(
    userTaskId: number,
    signature: string,
    transactionType: TransactionType,
    transactionConfig?: Record<string, any>,
    requiredConfirmations: number = 1,
  ): Promise<TaskTransaction> {
    // Verify user task exists
    const userTask = await this.userTaskRepository.findOne({
      where: { id: userTaskId },
    });

    if (!userTask) {
      throw new NotFoundException('User task not found');
    }

    // Check if transaction already exists
    const existing = await this.transactionRepository.findOne({
      where: { signature },
    });

    if (existing) {
      throw new BadRequestException('Transaction already registered');
    }

    const transaction = this.transactionRepository.create({
      user_task_id: userTaskId,
      signature,
      transaction_type: transactionType,
      transaction_config: transactionConfig || {},
      required_confirmations: requiredConfirmations,
      status: TransactionStatus.PENDING,
    });

    const saved = await this.transactionRepository.save(transaction);

    // Start monitoring the transaction
    this.monitorTransaction(saved.id).catch(err => {
      console.error(`Error monitoring transaction ${signature}:`, err);
    });

    return saved;
  }

  /**
   * Get transaction by signature
   */
  async getTransactionBySignature(signature: string): Promise<TaskTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { signature },
      relations: ['userTask'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get transactions for a user task
   */
  async getTransactionsForUserTask(userTaskId: number): Promise<TaskTransaction[]> {
    return this.transactionRepository.find({
      where: { user_task_id: userTaskId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Monitor a transaction for confirmations
   */
  async monitorTransaction(transactionId: number): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['userTask'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return; // Already processed
    }

    try {
      // Update status to confirming
      transaction.status = TransactionStatus.CONFIRMING;
      await this.transactionRepository.save(transaction);

      // Fetch transaction from blockchain
      const txInfo = await this.connection.getTransaction(transaction.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo) {
        // Transaction not found yet, keep as confirming
        console.log(`Transaction ${transaction.signature} not found on blockchain yet`);
        return;
      }

      if (txInfo.meta?.err) {
        // Transaction failed
        transaction.status = TransactionStatus.FAILED;
        transaction.error_message = JSON.stringify(txInfo.meta.err);
        await this.transactionRepository.save(transaction);
        return;
      }

      // Get current slot
      const currentSlot = await this.connection.getSlot();
      const confirmations = currentSlot - txInfo.slot;

      // Update transaction details
      transaction.slot = BigInt(txInfo.slot);
      transaction.confirmations = confirmations;
      transaction.block_time = txInfo.blockTime ? new Date(txInfo.blockTime * 1000) : null;
      transaction.fee = BigInt(txInfo.meta?.fee || 0);

      // Parse transaction metadata
      const metadata = this.parseTransactionMetadata(txInfo);
      transaction.transaction_metadata = metadata;

      // Check if enough confirmations
      if (confirmations >= transaction.required_confirmations) {
        transaction.status = TransactionStatus.CONFIRMED;

        // Update user task based on whether it requires input
        const userTask = transaction.userTask;
        if (userTask && userTask.status === UserTaskStatus.IN_PROGRESS) {
          // Check if task requires input submission
          if (userTask.task && userTask.task.submission_prompt) {
            // Task requires input, set to AWAITING_INPUT
            userTask.status = UserTaskStatus.AWAITING_INPUT;
          } else {
            // No input required, complete the task
            userTask.status = UserTaskStatus.COMPLETED;
            userTask.completed_at = new Date();
          }
          await this.userTaskRepository.save(userTask);
        }
      }

      await this.transactionRepository.save(transaction);
    } catch (error) {
      console.error(`Error monitoring transaction ${transaction.signature}:`, error);
      transaction.status = TransactionStatus.FAILED;
      transaction.error_message = error.message;
      await this.transactionRepository.save(transaction);
    }
  }

  /**
   * Manually verify a transaction
   */
  async verifyTransaction(signature: string): Promise<TaskTransaction> {
    const transaction = await this.getTransactionBySignature(signature);
    await this.monitorTransaction(transaction.id);
    return this.getTransactionBySignature(signature);
  }

  /**
   * Get pending transactions that need monitoring
   */
  async getPendingTransactions(): Promise<TaskTransaction[]> {
    return this.transactionRepository.find({
      where: [
        { status: TransactionStatus.PENDING },
        { status: TransactionStatus.CONFIRMING },
      ],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Bulk monitor pending transactions
   */
  async monitorPendingTransactions(): Promise<void> {
    const pending = await this.getPendingTransactions();

    for (const transaction of pending) {
      try {
        await this.monitorTransaction(transaction.id);
      } catch (error) {
        console.error(`Error monitoring transaction ${transaction.signature}:`, error);
      }
    }
  }

  /**
   * Parse transaction metadata from transaction info
   */
  private parseTransactionMetadata(txInfo: any): Record<string, any> {
    const metadata: Record<string, any> = {
      slot: txInfo.slot,
      blockTime: txInfo.blockTime,
      fee: txInfo.meta?.fee,
    };

    // Extract pre/post balances
    if (txInfo.meta?.preBalances && txInfo.meta?.postBalances) {
      metadata.balanceChanges = txInfo.meta.preBalances.map((pre: number, idx: number) => ({
        account: txInfo.transaction.message.accountKeys[idx]?.toString(),
        preBalance: pre,
        postBalance: txInfo.meta.postBalances[idx],
        change: txInfo.meta.postBalances[idx] - pre,
      }));
    }

    // Extract token balances if available
    if (txInfo.meta?.preTokenBalances && txInfo.meta?.postTokenBalances) {
      metadata.tokenBalanceChanges = txInfo.meta.postTokenBalances.map((post: any) => {
        const pre = txInfo.meta.preTokenBalances.find(
          (p: any) => p.accountIndex === post.accountIndex,
        );
        return {
          accountIndex: post.accountIndex,
          mint: post.mint,
          preAmount: pre?.uiTokenAmount?.uiAmount || 0,
          postAmount: post.uiTokenAmount?.uiAmount || 0,
          change: (post.uiTokenAmount?.uiAmount || 0) - (pre?.uiTokenAmount?.uiAmount || 0),
        };
      });
    }

    return metadata;
  }

  /**
   * Validate transaction against task requirements
   */
  async validateTransactionForTask(
    signature: string,
    taskTransactionConfig: Record<string, any>,
  ): Promise<{ valid: boolean; message?: string; metadata?: Record<string, any> }> {
    try {
      const txInfo = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo) {
        return { valid: false, message: 'Transaction not found on blockchain' };
      }

      if (txInfo.meta?.err) {
        return { valid: false, message: 'Transaction failed on blockchain' };
      }

      const metadata = this.parseTransactionMetadata(txInfo);

      // Validate based on transaction config
      if (taskTransactionConfig.min_amount && metadata.balanceChanges) {
        const totalChange = metadata.balanceChanges.reduce(
          (sum: number, change: any) => sum + Math.abs(change.change),
          0,
        );

        if (totalChange < taskTransactionConfig.min_amount) {
          return {
            valid: false,
            message: `Transaction amount ${totalChange} is below minimum ${taskTransactionConfig.min_amount}`,
          };
        }
      }

      return { valid: true, metadata };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }
}
