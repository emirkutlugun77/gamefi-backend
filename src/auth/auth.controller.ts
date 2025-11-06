import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { IsString, IsNotEmpty } from 'class-validator';

class CheckPasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with Solana private key',
    description:
      'Provide your base58-encoded Solana private key to receive a JWT token. The private key is encrypted and stored in the token for secure transaction signing.',
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
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('check-password')
  @ApiOperation({
    summary: 'Check access password for protected pages',
    description:
      'Validates password for accessing Admin, Presale, and Airdrop pages. ',
  })
  @ApiResponse({
    status: 200,
    description: 'Password validation result',
    schema: {
      example: {
        success: true,
        data: {
          isValid: true,
          message: 'Password is correct',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Invalid password',
    schema: {
      example: {
        success: true,
        data: {
          isValid: false,
          message: 'Invalid password',
        },
      },
    },
  })
  async checkPassword(@Body() checkPasswordDto: CheckPasswordDto) {
    const CORRECT_PASSWORD = process.env.PASSWORD;
    const isValid = checkPasswordDto.password === CORRECT_PASSWORD;

    return {
      success: true,
      data: {
        isValid,
        message: isValid ? 'Password is correct' : 'Invalid password',
      },
    };
  }
}
