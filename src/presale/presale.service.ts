import { Injectable } from '@nestjs/common';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Program as AnchorProgram } from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

// Program ID from lib.rs
const PROGRAM_ID = new PublicKey('8KzE3LCicxv13iJx2v2V4VQQNWt4QHuvfuH8jxYnkGQ1');

export interface PresaleInfo {
  admin: string;
  startTs: number;
  endTs: number;
  totalRaised: number;
  targetLamports: number;
  isActive: boolean;
  bump: number;
}

@Injectable()
export class PresaleService {
  private connection: Connection;
  private program: AnchorProgram;

  constructor(connection: Connection) {
    this.connection = connection;
    // Program initialization would go here
    // For now, we'll implement the logic without Anchor program
  }

  private getPresalePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('presale')],
      PROGRAM_ID
    );
  }

  private getContributionPDA(presalePDA: PublicKey, contributor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('contrib'), presalePDA.toBuffer(), contributor.toBuffer()],
      PROGRAM_ID
    );
  }

  async getPresaleInfo(): Promise<PresaleInfo> {
    try {
      const [presalePDA] = this.getPresalePDA();
      const accountInfo = await this.connection.getAccountInfo(presalePDA);
      
      if (!accountInfo || accountInfo.data.length === 0) {
        throw new Error('Presale not initialized');
      }

      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const admin = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      
      const startTs = Number(data.readBigInt64LE(offset));
      offset += 8;
      
      const endTs = Number(data.readBigInt64LE(offset));
      offset += 8;
      
      const totalRaised = Number(data.readBigUInt64LE(offset));
      offset += 8;
      
      const targetLamports = Number(data.readBigUInt64LE(offset));
      offset += 8;
      
      const isActive = data.readUInt8(offset) === 1;
      offset += 1;
      
      const bump = data.readUInt8(offset);

      return {
        admin: admin.toString(),
        startTs,
        endTs,
        totalRaised,
        targetLamports,
        isActive,
        bump
      };
    } catch (error) {
      console.error('Error fetching presale info:', error);
      throw error;
    }
  }

  async contributePresale(walletAddress: string, amount: number): Promise<string> {
    try {
      const contributor = new PublicKey(walletAddress);
      const [presalePDA] = this.getPresalePDA();
      const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);

      // Create transaction
      const transaction = new Transaction();

      // Add contribute instruction
      // This would be the actual Anchor instruction call
      // For now, we'll simulate the transaction
      
      const lamports = Math.floor(amount * 1e9); // Convert SOL to lamports
      
      // Add transfer instruction (simplified version)
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: contributor,
        toPubkey: presalePDA,
        lamports: lamports,
      });

      transaction.add(transferInstruction);

      // In a real implementation, you would:
      // 1. Get the contributor's keypair (from wallet)
      // 2. Send and confirm the transaction
      // 3. Return the transaction signature

      return 'simulated_transaction_signature';
    } catch (error) {
      console.error('Error contributing to presale:', error);
      throw error;
    }
  }

  async endPresale(adminWallet: string): Promise<string> {
    try {
      const admin = new PublicKey(adminWallet);
      const [presalePDA] = this.getPresalePDA();

      // Create transaction
      const transaction = new Transaction();

      // Add end presale instruction
      // This would be the actual Anchor instruction call
      
      // In a real implementation, you would:
      // 1. Get the admin's keypair
      // 2. Send and confirm the transaction
      // 3. Return the transaction signature

      return 'simulated_end_transaction_signature';
    } catch (error) {
      console.error('Error ending presale:', error);
      throw error;
    }
  }

  async restartPresale(adminWallet: string): Promise<string> {
    try {
      const admin = new PublicKey(adminWallet);
      const [presalePDA] = this.getPresalePDA();

      // Create transaction
      const transaction = new Transaction();

      // Add restart presale instruction
      // This would be the actual Anchor instruction call
      
      // In a real implementation, you would:
      // 1. Get the admin's keypair
      // 2. Send and confirm the transaction
      // 3. Return the transaction signature

      return 'simulated_restart_transaction_signature';
    } catch (error) {
      console.error('Error restarting presale:', error);
      throw error;
    }
  }
}

