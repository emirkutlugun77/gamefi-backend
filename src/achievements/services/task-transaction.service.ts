import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TaskTransaction,
  TransactionStatus,
  TransactionType,
} from '../../entities/task-transaction.entity';
import { UserTask, UserTaskStatus } from '../../entities/user-task.entity';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

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
    // Using mainnet-beta for better stability
    const endpoint = process.env.QUICKNODE_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(endpoint, 'confirmed');
    console.log('Task Transaction Service initialized with endpoint:', endpoint);
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
      relations: ['userTask', 'userTask.task'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Skip if already confirmed or failed
    if (
      transaction.status === TransactionStatus.CONFIRMED ||
      transaction.status === TransactionStatus.FAILED
    ) {
      return;
    }

    try {
      // Update status to confirming if still pending
      if (transaction.status === TransactionStatus.PENDING) {
        transaction.status = TransactionStatus.CONFIRMING;
        await this.transactionRepository.save(transaction);
      }

      // Fetch transaction from blockchain with retry logic
      let txInfo;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          txInfo = await this.connection.getTransaction(transaction.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          });
          break; // Success, exit retry loop
        } catch (rpcError) {
          retryCount++;
          console.error(
            `RPC error fetching transaction ${transaction.signature} (attempt ${retryCount}/${maxRetries}):`,
            rpcError.message,
          );

          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } else {
            // Max retries reached, keep status as CONFIRMING
            return;
          }
        }
      }

      if (!txInfo) {
        // Check if transaction is too old (more than 2 minutes since creation)
        const transactionAge = Date.now() - transaction.created_at.getTime();
        const twoMinutes = 2 * 60 * 1000;

        if (transactionAge > twoMinutes) {
          console.warn(
            `Transaction ${transaction.signature} not found after ${Math.round(transactionAge / 1000)}s. Possible expiry or invalid signature.`,
          );
          transaction.status = TransactionStatus.FAILED;
          transaction.error_message =
            'Transaction blockchain\'de bulunamadı. Transaction expire olmuş veya blockchain\'e ulaşmamış olabilir.';
          await this.transactionRepository.save(transaction);
          return;
        }

        // Transaction not found yet on blockchain
        // This is normal for newly submitted transactions
        console.log(
          `Transaction ${transaction.signature} not yet confirmed on blockchain. Will retry later.`,
        );
        return;
      }

      // Check if transaction failed on blockchain
      if (txInfo.meta?.err) {
        transaction.status = TransactionStatus.FAILED;
        transaction.error_message = `Transaction failed on blockchain: ${JSON.stringify(txInfo.meta.err)}`;
        await this.transactionRepository.save(transaction);
        console.error(
          `Transaction ${transaction.signature} failed:`,
          transaction.error_message,
        );
        return;
      }

      // Get current slot for confirmation count
      const currentSlot = await this.connection.getSlot('confirmed');
      const confirmations = currentSlot - txInfo.slot;

      // Update transaction details
      transaction.slot = BigInt(txInfo.slot);
      transaction.confirmations = confirmations;
      transaction.block_time = txInfo.blockTime
        ? new Date(txInfo.blockTime * 1000)
        : null;
      transaction.fee = BigInt(txInfo.meta?.fee || 0);

      // Parse transaction metadata
      const metadata = this.parseTransactionMetadata(txInfo);
      transaction.transaction_metadata = metadata;

      // Validate transfer constraints if provided in config
      const constraintCheck = this.validateTransferConstraints(
        metadata,
        transaction.transaction_config || {},
      );
      if (!constraintCheck.valid) {
        transaction.status = TransactionStatus.FAILED;
        transaction.error_message =
          constraintCheck.message || 'Transaction validation failed.';
        await this.transactionRepository.save(transaction);
        console.error(
          `Transaction ${transaction.signature} validation failed:`,
          constraintCheck.message,
        );
        return;
      }

      // Check if enough confirmations
      if (confirmations >= transaction.required_confirmations) {
        transaction.status = TransactionStatus.CONFIRMED;
        console.log(
          `Transaction ${transaction.signature} confirmed with ${confirmations} confirmations`,
        );

        // Update user task based on whether it requires input
        const userTask = transaction.userTask;
        if (userTask && userTask.task) {
          // Check if task requires additional user input after transaction
          if (userTask.task.submission_prompt) {
            userTask.status = UserTaskStatus.AWAITING_INPUT;
            console.log(
              `User task ${userTask.id} set to AWAITING_INPUT for additional user input`,
            );
          } else if (userTask.status !== UserTaskStatus.COMPLETED) {
            // No input required, complete the task automatically
            userTask.status = UserTaskStatus.COMPLETED;
            userTask.completed_at = new Date();
            console.log(
              `User task ${userTask.id} completed automatically (no input required)`,
            );
          }
          await this.userTaskRepository.save(userTask);
        }
      } else {
        console.log(
          `Transaction ${transaction.signature} has ${confirmations}/${transaction.required_confirmations} confirmations`,
        );
      }

      await this.transactionRepository.save(transaction);
    } catch (error) {
      console.error(
        `Error monitoring transaction ${transaction.signature}:`,
        error.message,
        error.stack,
      );
      // Don't mark as FAILED immediately, might be a temporary RPC issue
      // Keep as CONFIRMING so it can be retried
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
      const constraintCheck = this.validateTransferConstraints(
        metadata,
        taskTransactionConfig,
      );
      if (!constraintCheck.valid) {
        return {
          valid: false,
          message: constraintCheck.message,
        };
      }

      return { valid: true, metadata };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  private validateTransferConstraints(
    metadata: Record<string, any>,
    transactionConfig: Record<string, any>,
  ): { valid: boolean; message?: string } {
    if (!transactionConfig) {
      return { valid: true };
    }

    const balanceChanges: Array<Record<string, any>> = Array.isArray(
      metadata?.balanceChanges,
    )
      ? metadata.balanceChanges
      : [];

    const recipient =
      transactionConfig.recipient_wallet ||
      transactionConfig.recipientWallet ||
      transactionConfig.destination_wallet ||
      transactionConfig.destinationWallet;

    const amountSolRaw =
      transactionConfig.amount_sol ??
      transactionConfig.amountSol ??
      transactionConfig.required_amount_sol ??
      transactionConfig.requiredAmountSol;

    let amountSolValue: number | undefined;
    if (amountSolRaw !== undefined) {
      const numericValue = Number(amountSolRaw);
      if (Number.isNaN(numericValue) || numericValue <= 0) {
        return {
          valid: false,
          message: 'Configured SOL amount must be a positive number.',
        };
      }
      amountSolValue = numericValue;
    }

    if (!recipient && amountSolValue === undefined) {
      return { valid: true };
    }

    if (balanceChanges.length === 0) {
      return {
        valid: false,
        message: 'Transaction metadata does not include balance changes.',
      };
    }

    if (transactionConfig.min_amount !== undefined) {
      const minAmountNumeric = Number(transactionConfig.min_amount);
      if (Number.isNaN(minAmountNumeric) || minAmountNumeric < 0) {
        return {
          valid: false,
          message: 'Configured minimum amount is invalid.',
        };
      }

      const totalChange = balanceChanges.reduce(
        (sum, change) => sum + Math.abs(Number(change.change) || 0),
        0,
      );

      if (totalChange < minAmountNumeric) {
        return {
          valid: false,
          message: `Transaction amount ${totalChange} is below minimum ${minAmountNumeric}.`,
        };
      }
    }

    if (recipient) {
      const recipientChange = balanceChanges.find((entry) => {
        const accountValue =
          typeof entry.account === 'object' && entry.account?.toString
            ? entry.account.toString()
            : entry.account;
        return accountValue === recipient;
      });

      if (!recipientChange || Number(recipientChange.change) <= 0) {
        return {
          valid: false,
          message:
            'Transaction does not transfer SOL to the expected recipient wallet.',
        };
      }

      if (amountSolValue !== undefined) {
        const requiredLamports = Math.round(amountSolValue * LAMPORTS_PER_SOL);
        if (Number(recipientChange.change) < requiredLamports) {
          return {
            valid: false,
            message: `Transferred SOL amount is below the required minimum (${amountSolValue} SOL).`,
          };
        }
      }

      return { valid: true };
    }

    if (amountSolValue !== undefined) {
      const totalPositiveChange = balanceChanges
        .filter((entry) => Number(entry.change) > 0)
        .reduce((sum, entry) => sum + Number(entry.change), 0);
      const requiredLamports = Math.round(amountSolValue * LAMPORTS_PER_SOL);

      if (totalPositiveChange < requiredLamports) {
        return {
          valid: false,
          message: `Transaction transfers less than the required ${amountSolValue} SOL.`,
        };
      }
    }

    return { valid: true };
  }
}
