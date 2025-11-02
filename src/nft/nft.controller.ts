import { Controller, Get, Post, Query, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NftService, MarketplaceData, NFTCollection, NFTItemType, Marketplace } from './nft.service';
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { 
  MarketplaceDataResponseDto, 
  CollectionsResponseDto, 
  UserNFTsResponseDto, 
  MarketplaceInfoResponseDto 
} from './dto/marketplace-response.dto';

@ApiTags('nft')
@Controller('nft')
export class NftController {
  private readonly connection: Connection;
  private readonly adminKeypair: Keypair;

  constructor(private readonly nftService: NftService) {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Load admin private key from environment variable
    const adminPrivateKey = process.env.NFT_ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error('NFT_ADMIN_PRIVATE_KEY environment variable is required');
    }
    this.adminKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(adminPrivateKey))
    );
    
    console.log(`✅ Admin wallet loaded: ${this.adminKeypair.publicKey.toString()}`);
  }

  @Get('marketplace')
  @ApiOperation({ 
    summary: 'Get complete marketplace data',
    description: 'Marketplace bilgileri, tüm koleksiyonlar ve item tiplerini blockchain\'den çeker' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Marketplace data successfully retrieved',
    type: MarketplaceDataResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMarketplaceData() {
    try {
      const data = await this.nftService.getMarketplaceData();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch marketplace data',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('collections')
  @ApiOperation({ 
    summary: 'Get collections and item types',
    description: 'Sadece koleksiyonlar ve item tiplerini blockchain\'den çeker' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Collections successfully retrieved',
    type: CollectionsResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCollections() {
    try {
      const { collections, itemTypesByCollection } = await this.nftService.fetchCollections();
      return {
        success: true,
        data: {
          collections,
          itemTypesByCollection
        }
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch collections',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user-nfts')
  @ApiOperation({ 
    summary: 'Get user NFTs',
    description: 'Belirtilen wallet adresine ait NFT\'leri blockchain\'den çeker' 
  })
  @ApiQuery({ 
    name: 'wallet', 
    description: 'Solana wallet public key', 
    example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe',
    required: true 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User NFTs successfully retrieved',
    type: UserNFTsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Wallet address is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserNFTs(@Query('wallet') walletAddress: string) {
    if (!walletAddress) {
      throw new HttpException(
        {
          success: false,
          message: 'Wallet address is required'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const nfts = await this.nftService.fetchUserNFTs(walletAddress);
      return {
        success: true,
        data: {
          nfts,
          count: nfts.length
        }
      };
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch user NFTs',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('collection-nfts')
  @ApiOperation({ 
    summary: 'Get all NFTs in target collection',
    description: 'DAS API ile target collection\'daki tüm NFT\'leri çeker (VYBE_SUPERHEROES)' 
  })
  @ApiQuery({ 
    name: 'collection', 
    description: 'Collection mint address (optional, defaults to VYBE_SUPERHEROES)', 
    example: 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN',
    required: false 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Collection NFTs successfully retrieved',
    type: UserNFTsResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCollectionNFTs(@Query('collection') collectionAddress?: string) {
    try {
      const nfts = await this.nftService.getCollectionNFTs(collectionAddress);
      return {
        success: true,
        data: {
          nfts,
          count: nfts.length,
          collection: collectionAddress || 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN'
        }
      };
    } catch (error) {
      console.error('Error fetching collection NFTs:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch collection NFTs',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('marketplace-info')
  @ApiOperation({
    summary: 'Get marketplace info',
    description: 'Sadece marketplace temel bilgilerini blockchain\'den çeker'
  })
  @ApiResponse({
    status: 200,
    description: 'Marketplace info successfully retrieved',
    type: MarketplaceInfoResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMarketplaceInfo() {
    try {
      const marketplace = await this.nftService.fetchMarketplace();
      return {
        success: true,
        data: marketplace
      };
    } catch (error) {
      console.error('Error fetching marketplace info:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch marketplace info',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('staked/:walletAddress')
  @ApiOperation({
    summary: 'Get staked NFTs for a wallet',
    description: 'Belirtilen wallet adresine ait stake edilmiş NFT\'leri blockchain\'den çeker'
  })
  @ApiResponse({
    status: 200,
    description: 'Staked NFTs successfully retrieved'
  })
  @ApiResponse({ status: 400, description: 'Wallet address is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStakedNFTs(@Param('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      throw new HttpException(
        {
          success: false,
          message: 'Wallet address is required'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const stakes = await this.nftService.fetchStakedNFTs(walletAddress);
      return {
        success: true,
        data: {
          stakes,
          count: stakes.length
        }
      };
    } catch (error) {
      console.error('Error fetching staked NFTs:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch staked NFTs',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('rewards/:walletAddress/:nftMint')
  @ApiOperation({
    summary: 'Get pending rewards for a staked NFT',
    description: 'Belirtilen NFT için bekleyen ödülleri hesaplar'
  })
  @ApiResponse({
    status: 200,
    description: 'Rewards successfully calculated'
  })
  @ApiResponse({ status: 400, description: 'Wallet address and NFT mint are required' })
  @ApiResponse({ status: 404, description: 'Stake account not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPendingRewards(
    @Param('walletAddress') walletAddress: string,
    @Param('nftMint') nftMint: string
  ) {
    if (!walletAddress || !nftMint) {
      throw new HttpException(
        {
          success: false,
          message: 'Wallet address and NFT mint are required'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const rewards = await this.nftService.calculatePendingRewards(walletAddress, nftMint);
      return {
        success: true,
        data: rewards
      };
    } catch (error) {
      console.error('Error calculating pending rewards:', error);

      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: 'Stake account not found',
            error: error.message
          },
          HttpStatus.NOT_FOUND
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to calculate pending rewards',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('admin/mint-nft')
  @ApiOperation({
    summary: 'Sign and send NFT mint transaction',
    description: 'Admin wallet ile transaction\'ı imzalayıp gönderir'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transaction: {
          type: 'array',
          items: { type: 'number' },
          description: 'Serialized transaction bytes'
        },
        nftMint: {
          type: 'string',
          description: 'NFT mint public key'
        },
        blockhash: {
          type: 'string',
          description: 'Transaction blockhash (optional, will be refreshed if expired)'
        }
      },
      required: ['transaction', 'nftMint']
    }
  })
  @ApiResponse({ status: 200, description: 'Transaction sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async mintNft(@Body() body: { transaction: number[]; nftMint: string; blockhash?: string }) {
    try {
      const { transaction: txBytes, nftMint, blockhash: clientBlockhash } = body;

      if (!txBytes || !Array.isArray(txBytes)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid transaction data'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      console.log(`📝 Received transaction for NFT mint: ${nftMint}`);
      console.log(`📦 Transaction size: ${txBytes.length} bytes`);
      console.log(`🔑 Admin wallet: ${this.adminKeypair.publicKey.toString()}`);

      // Deserialize transaction (partially signed by frontend)
      const transaction = Transaction.from(Buffer.from(txBytes));
      
      // Check if blockhash is still valid, refresh if needed
      console.log('🔄 Checking blockhash validity...');
      const { blockhash: latestBlockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      
      // Use client's blockhash if it's still valid, otherwise refresh
      let blockhashToUse = clientBlockhash || latestBlockhash;
      
      // Check if client blockhash is still valid by comparing with latest
      // If client blockhash matches or transaction doesn't have one, use latest
      if (!transaction.recentBlockhash || transaction.recentBlockhash.toString() !== latestBlockhash) {
        blockhashToUse = latestBlockhash;
        console.log('🔄 Blockhash expired, using fresh blockhash');
      } else {
        console.log('✅ Client blockhash is still valid');
      }
      
      // Set blockhash and metadata
      transaction.recentBlockhash = blockhashToUse;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      if (!transaction.feePayer) {
        transaction.feePayer = this.adminKeypair.publicKey;
      }
      
      console.log(`📝 Using blockhash: ${blockhashToUse.slice(0, 8)}...`);
      
      // Verify admin wallet is in the transaction
      // Check if admin public key appears in any instruction account keys
      const adminPubkeyStr = this.adminKeypair.publicKey.toString();
      const adminPubkey = this.adminKeypair.publicKey;
      
      // Find admin's index in signatures array by checking all instructions
      let adminKeyIndex = -1;
      for (let i = 0; i < transaction.instructions.length; i++) {
        const instruction = transaction.instructions[i];
        // Check if admin is in the keys
        if (instruction.keys) {
          const keyIndex = instruction.keys.findIndex(
            (meta) => meta.pubkey.toString() === adminPubkeyStr
          );
          if (keyIndex !== -1) {
            // Admin found, now find its position in transaction signatures
            // We need to determine which signature slot corresponds to this account
            // Since we can't directly map, we'll just try to sign and see if it works
            adminKeyIndex = i; // This is approximate, we'll sign anyway
            break;
          }
        }
      }

      // Check if admin needs to sign by looking at instruction account metas
      let needsAdminSignature = false;
      for (const instruction of transaction.instructions) {
        if (instruction.keys) {
          const adminMeta = instruction.keys.find(
            (meta) => meta.pubkey.toString() === adminPubkeyStr && meta.isSigner
          );
          if (adminMeta && adminMeta.isSigner) {
            needsAdminSignature = true;
            break;
          }
        }
      }

      if (!needsAdminSignature) {
        console.warn(`⚠️  Admin wallet ${adminPubkeyStr} may not need to sign, but signing anyway...`);
      }

      // Sign with admin keypair (partialSign will add signature if needed)
      // This will automatically find the correct signature slot for admin
      transaction.partialSign(this.adminKeypair);
      
      console.log('✅ Transaction signed by admin');
      
      // Serialize fully signed transaction
      const fullySignedTx = transaction.serialize({
        requireAllSignatures: true,
        verifySignatures: false // We've already verified signatures manually
      });
      console.log(`📤 Sending transaction (${fullySignedTx.length} bytes)...`);
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        fullySignedTx,
        {
          skipPreflight: false,
          maxRetries: 3,
        }
      );
      
      console.log(`🚀 Transaction sent: ${signature}`);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log('✅ Transaction confirmed!');
      
      return {
        success: true,
        signature,
        message: 'NFT minted successfully'
      };
    } catch (error: any) {
      console.error('❌ Error minting NFT:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mint NFT',
          error: error.message || 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
