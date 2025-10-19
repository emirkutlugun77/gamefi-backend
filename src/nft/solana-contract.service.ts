import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Wallet,
} from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

// Use require for JSON to ensure proper loading
const IDL = require('./nft_marketplace.json');

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const PROGRAM_ID = new PublicKey('Cvz71nzvusTyvH6GzeuHSVKPAGABH2q5tw2HRJdmzvEj');

@Injectable()
export class SolanaContractService {
  private connection: Connection;
  private program: Program;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Create a dummy wallet for readonly provider
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async () => { throw new Error('Not implemented'); },
      signAllTransactions: async () => { throw new Error('Not implemented'); },
    };

    const provider = new AnchorProvider(
      this.connection,
      dummyWallet as any,
      { commitment: 'confirmed' }
    );

    // Initialize Program with the IDL - address is in the IDL itself
    // @ts-ignore
    this.program = new Program(IDL, provider);
  }

  /**
   * Get marketplace PDA address
   */
  getMarketplacePda(): PublicKey {
    const [marketplacePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      PROGRAM_ID
    );
    return marketplacePda;
  }

  /**
   * Check if marketplace is initialized
   */
  async isMarketplaceInitialized(): Promise<boolean> {
    try {
      const marketplacePda = this.getMarketplacePda();
      const accountInfo = await this.connection.getAccountInfo(marketplacePda);
      return accountInfo !== null;
    } catch (error) {
      console.error('Error checking marketplace status:', error);
      return false;
    }
  }

  /**
   * Initialize marketplace (must be called once before creating collections)
   */
  async initializeMarketplace(
    adminKeypair: Keypair,
    feeBps: number = 500 // Default 5% fee (500 basis points)
  ): Promise<{
    signature: string;
    marketplacePda: string;
  }> {
    try {
      console.log('Initializing marketplace with fee:', feeBps, 'bps');

      const admin = adminKeypair.publicKey;
      const marketplacePda = this.getMarketplacePda();

      console.log('Marketplace PDA:', marketplacePda.toString());
      console.log('Admin:', admin.toString());

      // Create instruction using Anchor
      const instruction = await this.program.methods
        .initializeMarketplace(feeBps)
        .accounts({
          marketplace: marketplacePda,
          admin,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction with increased compute budget
      const transaction = new Transaction();

      // Add compute budget instructions
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });

      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1
      });

      transaction.add(modifyComputeUnits);
      transaction.add(addPriorityFee);
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Sign transaction
      transaction.sign(adminKeypair);

      // Send and confirm transaction
      console.log('Sending transaction to Solana...');
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [adminKeypair],
        {
          commitment: 'confirmed',
        }
      );

      console.log('✅ Marketplace initialized successfully!');
      console.log('   Signature:', signature);
      console.log('   Marketplace PDA:', marketplacePda.toString());

      return {
        signature,
        marketplacePda: marketplacePda.toString(),
      };
    } catch (error) {
      console.error('Error initializing marketplace:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to initialize marketplace',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create collection, sign and submit transaction
   */
  async createAndSubmitCollection(
    adminKeypair: Keypair,
    collectionMintKeypair: Keypair,
    collectionName: string,
    symbol: string,
    uri: string,
    royalty: number
  ): Promise<{
    signature: string;
    collectionPda: string;
    collectionMint: string;
  }> {
    try {
      console.log('Creating and submitting collection:', collectionName);

      const admin = adminKeypair.publicKey;
      const collectionMint = collectionMintKeypair.publicKey;

      // Derive PDAs
      const [marketplacePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace')],
        PROGRAM_ID
      );

      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), Buffer.from(collectionName)],
        PROGRAM_ID
      );

      const [collectionMetadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const adminTokenAccount = await getAssociatedTokenAddress(
        collectionMint,
        admin
      );

      console.log('PDAs derived:', {
        marketplace: marketplacePda.toString(),
        collection: collectionPda.toString(),
        metadata: collectionMetadataPda.toString(),
        masterEdition: collectionMasterEditionPda.toString(),
        adminTokenAccount: adminTokenAccount.toString(),
      });

      // Create instruction using Anchor
      const instruction = await this.program.methods
        .createNftCollection(collectionName, symbol, uri, royalty)
        .accounts({
          marketplace: marketplacePda,
          collection: collectionPda,
          collectionMint,
          adminTokenAccount,
          collectionMetadata: collectionMetadataPda,
          collectionMasterEdition: collectionMasterEditionPda,
          admin,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();

      // Create transaction with increased compute budget
      const transaction = new Transaction();

      // Add compute budget instructions to increase limit
      // Set compute unit limit to 400,000 (2x default)
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000
      });

      // Set compute unit price (priority fee) - 1 micro lamport per compute unit
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1
      });

      transaction.add(modifyComputeUnits);
      transaction.add(addPriorityFee);
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Sign transaction with both keypairs
      transaction.partialSign(adminKeypair);
      transaction.partialSign(collectionMintKeypair);

      // Send and confirm transaction
      console.log('Sending transaction to Solana...');
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [adminKeypair, collectionMintKeypair],
        {
          commitment: 'confirmed',
        }
      );

      console.log('✅ Collection created successfully!');
      console.log('   Signature:', signature);
      console.log('   Collection PDA:', collectionPda.toString());
      console.log('   Collection Mint:', collectionMint.toString());

      return {
        signature,
        collectionPda: collectionPda.toString(),
        collectionMint: collectionMint.toString(),
      };
    } catch (error) {
      console.error('Error creating collection transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create collection transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create NFT type, sign and submit transaction
   */
  async createAndSubmitNftType(
    adminKeypair: Keypair,
    collectionName: string,
    typeName: string,
    uri: string,
    price: number, // in lamports
    maxSupply: number,
    stakingAmount: number // in lamports
  ): Promise<{
    signature: string;
    nftTypePda: string;
  }> {
    try {
      console.log('Creating and submitting NFT type:', { collectionName, typeName });

      const admin = adminKeypair.publicKey;

      // Derive PDAs
      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), Buffer.from(collectionName)],
        PROGRAM_ID
      );

      const [nftTypePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('type'), collectionPda.toBuffer(), Buffer.from(typeName)],
        PROGRAM_ID
      );

      console.log('PDAs derived:', {
        collection: collectionPda.toString(),
        nftType: nftTypePda.toString(),
      });

      // Create instruction using Anchor
      const instruction = await this.program.methods
        .createNftType(typeName, uri, price, maxSupply, stakingAmount)
        .accounts({
          collection: collectionPda,
          nftType: nftTypePda,
          admin,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Create transaction with increased compute budget
      const transaction = new Transaction();

      // Add compute budget instructions
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });

      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1
      });

      transaction.add(modifyComputeUnits);
      transaction.add(addPriorityFee);
      transaction.add(instruction);

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = admin;

      // Sign transaction
      transaction.sign(adminKeypair);

      // Send and confirm transaction
      console.log('Sending transaction to Solana...');
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [adminKeypair],
        {
          commitment: 'confirmed',
        }
      );

      console.log('✅ NFT type created successfully!');
      console.log('   Signature:', signature);
      console.log('   NFT Type PDA:', nftTypePda.toString());

      return {
        signature,
        nftTypePda: nftTypePda.toString(),
      };
    } catch (error) {
      console.error('Error creating NFT type transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create NFT type transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
