import { Injectable } from '@nestjs/common';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  constructor(private readonly userService: UserService) {}

  getHello(): string {
    return 'VYBE Marketplace Backend API - Use /api for Swagger documentation';
  }

  async chooseSide(publicKey: string, side: string) {
    try {
      const result = await this.userService.chooseSide(publicKey, side);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to choose side',
        error: error.message,
      };
    }
  }
}
