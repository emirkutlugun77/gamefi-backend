import { Injectable, BadRequestException } from '@nestjs/common';
import { UserCodeService } from './user-code.service';
import { CodeType, UserCodeStatus } from '../../entities/user-code.entity';

/**
 * Telegram Code Verification Service
 *
 * This service provides code verification functionality for Telegram bot integration.
 * It allows Telegram bot to generate codes for users and verify them.
 *
 * Use cases:
 * 1. User starts a task via Telegram bot
 * 2. Bot generates a unique code for the user
 * 3. User completes the task and submits proof (e.g., tweet with code)
 * 4. System verifies the code matches
 * 5. If code matches and proof is valid, task is auto-approved
 */
@Injectable()
export class TelegramCodeVerificationService {
  constructor(private readonly userCodeService: UserCodeService) {}

  /**
   * Generate a code for Telegram user
   *
   * @param publicKey - User's Solana wallet public key
   * @param telegramUserId - Telegram user ID (optional)
   * @param taskId - Task ID
   * @param expiresInHours - Hours until code expires (default: 72)
   * @returns Generated code string
   */
  async generateCodeForTelegramUser(
    publicKey: string,
    taskId: number,
    telegramUserId?: string,
    expiresInHours: number = 72,
  ): Promise<{ code: string; expiresAt: Date }> {
    const metadata: any = {
      telegram_user_id: telegramUserId,
      generated_via: 'telegram_bot',
    };

    const userCode = await this.userCodeService.generateCodeForUser(
      publicKey,
      taskId,
      CodeType.TELEGRAM_AUTH,
      metadata,
      expiresInHours,
    );

    return {
      code: userCode.code,
      expiresAt: userCode.expires_at,
    };
  }

  /**
   * Verify a code submitted by user
   *
   * @param code - The code to verify
   * @param proofData - Additional proof data (e.g., tweet URL, screenshot, etc.)
   * @returns Verification result
   */
  async verifyCodeSubmission(
    code: string,
    proofData?: Record<string, any>,
  ): Promise<{
    valid: boolean;
    message: string;
    userCode?: any;
  }> {
    try {
      const result = await this.userCodeService.verifyCode(code, proofData);

      if (!result.valid) {
        return {
          valid: false,
          message: result.message || 'Invalid code',
        };
      }

      return {
        valid: true,
        message: 'Code verified successfully',
        userCode: result.userCode,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Get active code for user and task
   * This is useful when user wants to retrieve their code
   *
   * @param publicKey - User's Solana wallet public key
   * @param taskId - Task ID
   * @returns User code if found
   */
  async getActiveCodeForUserAndTask(
    publicKey: string,
    taskId: number,
  ): Promise<{ code: string; expiresAt: Date } | null> {
    const userCode = await this.userCodeService.getCodeForUserAndTask(
      publicKey,
      taskId,
    );

    if (!userCode) {
      return null;
    }

    return {
      code: userCode.code,
      expiresAt: userCode.expires_at,
    };
  }

  /**
   * Check if code matches
   * This is a simple code matching function that can be used to verify
   * if a user-provided code matches what's in the system
   *
   * @param providedCode - The code provided by user
   * @param expectedCode - The expected code from system
   * @returns True if codes match
   */
  isCodeMatch(providedCode: string, expectedCode: string): boolean {
    // Case-insensitive comparison, removing any whitespace
    const cleanProvided = providedCode.trim().toUpperCase();
    const cleanExpected = expectedCode.trim().toUpperCase();

    return cleanProvided === cleanExpected;
  }

  /**
   * Verify code and approve task automatically
   * This combines code verification with automatic task approval
   *
   * @param code - The code to verify
   * @param proofData - Proof data (tweet URL, etc.)
   * @returns Verification and approval result
   */
  async verifyCodeAndApprove(
    code: string,
    proofData: Record<string, any>,
  ): Promise<{
    success: boolean;
    message: string;
    taskCompleted: boolean;
    pointsAwarded?: number;
  }> {
    // First verify the code
    const verificationResult = await this.verifyCodeSubmission(code, proofData);

    if (!verificationResult.valid) {
      return {
        success: false,
        message: verificationResult.message,
        taskCompleted: false,
      };
    }

    // Code is valid, now we can approve the task
    // The actual task approval should be handled by the achievements service
    return {
      success: true,
      message: 'Code verified. Task can be auto-approved.',
      taskCompleted: true,
      pointsAwarded: verificationResult.userCode?.task?.reward_points,
    };
  }

  /**
   * Format code for display
   * Makes the code more readable for users
   *
   * @param code - The code to format
   * @returns Formatted code
   */
  formatCodeForDisplay(code: string): string {
    // If code is in format XXXX-XXXX-XXXX, keep it
    // Otherwise, add dashes every 4 characters
    if (code.includes('-')) {
      return code;
    }

    const cleaned = code.replace(/[^A-Z0-9]/g, '');
    const parts: string[] = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    return parts.join('-');
  }
}
