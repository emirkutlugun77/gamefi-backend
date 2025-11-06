import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { SolanaContractService } from '../nft/solana-contract.service';
import * as IDL from '../nft/nft_marketplace_idl.json';
import * as bs58Module from 'bs58';
const bs58 = (bs58Module as any).default || bs58Module;

const PROGRAM_ID = new PublicKey(
  'B6c38JtYJXDiaW2XNJWrueLUULAD4vsxChz1VJk1d9zX',
);
const VYBE_TOKEN_MINT = new PublicKey(
  'GshYgeeG5xmeMJ4crtg1SHGafYXBpnCyPz9VNF8DXxSW',
);
const TOKEN_PROGRAM = TOKEN_2022_PROGRAM_ID; // VYBE uses Token-2022!

@Injectable()
export class StakingService {
  private connection: Connection;
  private program: Program;

  constructor(private readonly solanaContractService: SolanaContractService) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
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
   * Get all staked NFTs for a given owner
   */
  async getStakedNFTs(ownerPubkey: string): Promise<any[]> {
    try {
      const owner = new PublicKey(ownerPubkey);

      // Fetch all StakedNFT accounts
      const stakedNFTs = await (this.program.account as any).stakedNft.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: owner.toBase58(),
          },
        },
      ]);

      return stakedNFTs.map((nft: any) => ({
        publicKey: nft.publicKey.toString(),
        owner: nft.account.owner.toString(),
        nftMint: nft.account.nftMint.toString(),
        stakingPool: nft.account.stakingPool.toString(),
        stakedAt: nft.account.stakedAt.toString(),
        lastClaimed: nft.account.lastClaimed.toString(),
        isPlaced: nft.account.isPlaced,
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
   * Get staking pool info
   */
  async getStakingPool(): Promise<any> {
    try {
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const stakingPool = await (this.program.account as any).stakingPool.fetch(
        stakingPoolPda,
      );

      return {
        publicKey: stakingPoolPda.toString(),
        admin: stakingPool.admin.toString(),
        rewardTokenMint: stakingPool.rewardTokenMint.toString(),
        solVault: stakingPool.solVault.toString(),
        tokenVault: stakingPool.tokenVault.toString(),
        rewardRate: stakingPool.rewardRate.toString(),
        totalStaked: stakingPool.totalStaked.toString(),
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
   * Admin function to distribute rewards to all placed NFTs
   * This is a backend-only operation that requires admin private key
   */
  async distributeStakingRewards(adminPrivateKey: string): Promise<any> {
    try {
      console.log('🎁 Starting staking rewards distribution...');

      // Get all StakedNFT accounts that are placed (is_placed = true)
      const allStakedNFTs = await (this.program.account as any).stakedNft.all();
      const placedNFTs = allStakedNFTs.filter(
        (nft: any) => nft.account.isPlaced === true,
      );

      console.log(
        `Found ${placedNFTs.length} placed NFTs out of ${allStakedNFTs.length} total staked NFTs`,
      );

      if (placedNFTs.length === 0) {
        return {
          success: true,
          message: 'No placed NFTs to distribute rewards to',
          distributed: 0,
        };
      }

      // For each placed NFT, we would call claim_rewards
      // However, claim_rewards requires the owner's signature
      // So this function is more of a "list of who should get rewards"
      // In a real implementation, you might want to:
      // 1. Create a merkle tree of eligible addresses
      // 2. Allow users to claim via frontend
      // 3. Or use a cron job to send rewards via airdrops

      const eligibleForRewards = placedNFTs.map((nft: any) => ({
        owner: nft.account.owner.toString(),
        nftMint: nft.account.nftMint.toString(),
        stakedAt: new Date(
          nft.account.stakedAt.toNumber() * 1000,
        ).toISOString(),
        lastClaimed: new Date(
          nft.account.lastClaimed.toNumber() * 1000,
        ).toISOString(),
      }));

      return {
        success: true,
        message: `Found ${eligibleForRewards.length} NFTs eligible for rewards`,
        eligibleNFTs: eligibleForRewards,
        note: 'Users must claim rewards themselves through the frontend',
      };
    } catch (error) {
      console.error('Error distributing staking rewards:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to distribute staking rewards',
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
  ): Promise<any> {
    try {
      console.log('📦 Preparing stake transaction for NFT:', nftMintAddress);

      const owner = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const [stakedNftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staked_nft'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      console.log('Staking Pool PDA:', stakingPoolPda.toString());
      console.log('Staked NFT PDA:', stakedNftPda.toString());

      // Build instruction
      const instruction = await (this.program.methods as any)
        .stakeNft()
        .accounts({
          stakingPool: stakingPoolPda,
          stakedNft: stakedNftPda,
          owner: owner,
          nftMint: nftMint,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

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
        stakedNftPda: stakedNftPda.toString(),
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
   * Prepare place NFT transaction
   */
  async preparePlaceNFT(
    userWallet: string,
    nftMintAddress: string,
    typeName: string,
    nftTypePda: string,
  ): Promise<any> {
    try {
      console.log('🏘️ Preparing place NFT transaction:', nftMintAddress);

      const owner = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);
      const nftType = new PublicKey(nftTypePda);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const [stakedNftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staked_nft'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      const [tokenVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_vault')],
        PROGRAM_ID,
      );

      // Get owner's VYBE token account (Token-2022!)
      const ownerTokenAccount = await getAssociatedTokenAddress(
        VYBE_TOKEN_MINT,
        owner,
        false,
        TOKEN_PROGRAM,
      );

      // Build instruction
      const instruction = await (this.program.methods as any)
        .placeNft(typeName)
        .accounts({
          stakingPool: stakingPoolPda,
          stakedNft: stakedNftPda,
          nftType: nftType,
          tokenVault: tokenVaultPda,
          ownerTokenAccount: ownerTokenAccount,
          owner: owner,
          nftMint: nftMint,
          tokenProgram: TOKEN_PROGRAM, // Token-2022
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Place NFT transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing place NFT transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare place NFT transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare unplace NFT transaction
   */
  async prepareUnplaceNFT(
    userWallet: string,
    nftMintAddress: string,
  ): Promise<any> {
    try {
      console.log('🚪 Preparing unplace NFT transaction:', nftMintAddress);

      const owner = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [stakedNftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staked_nft'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Build instruction
      const instruction = await (this.program.methods as any)
        .unplaceNft()
        .accounts({
          stakedNft: stakedNftPda,
          owner: owner,
          nftMint: nftMint,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

      // Serialize transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      console.log('✅ Unplace NFT transaction prepared');

      return {
        success: true,
        message: 'Transaction prepared. Please sign with your wallet.',
        transaction: serializedTransaction.toString('base64'),
      };
    } catch (error) {
      console.error('Error preparing unplace NFT transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare unplace NFT transaction',
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

      const owner = new PublicKey(userWallet);
      const nftMint = new PublicKey(nftMintAddress);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const [stakedNftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staked_nft'), nftMint.toBuffer()],
        PROGRAM_ID,
      );

      // Build instruction
      const instruction = await (this.program.methods as any)
        .unstakeNft()
        .accounts({
          stakingPool: stakingPoolPda,
          stakedNft: stakedNftPda,
          owner: owner,
          nftMint: nftMint,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } =
        await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

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
   * Admin: Initialize staking pool
   */
  async initializeStakingPool(
    adminPrivateKey: string,
    rewardRate: number,
  ): Promise<any> {
    try {
      console.log('🎯 Initializing staking pool with reward rate:', rewardRate);

      // Decode admin private key
      const privateKeyBytes = bs58.decode(adminPrivateKey);
      const adminKeypair = Keypair.fromSecretKey(privateKeyBytes);
      const admin = adminKeypair.publicKey;

      // Create provider with admin wallet
      const wallet = new Wallet(adminKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
      });
      const program = new Program(IDL as any, provider);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const [solVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('sol_vault')],
        PROGRAM_ID,
      );

      // Token vault will be the Associated Token Account of the staking pool (Token-2022!)
      const tokenVault = await getAssociatedTokenAddress(
        VYBE_TOKEN_MINT,
        stakingPoolPda,
        true, // allowOwnerOffCurve - PDA can own token accounts
        TOKEN_PROGRAM, // Token-2022
      );

      console.log('Staking Pool PDA:', stakingPoolPda.toString());
      console.log('SOL Vault PDA:', solVaultPda.toString());
      console.log('Token Vault (ATA):', tokenVault.toString());

      const tx = await (program.methods as any)
        .initializeStakingPool(new BN(rewardRate))
        .accounts({
          stakingPool: stakingPoolPda,
          admin: admin,
          rewardTokenMint: VYBE_TOKEN_MINT,
          solVault: solVaultPda,
          tokenVault: tokenVault,
          tokenProgram: TOKEN_PROGRAM, // Token-2022
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log('✅ Staking pool initialized! TX:', tx);

      return {
        success: true,
        message: 'Staking pool initialized successfully',
        transaction: tx,
        stakingPoolPda: stakingPoolPda.toString(),
        solVaultPda: solVaultPda.toString(),
        tokenVaultAddress: tokenVault.toString(),
        rewardRate: rewardRate,
        note: 'Token vault (ATA) will be created automatically when you fund the pool',
      };
    } catch (error) {
      console.error('Error initializing staking pool:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to initialize staking pool',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Admin: Fund pool with SOL
   */
  async fundPoolSOL(
    adminPrivateKey: string,
    amountLamports: number,
  ): Promise<any> {
    try {
      console.log('💰 Funding pool with SOL:', amountLamports, 'lamports');

      // Decode admin private key
      const privateKeyBytes = bs58.decode(adminPrivateKey);
      const adminKeypair = Keypair.fromSecretKey(privateKeyBytes);
      const admin = adminKeypair.publicKey;

      // Create provider with admin wallet
      const wallet = new Wallet(adminKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
      });
      const program = new Program(IDL as any, provider);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      const [solVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('sol_vault')],
        PROGRAM_ID,
      );

      const tx = await (program.methods as any)
        .fundPoolSol(new BN(amountLamports))
        .accounts({
          stakingPool: stakingPoolPda,
          solVault: solVaultPda,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Pool funded with SOL! TX:', tx);

      return {
        success: true,
        message: `Pool funded with ${amountLamports} lamports SOL`,
        transaction: tx,
      };
    } catch (error) {
      console.error('Error funding pool with SOL:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fund pool with SOL',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Admin: Fund pool with VYBE tokens
   */
  async fundPoolTokens(
    adminPrivateKey: string,
    amountTokens: number,
  ): Promise<any> {
    try {
      console.log('💎 Funding pool with VYBE tokens:', amountTokens);

      // Decode admin private key
      const privateKeyBytes = bs58.decode(adminPrivateKey);
      const adminKeypair = Keypair.fromSecretKey(privateKeyBytes);
      const admin = adminKeypair.publicKey;

      // Create provider with admin wallet
      const wallet = new Wallet(adminKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
      });
      const program = new Program(IDL as any, provider);

      // Derive PDAs
      const [stakingPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        PROGRAM_ID,
      );

      // Token vault is the ATA of staking pool for VYBE (Token-2022!)
      const tokenVault = await getAssociatedTokenAddress(
        VYBE_TOKEN_MINT,
        stakingPoolPda,
        true, // allowOwnerOffCurve
        TOKEN_PROGRAM,
      );

      // Get admin's VYBE token account (Token-2022!)
      const adminTokenAccount = await getAssociatedTokenAddress(
        VYBE_TOKEN_MINT,
        admin,
        false,
        TOKEN_PROGRAM,
      );

      const tx = await (program.methods as any)
        .fundPoolTokens(new BN(amountTokens))
        .accounts({
          stakingPool: stakingPoolPda,
          tokenVault: tokenVault,
          adminTokenAccount: adminTokenAccount,
          admin: admin,
          tokenProgram: TOKEN_PROGRAM, // Token-2022
        })
        .rpc();

      console.log('✅ Pool funded with VYBE tokens! TX:', tx);

      return {
        success: true,
        message: `Pool funded with ${amountTokens} VYBE tokens`,
        transaction: tx,
      };
    } catch (error) {
      console.error('Error funding pool with tokens:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fund pool with tokens',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
