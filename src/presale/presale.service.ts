import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import * as IDL from '../nft/nft_marketplace_idl.json';

// Contract addresses
const PROGRAM_ID = new PublicKey(
  '6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm',
);

export interface PresaleInfo {
  publicKey: string;
  admin: string;
  startTs: number;
  endTs: number;
  totalRaised: number;
  totalRaisedSol: string;
  targetLamports: number;
  targetSol: string;
  isActive: boolean;
  timeRemaining: number;
  progress: number; // percentage
}

@Injectable()
export class PresaleService {
  private connection: Connection;
  private program: Program;

  constructor() {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Create a dummy wallet for read-only operations
    const dummyKeypair = Keypair.generate();
    const wallet = new Wallet(dummyKeypair);
    const provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    this.program = new Program(IDL as any, provider);
  }

  private getPresalePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('presale')],
      PROGRAM_ID,
    );
  }

  private getContributionPDA(
    presalePda: PublicKey,
    contributor: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('contrib'), presalePda.toBuffer(), contributor.toBuffer()],
      PROGRAM_ID,
    );
  }

  /**
   * Get presale information
   */
  async getPresaleInfo(): Promise<PresaleInfo> {
    try {
      const [presalePDA] = this.getPresalePDA();

      const presaleAccount = await (this.program.account as any).presale.fetch(
        presalePDA,
      );

      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = Math.max(
        0,
        presaleAccount.endTs.toNumber() - currentTime,
      );
      const progress = Math.min(
        100,
        (presaleAccount.totalRaised.toNumber() /
          presaleAccount.targetLamports.toNumber()) *
          100,
      );

      return {
        publicKey: presalePDA.toString(),
        admin: presaleAccount.admin.toString(),
        startTs: presaleAccount.startTs.toNumber(),
        endTs: presaleAccount.endTs.toNumber(),
        totalRaised: presaleAccount.totalRaised.toNumber(),
        totalRaisedSol: (
          presaleAccount.totalRaised.toNumber() / 1e9
        ).toFixed(2),
        targetLamports: presaleAccount.targetLamports.toNumber(),
        targetSol: (presaleAccount.targetLamports.toNumber() / 1e9).toFixed(0),
        isActive: presaleAccount.isActive,
        timeRemaining,
        progress,
      };
    } catch (error) {
      console.error('Error fetching presale info:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch presale info',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get contribution info for a wallet
   */
  async getContribution(walletAddress: string): Promise<any> {
    try {
      const contributor = new PublicKey(walletAddress);
      const [presalePDA] = this.getPresalePDA();
      const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);

      try {
        const contribution = await (
          this.program.account as any
        ).presaleContribution.fetch(contributionPDA);

        return {
          success: true,
          contribution: {
            publicKey: contributionPDA.toString(),
            presale: contribution.presale.toString(),
            contributor: contribution.contributor.toString(),
            amount: contribution.amount.toNumber(),
            amountSol: (contribution.amount.toNumber() / 1e9).toFixed(2),
          },
        };
      } catch (err) {
        // Contribution doesn't exist yet
        return {
          success: true,
          contribution: null,
          message: 'No contribution found for this wallet',
        };
      }
    } catch (error) {
      console.error('Error fetching contribution:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch contribution',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare initialize presale transaction
   */
  async prepareInitializePresale(adminWallet: string): Promise<any> {
    try {
      console.log('🚀 Preparing initialize presale transaction...');

      const admin = new PublicKey(adminWallet);
      const [presalePDA] = this.getPresalePDA();

      console.log('Admin:', admin.toString());
      console.log('Presale PDA:', presalePDA.toString());

      // Build instruction
      const instruction = await (this.program.methods as any)
        .initializePresale()
        .accounts({
          presale: presalePDA,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        }),
      );
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 1,
        }),
      );

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Initialize presale transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
        presalePda: presalePDA.toString(),
      };
    } catch (error) {
      console.error('Error preparing initialize presale transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare initialize presale transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare contribute presale transaction
   */
  async prepareContributePresale(
    contributorWallet: string,
    amountSol: number,
  ): Promise<any> {
    try {
      console.log(
        '💰 Preparing contribute presale transaction:',
        amountSol,
        'SOL',
      );

      const contributor = new PublicKey(contributorWallet);
      const [presalePDA] = this.getPresalePDA();
      const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);

      const lamports = Math.floor(amountSol * 1e9);

      console.log('Contributor:', contributor.toString());
      console.log('Presale PDA:', presalePDA.toString());
      console.log('Contribution PDA:', contributionPDA.toString());
      console.log('Amount:', lamports, 'lamports');

      // Build instruction
      const instruction = await (this.program.methods as any)
        .contributePresale(new BN(lamports))
        .accounts({
          presale: presalePDA,
          contribution: contributionPDA,
          contributor: contributor,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        }),
      );

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = contributor;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Contribute presale transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
        contributionPda: contributionPDA.toString(),
      };
    } catch (error) {
      console.error('Error preparing contribute presale transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare contribute presale transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare end presale transaction
   */
  async prepareEndPresale(adminWallet: string): Promise<any> {
    try {
      console.log('🏁 Preparing end presale transaction...');

      const admin = new PublicKey(adminWallet);
      const [presalePDA] = this.getPresalePDA();

      console.log('Admin:', admin.toString());
      console.log('Presale PDA:', presalePDA.toString());

      // Build instruction
      const instruction = await (this.program.methods as any)
        .endPresale()
        .accounts({
          presale: presalePDA,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        }),
      );

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ End presale transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing end presale transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare end presale transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare restart presale transaction
   */
  async prepareRestartPresale(adminWallet: string): Promise<any> {
    try {
      console.log('🔄 Preparing restart presale transaction...');

      const admin = new PublicKey(adminWallet);
      const [presalePDA] = this.getPresalePDA();

      console.log('Admin:', admin.toString());
      console.log('Presale PDA:', presalePDA.toString());

      // Build instruction
      const instruction = await (this.program.methods as any)
        .restartPresale()
        .accounts({
          presale: presalePDA,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        }),
      );

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Restart presale transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing restart presale transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare restart presale transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
