import { Injectable } from '@nestjs/common';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { PresaleService } from './presale/presale.service';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  private connection: Connection;
  private program: Program;
  private presaleService: PresaleService;
  private userService: UserService;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    this.presaleService = new PresaleService(this.connection);
    this.userService = new UserService(null); // Will be injected properly
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getPresaleInfo() {
    try {
      const presaleInfo = await this.presaleService.getPresaleInfo();
      return {
        success: true,
        data: presaleInfo
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch presale info',
        error: error.message
      };
    }
  }

  async contributePresale(wallet: string, amount: number) {
    try {
      const result = await this.presaleService.contributePresale(wallet, amount);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to contribute to presale',
        error: error.message
      };
    }
  }

  async endPresale(adminWallet: string) {
    try {
      const result = await this.presaleService.endPresale(adminWallet);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to end presale',
        error: error.message
      };
    }
  }

  async restartPresale(adminWallet: string) {
    try {
      const result = await this.presaleService.restartPresale(adminWallet);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restart presale',
        error: error.message
      };
    }
  }

  async chooseSide(publicKey: string, side: string) {
    try {
      const result = await this.userService.chooseSide(publicKey, side);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to choose side',
        error: error.message
      };
    }
  }
}
