import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('by-public-key')
  async getByPublicKey(@Query('publicKey') publicKey: string): Promise<User> {
    if (!publicKey) {
      throw new Error('publicKey is required') as any
    }
    return this.userService.findByPublicKey(publicKey);
  }

  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOneById(id);
  }

  @Post('register')
  async register(@Body('publicKey') publicKey: string): Promise<User> {
    return this.userService.register(publicKey);
  }

  @Post('choose-side')
  async chooseSide(
    @Body('publicKey') publicKey: string,
    @Body('side') side: string,
  ): Promise<User> {
    return this.userService.chooseSide(publicKey, side);
  }
}


