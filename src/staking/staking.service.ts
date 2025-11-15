import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import * as IDL from '../nft/nft_marketplace_idl.json';
import * as bs58Module from 'bs58';
const bs58 = (bs58Module as any).default || bs58Module;

// NEW CONTRACT ADDRESSES - DEPLOYED
const PROGRAM_ID = new PublicKey(
  '6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm',
);
const STAKE_POOL_PDA = new PublicKey(
  'EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH',
);
const REWARD_TOKEN_MINT = new PublicKey(
  'Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc',
);
const REWARD_VAULT_PDA = new PublicKey(
  '9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg',
);

@Injectable()
export class StakingService {
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

  /**
   * Get all contract addresses
   */
  async getContractAddresses(): Promise<any> {
    return {
      success: true,
      network: 'devnet',
      rpcUrl: this.connection.rpcEndpoint,
      addresses: {
        programId: PROGRAM_ID.toString(),
        stakePoolPda: STAKE_POOL_PDA.toString(),
        rewardVaultPda: REWARD_VAULT_PDA.toString(),
        rewardTokenMint: REWARD_TOKEN_MINT.toString(),
      },
      explorer: {
        program: `https://solscan.io/account/${PROGRAM_ID.toString()}?cluster=devnet`,
        stakePool: `https://solscan.io/account/${STAKE_POOL_PDA.toString()}?cluster=devnet`,
        rewardVault: `https://solscan.io/account/${REWARD_VAULT_PDA.toString()}?cluster=devnet`,
        rewardToken: `https://solscan.io/account/${REWARD_TOKEN_MINT.toString()}?cluster=devnet`,
      },
      deployment: {
        programId: '6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm',
        deployer: 'EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr',
        deploymentTx: '2ySM7ZenuHNKvzcEetVmRqLibuLW6JvUYx2YXMztRDMESrZ5rK8H5VaDCmkygBd2K9RZuqZcxRcRfH93j5bDqa4r',
        stakingPoolInitTx: '2GDsw7hKq8NL8cb4YeNBBbbPogbe6DzD5gpnW8eNqrGkbbwb44KajdqZyddPGgTDj7Givs9YKUtMcFu3t5Lnrjo',
      },
      rewardConfig: {
        baseRatePerSecond: 277777,
        tokensPerHour: 1,
        formula: 'actual_rewards = base_rate × stake_multiplier / 10000',
        multiplierExamples: {
          common: { multiplier: 10000, tokensPerHour: 1 },
          rare: { multiplier: 20000, tokensPerHour: 2 },
          epic: { multiplier: 30000, tokensPerHour: 3 },
          legendary: { multiplier: 50000, tokensPerHour: 5 },
        },
      },
    };
  }

  /**
   * Get staking pool info
   */
  async getStakingPool(): Promise<any> {
    try {
      const stakingPool = await (this.program.account as any).stakePool.fetch(
        STAKE_POOL_PDA,
      );

      return {
        publicKey: STAKE_POOL_PDA.toString(),
        admin: stakingPool.admin.toString(),
        rewardTokenMint: stakingPool.rewardTokenMint.toString(),
        rewardRatePerSecond: stakingPool.rewardRatePerSecond.toString(),
        totalStaked: stakingPool.totalStaked.toString(),
        rewardVault: REWARD_VAULT_PDA.toString(),
      };
    } catch (error) {
      console.error('Error fetching staking pool:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch staking pool',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all staked NFTs for a given owner
   */
  async getStakedNFTs(ownerPubkey: string): Promise<any[]> {
    try {
      const owner = new PublicKey(ownerPubkey);

      // Fetch all StakeAccount accounts for this owner
      const stakeAccounts = await (
        this.program.account as any
      ).stakeAccount.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: owner.toBase58(),
          },
        },
      ]);

      return stakeAccounts.map((account: any) => ({
        publicKey: account.publicKey.toString(),
        owner: account.account.owner.toString(),
        nftMint: account.account.nftMint.toString(),
        nftType: account.account.nftType.toString(),
        stakePool: account.account.stakePool.toString(),
        stakeTimestamp: account.account.stakeTimestamp.toString(),
        lastClaimTimestamp: account.account.lastClaimTimestamp.toString(),
        stakeMultiplier: account.account.stakeMultiplier.toString(),
      }));
    } catch (error) {
      console.error('Error fetching staked NFTs:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch staked NFTs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate pending rewards for a staked NFT
   */
  async calculatePendingRewards(
    nftMintAddress: string,
    stakerAddress: string,
  ): Promise<any> {
    try {
      const nftMint = new PublicKey(nftMintAddress);
      const staker = new PublicKey(stakerAddress);

      // Derive stake account PDA
      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake_account'), staker.toBuffer(), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Fetch stake account
      const stakeAccount = await (
        this.program.account as any
      ).stakeAccount.fetch(stakeAccountPda);

      // Fetch stake pool to get reward rate
      const stakePool = await (this.program.account as any).stakePool.fetch(
        STAKE_POOL_PDA,
      );

      // Calculate rewards
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastClaim =
        currentTime - stakeAccount.lastClaimTimestamp.toNumber();
      const baseRewards =
        timeSinceLastClaim * stakePool.rewardRatePerSecond.toNumber();
      const rewards = Math.floor(
        (baseRewards * stakeAccount.stakeMultiplier.toNumber()) / 10000,
      );

      return {
        success: true,
        nftMint: nftMintAddress,
        staker: stakerAddress,
        pendingRewards: rewards,
        pendingRewardsFormatted: (rewards / 1e9).toFixed(9), // Assuming 9 decimals
        stakeTimestamp: stakeAccount.stakeTimestamp.toString(),
        lastClaimTimestamp: stakeAccount.lastClaimTimestamp.toString(),
        stakeMultiplier: stakeAccount.stakeMultiplier.toString(),
        timeSinceLastClaim: timeSinceLastClaim,
      };
    } catch (error) {
      console.error('Error calculating pending rewards:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate pending rewards',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare stake NFT transaction (returns serialized transaction for frontend to sign)
   */
  async prepareStakeNFT(
    userWallet: string,
    nftMintAddress: string,
    collectionName: string,
    typeName: string,
  ): Promise<any> {
    try {
      console.log('📦 Preparing stake transaction for NFT:', nftMintAddress);

      const staker = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), Buffer.from(collectionName)],
        PROGRAM_ID,
      );

      const [nftTypePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('type'),
          collectionPda.toBuffer(),
          Buffer.from(typeName),
        ],
        PROGRAM_ID,
      );

      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake_account'), staker.toBuffer(), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      const [vaultNftTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Get staker's NFT token account
      const stakerNftTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        staker,
      );

      // Get NFT metadata PDA (Metaplex)
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      );
      const [nftMetadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          nftMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
      );

      console.log('Stake Pool PDA:', STAKE_POOL_PDA.toString());
      console.log('Stake Account PDA:', stakeAccountPda.toString());
      console.log('NFT Type PDA:', nftTypePda.toString());
      console.log('Vault NFT Account:', vaultNftTokenAccount.toString());

      // Build instruction
      const instruction = await (this.program.methods as any)
        .stakeNft()
        .accounts({
          stakePool: STAKE_POOL_PDA,
          stakeAccount: stakeAccountPda,
          collection: collectionPda,
          nftType: nftTypePda,
          nftMint: nftMint,
          nftMetadata: nftMetadataPda,
          stakerNftTokenAccount: stakerNftTokenAccount,
          vaultNftTokenAccount: vaultNftTokenAccount,
          staker: staker,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000,
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
      transaction.feePayer = staker;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Transaction prepared successfully');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
        stakeAccountPda: stakeAccountPda.toString(),
      };
    } catch (error) {
      console.error('Error preparing stake transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare stake transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare unstake NFT transaction
   */
  async prepareUnstakeNFT(
    userWallet: string,
    nftMintAddress: string,
  ): Promise<any> {
    try {
      console.log('📤 Preparing unstake NFT transaction:', nftMintAddress);

      const staker = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake_account'), staker.toBuffer(), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      const [vaultNftTokenAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Get staker's NFT token account
      const stakerNftTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        staker,
      );

      // Get staker's reward token account
      const stakerRewardTokenAccount = await getAssociatedTokenAddress(
        REWARD_TOKEN_MINT,
        staker,
      );

      // Check if staker reward account exists, if not we'll create it
      const stakerRewardAccountInfo =
        await this.connection.getAccountInfo(stakerRewardTokenAccount);

      // Build instruction
      const instruction = await (this.program.methods as any)
        .unstakeNft()
        .accounts({
          stakePool: STAKE_POOL_PDA,
          stakeAccount: stakeAccountPda,
          rewardTokenMint: REWARD_TOKEN_MINT,
          rewardTokenVault: REWARD_VAULT_PDA,
          stakerRewardTokenAccount: stakerRewardTokenAccount,
          vaultNftTokenAccount: vaultNftTokenAccount,
          stakerNftTokenAccount: stakerNftTokenAccount,
          staker: staker,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();

      // Add compute budget
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000,
        }),
      );

      // Create reward token account if it doesn't exist
      if (!stakerRewardAccountInfo) {
        console.log('Creating reward token account for staker...');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            staker,
            stakerRewardTokenAccount,
            staker,
            REWARD_TOKEN_MINT,
          ),
        );
      }

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = staker;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Unstake NFT transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing unstake NFT transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare unstake NFT transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare claim rewards transaction
   */
  async prepareClaimRewards(
    userWallet: string,
    nftMintAddress: string,
  ): Promise<any> {
    try {
      console.log('💰 Preparing claim rewards transaction:', nftMintAddress);

      const staker = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake_account'), staker.toBuffer(), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Get staker's reward token account
      const stakerRewardTokenAccount = await getAssociatedTokenAddress(
        REWARD_TOKEN_MINT,
        staker,
      );

      // Check if staker reward account exists
      const stakerRewardAccountInfo =
        await this.connection.getAccountInfo(stakerRewardTokenAccount);

      // Build instruction
      const instruction = await (this.program.methods as any)
        .claimRewards()
        .accounts({
          stakePool: STAKE_POOL_PDA,
          stakeAccount: stakeAccountPda,
          rewardTokenMint: REWARD_TOKEN_MINT,
          rewardTokenVault: REWARD_VAULT_PDA,
          stakerRewardTokenAccount: stakerRewardTokenAccount,
          staker: staker,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
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

      // Create reward token account if it doesn't exist
      if (!stakerRewardAccountInfo) {
        console.log('Creating reward token account for staker...');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            staker,
            stakerRewardTokenAccount,
            staker,
            REWARD_TOKEN_MINT,
          ),
        );
      }

      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = staker;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Claim rewards transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing claim rewards transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare claim rewards transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Admin: Fund reward vault with tokens
   */
  async fundRewardVault(
    adminPrivateKey: string,
    amountTokens: number,
  ): Promise<any> {
    try {
      console.log('💎 Funding reward vault with tokens:', amountTokens);

      // Decode admin private key
      const privateKeyBytes = bs58.decode(adminPrivateKey);
      const adminKeypair = Keypair.fromSecretKey(privateKeyBytes);
      const admin = adminKeypair.publicKey;

      // Get admin's token account
      const adminTokenAccount = await getAssociatedTokenAddress(
        REWARD_TOKEN_MINT,
        admin,
      );

      // Create transfer instruction
      const { Token} = require('@solana/spl-token');
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add transfer instruction (SPL Token transfer)
      const transferIx = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        adminTokenAccount,
        REWARD_VAULT_PDA,
        admin,
        [],
        amountTokens,
      );
      
      transaction.add(transferIx);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Sign and send
      transaction.partialSign(adminKeypair);
      const tx = await this.connection.sendRawTransaction(
        transaction.serialize(),
      );
      await this.connection.confirmTransaction(tx, 'confirmed');

      console.log('✅ Reward vault funded! TX:', tx);

      return {
        success: true,
        message: `Reward vault funded with ${amountTokens} tokens`,
        transaction: tx,
      };
    } catch (error) {
      console.error('Error funding reward vault:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fund reward vault',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
