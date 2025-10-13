import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { ChooseSideDto } from './dto/choose-side.dto';
import { RegisterDto } from './dto/register.dto';
import { GetByPublicKeyDto } from './dto/get-by-public-key.dto';
import { GetByTelegramIdDto } from './dto/get-by-telegram-id.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  async getUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('by-public-key')
  @ApiOperation({ summary: 'Get user by public key' })
  @ApiQuery({ name: 'publicKey', required: true })
  @ApiQuery({ name: 'telegramId', required: false })
  @ApiResponse({ status: 200, description: 'User found' })
  async getByPublicKey(@Query('publicKey') publicKey: GetByPublicKeyDto['publicKey']): Promise<{ success: boolean; data: User | null }> {
    if (!publicKey) {
      return { success: false, data: null } as any;
    }
    const user = await this.userService.findByPublicKey(publicKey);
    return { success: true, data: user };
  }

  @Get('by-telegram-id')
  @ApiOperation({ summary: 'Get user by telegram ID' })
  @ApiQuery({ name: 'telegramId', required: true })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getByTelegramId(@Query('telegramId') telegramId: GetByTelegramIdDto['telegramId']): Promise<{ success: boolean; data: User | null }> {
    if (!telegramId) {
      return { success: false, data: null } as any;
    }
    const user = await this.userService.findByTelegramId(telegramId);
    return { success: true, data: user };
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOneById(id);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user by public key' })
  async register(@Body() body: RegisterDto): Promise<{ success: boolean; data: User }> {
    const user = await this.userService.register(body.publicKey, body.telegramId);
    return { success: true, data: user };
  }

  @Post('choose-side')
  @ApiOperation({ summary: 'Choose side for user' })
  async chooseSide(@Body() body: ChooseSideDto): Promise<{ success: boolean; data: User }> {
    const user = await this.userService.chooseSide(body.publicKey, body.side);
    return { success: true, data: user };
  }
}


