import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserCode, UserCodeStatus, CodeType } from '../../entities/user-code.entity';
import { User } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class UserCodeService {
  constructor(
    @InjectRepository(UserCode)
    private readonly userCodeRepository: Repository<UserCode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  /**
   * Generate a unique code for a user
   */
  async generateCode(
    userId: number,
    taskId?: number,
    codeType: CodeType = CodeType.TASK_VERIFICATION,
    metadata?: Record<string, any>,
    expiresInHours: number = 72,
    maxUses: number = 1,
  ): Promise<UserCode> {
    // Generate unique code
    const code = this.generateUniqueCodeString();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const userCode = this.userCodeRepository.create({
      user_id: userId,
      task_id: taskId,
      code,
      code_type: codeType,
      metadata: metadata || {},
      expires_at: expiresAt,
      max_uses: maxUses,
      status: UserCodeStatus.ACTIVE,
    });

    return this.userCodeRepository.save(userCode);
  }

  /**
   * Generate code for user by public key
   */
  async generateCodeForUser(
    publicKey: string,
    taskId?: number,
    codeType: CodeType = CodeType.TASK_VERIFICATION,
    metadata?: Record<string, any>,
    expiresInHours: number = 72,
  ): Promise<UserCode> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If task ID is provided, verify it exists
    if (taskId) {
      const task = await this.taskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    return this.generateCode(user.id, taskId, codeType, metadata, expiresInHours);
  }

  /**
   * Verify and use a code
   */
  async verifyCode(
    code: string,
    verificationData?: Record<string, any>,
  ): Promise<{ valid: boolean; userCode?: UserCode; message?: string }> {
    const userCode = await this.userCodeRepository.findOne({
      where: { code },
      relations: ['user', 'task'],
    });

    if (!userCode) {
      return { valid: false, message: 'Code not found' };
    }

    // Check if code is active
    if (userCode.status !== UserCodeStatus.ACTIVE) {
      return { valid: false, message: `Code is ${userCode.status.toLowerCase()}` };
    }

    // Check expiry
    if (userCode.expires_at && userCode.expires_at < new Date()) {
      userCode.status = UserCodeStatus.EXPIRED;
      await this.userCodeRepository.save(userCode);
      return { valid: false, message: 'Code has expired' };
    }

    // Check max uses
    if (userCode.use_count >= userCode.max_uses) {
      userCode.status = UserCodeStatus.USED;
      await this.userCodeRepository.save(userCode);
      return { valid: false, message: 'Code has already been used' };
    }

    // Mark as used
    userCode.use_count += 1;
    userCode.used_at = new Date();
    userCode.verification_result = verificationData || {};

    if (userCode.use_count >= userCode.max_uses) {
      userCode.status = UserCodeStatus.USED;
    }

    await this.userCodeRepository.save(userCode);

    return { valid: true, userCode };
  }

  /**
   * Get code by string
   */
  async getCodeByString(code: string): Promise<UserCode> {
    const userCode = await this.userCodeRepository.findOne({
      where: { code },
      relations: ['user', 'task'],
    });

    if (!userCode) {
      throw new NotFoundException('Code not found');
    }

    return userCode;
  }

  /**
   * Get codes for a user
   */
  async getCodesForUser(
    publicKey: string,
    status?: UserCodeStatus,
  ): Promise<UserCode[]> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const where: any = { user_id: user.id };
    if (status) {
      where.status = status;
    }

    return this.userCodeRepository.find({
      where,
      order: { created_at: 'DESC' },
      relations: ['task'],
    });
  }

  /**
   * Get code for user and task
   */
  async getCodeForUserAndTask(
    publicKey: string,
    taskId: number,
  ): Promise<UserCode | null> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userCodeRepository.findOne({
      where: {
        user_id: user.id,
        task_id: taskId,
        status: UserCodeStatus.ACTIVE,
      },
      relations: ['task'],
    });
  }

  /**
   * Revoke a code
   */
  async revokeCode(codeId: number): Promise<UserCode> {
    const userCode = await this.userCodeRepository.findOne({
      where: { id: codeId },
    });

    if (!userCode) {
      throw new NotFoundException('Code not found');
    }

    userCode.status = UserCodeStatus.REVOKED;
    return this.userCodeRepository.save(userCode);
  }

  /**
   * Clean up expired codes (can be run periodically)
   */
  async cleanupExpiredCodes(): Promise<number> {
    const expiredCodes = await this.userCodeRepository.find({
      where: {
        status: UserCodeStatus.ACTIVE,
        expires_at: LessThan(new Date()),
      },
    });

    for (const code of expiredCodes) {
      code.status = UserCodeStatus.EXPIRED;
      await this.userCodeRepository.save(code);
    }

    return expiredCodes.length;
  }

  /**
   * Generate a unique code string
   */
  private generateUniqueCodeString(): string {
    // Generate a 12-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, 1, I)
    let code = '';

    for (let i = 0; i < 12; i++) {
      const randomIndex = randomBytes(1)[0] % characters.length;
      code += characters[randomIndex];

      // Add dash every 4 characters for readability
      if (i === 3 || i === 7) {
        code += '-';
      }
    }

    return code; // Format: XXXX-XXXX-XXXX
  }
}
