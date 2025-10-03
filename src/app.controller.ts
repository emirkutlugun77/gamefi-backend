import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('presale')
  async getPresaleInfo() {
    return this.appService.getPresaleInfo();
  }

  @Post('presale/contribute')
  async contributePresale(@Body() body: { wallet: string; amount: number }) {
    return this.appService.contributePresale(body.wallet, body.amount);
  }

  @Post('presale/end')
  async endPresale(@Body() body: { adminWallet: string }) {
    return this.appService.endPresale(body.adminWallet);
  }

  @Post('presale/restart')
  async restartPresale(@Body() body: { adminWallet: string }) {
    return this.appService.restartPresale(body.adminWallet);
  }

  @Post('user/choose-side')
  async chooseSide(@Body() body: { publicKey: string; side: string }) {
    return this.appService.chooseSide(body.publicKey, body.side);
  }
}
