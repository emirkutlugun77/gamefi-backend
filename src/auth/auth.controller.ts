import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with Solana private key',
    description: 'Provide your base58-encoded Solana private key to receive a JWT token. The private key is encrypted and stored in the token for secure transaction signing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, JWT token returned',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          publicKey: 'Fn4P5PRhr7H58Ye1qcnaMvqDZAk3HGsgm6hDaXkVf46M',
          expiresIn: '1d',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid private key format',
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto.privateKey);

      return {
        success: true,
        data: {
          accessToken: result.accessToken,
          publicKey: result.publicKey,
          expiresIn: '1d',
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Login failed',
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
