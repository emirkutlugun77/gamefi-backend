import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('user/choose-side')
  @ApiOperation({ summary: 'Choose user side (DARK or HOLY)' })
  async chooseSide(@Body() body: { publicKey: string; side: string }) {
    return this.appService.chooseSide(body.publicKey, body.side);
  }
}
