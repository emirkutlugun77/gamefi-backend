import { Controller, Post, Get, Put, Delete, Body, Query, Param, HttpException, HttpStatus, UseInterceptors, UploadedFile, UploadedFiles, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiParam, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NftAdminService } from './nft-admin.service';
import { NftService } from './nft.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';

// Extend Express Request type to include user
interface RequestWithUser extends Request {
  user: {
    encryptedPrivateKey: string;
    publicKey: string;
  };
}

@ApiTags('nft-admin')
@Controller('nft-admin')
export class NftAdminController {
  constructor(
    private readonly nftAdminService: NftAdminService,
    private readonly nftService: NftService,
  ) {}

  @Post('initialize-marketplace')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initialize marketplace on Solana',
    description: 'Initializes the NFT marketplace smart contract. This must be done once before creating any collections. Requires JWT authentication.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        feeBps: { type: 'number', example: 500, description: 'Marketplace fee in basis points (500 = 5%)' }
      }
    },
    required: false
  })
  @ApiResponse({
    status: 201,
    description: 'Marketplace initialized successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            signature: { type: 'string', example: '5Kq...' },
            marketplacePda: { type: 'string', example: '9Aqrcm...' },
            feeBps: { type: 'number', example: 500 },
            explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 409,
    description: 'Marketplace already initialized'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async initializeMarketplace(
    @Req() req: RequestWithUser,
    @Body() body?: { feeBps?: number }
  ) {
    try {
      const feeBps = body?.feeBps || 500;
      return await this.nftAdminService.initializeMarketplaceWithAuth(req.user.encryptedPrivateKey, feeBps);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in initializeMarketplace controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to initialize marketplace',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('marketplace-status')
  @ApiOperation({
    summary: 'Check marketplace initialization status',
    description: 'Check if the marketplace has been initialized on Solana'
  })
  @ApiResponse({
    status: 200,
    description: 'Marketplace status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isInitialized: { type: 'boolean', example: true },
            marketplacePda: { type: 'string', example: '9Aqrcm...' },
            message: { type: 'string', example: 'Marketplace is initialized and ready!' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getMarketplaceStatus() {
    try {
      return await this.nftAdminService.checkMarketplaceStatus();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in getMarketplaceStatus controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get marketplace status',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('collection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create NFT collection on Solana',
    description: 'Uploads image + metadata to IPFS, creates collection on-chain and returns transaction signature. Requires JWT authentication. Note: Marketplace must be initialized first.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'symbol', 'royalty', 'description'],
      properties: {
        name: { type: 'string', example: 'VYBE_BUILDINGS_COLLECTION' },
        symbol: { type: 'string', example: 'VYBEB' },
        royalty: { type: 'number', example: 5 },
        description: { type: 'string', example: 'Buildings collection for VYBE game' },
        image: { type: 'string', format: 'binary', description: 'Collection image file' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully on Solana',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            signature: { type: 'string', example: '5Kq...' },
            collectionPda: { type: 'string', example: '9Aqrcm...' },
            collectionMint: { type: 'string', example: 'Cv7jep...' },
            metadataUri: { type: 'string', example: 'ipfs://QmX...' },
            explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async createCollection(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCollectionDto,
    @UploadedFile() image: Express.Multer.File
  ) {
    try {
      return await this.nftAdminService.createCollectionWithAuth(req.user.encryptedPrivateKey, dto, image);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in createCollection controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create collection',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create NFT type on Solana',
    description: 'Uploads images + metadata to IPFS, creates NFT type on-chain and returns transaction signature. Requires JWT authentication.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['collectionName', 'name', 'price', 'maxSupply', 'description'],
      properties: {
        collectionName: { type: 'string', example: 'VYBE_BUILDINGS_COLLECTION' },
        name: { type: 'string', example: 'Wooden House' },
        price: { type: 'number', example: 0.01, description: 'Price in SOL' },
        maxSupply: { type: 'number', example: 1000 },
        stakingAmount: { type: 'number', example: 0.001, description: 'Staking amount in SOL (optional)' },
        description: { type: 'string', example: 'A basic wooden house for your village' },
        attributes: { type: 'string', example: '[{"trait_type":"Rarity","value":"Common"}]', description: 'JSON string of attributes (optional)' },
        mainImage: { type: 'string', format: 'binary', description: 'Main NFT image file' },
        additionalImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Additional image files (optional)' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'NFT type created successfully on Solana',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            signature: { type: 'string', example: '5Kq...' },
            nftTypePda: { type: 'string', example: '9Aqrcm...' },
            nftType: { type: 'object' },
            metadata: { type: 'object' },
            metadataUri: { type: 'string', example: 'ipfs://QmX...' },
            mainImageUri: { type: 'string', example: 'ipfs://QmY...' },
            additionalImageUris: { type: 'array', items: { type: 'string' } },
            priceLamports: { type: 'number' },
            stakingLamports: { type: 'number' },
            explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async createType(
    @Req() req: RequestWithUser,
    @Body() dto: CreateTypeDto,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[], additionalImages?: Express.Multer.File[] }
  ) {
    try {
      return await this.nftAdminService.createTypeWithAuth(req.user.encryptedPrivateKey, dto, files);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in createType controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create NFT type',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('collections')
  @ApiOperation({
    summary: 'Get all collections from blockchain',
    description: 'Retrieves all NFT collections directly from the Solana blockchain (blockchain is source of truth)'
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully from blockchain',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getAllCollections() {
    try {
      // Fetch from blockchain instead of database (blockchain is source of truth)
      const { collections } = await this.nftService.fetchCollections();
      return {
        success: true,
        data: collections
      };
    } catch (error) {
      console.error('Error in getAllCollections controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch collections from blockchain',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('collections/:name')
  @ApiOperation({
    summary: 'Delete collection from database sync',
    description: 'Removes collection from database sync. NOTE: This does NOT delete from blockchain (blockchain is immutable). Only removes from local database.'
  })
  @ApiParam({
    name: 'name',
    description: 'Collection name',
    example: 'VYBE_BUILDINGS_COLLECTION'
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted from database successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Collection removed from database (still exists on blockchain)' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found in database'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async deleteCollection(@Param('name') name: string) {
    try {
      await this.nftAdminService.deleteCollectionFromDatabase(name);
      return {
        success: true,
        message: 'Collection removed from database (still exists on blockchain)'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in deleteCollection controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete collection',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('types')
  @ApiOperation({
    summary: 'Get NFT types by collection',
    description: 'Retrieves all NFT types for a specific collection, or all types if no collection specified'
  })
  @ApiQuery({
    name: 'collection',
    description: 'Collection name (optional - if not provided, returns all types)',
    example: 'VYBE_BUILDINGS_COLLECTION',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'NFT types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getTypesByCollection(@Query('collection') collectionName?: string) {
    try {
      let types: any[];

      if (collectionName) {
        // Get types for specific collection
        types = await this.nftAdminService.getTypesByCollection(collectionName);
      } else {
        // Get all types from all collections
        types = await this.nftAdminService.getAllTypes();
      }

      return {
        success: true,
        data: types
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in getTypesByCollection controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch NFT types',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('types/:id')
  @ApiOperation({
    summary: 'Delete NFT type from database sync',
    description: 'Removes NFT type from database sync. NOTE: This does NOT delete from blockchain (blockchain is immutable). Only removes from local database.'
  })
  @ApiParam({
    name: 'id',
    description: 'NFT type ID (PDA address)',
    example: 'DiY16YeswLB1sJceP2HwsWJG5z7LiuDi5Sjcp94HGofV'
  })
  @ApiResponse({
    status: 200,
    description: 'NFT type deleted from database successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'NFT type removed from database (still exists on blockchain)' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'NFT type not found in database'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async deleteType(@Param('id') id: string) {
    try {
      await this.nftAdminService.deleteTypeFromDatabase(id);
      return {
        success: true,
        message: 'NFT type removed from database (still exists on blockchain)'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in deleteType controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete NFT type',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('store-config')
  @ApiOperation({
    summary: 'Set store configuration',
    description: 'Create or update store tab configuration (building, troops, others)'
  })
  @ApiBody({ type: CreateStoreConfigDto })
  @ApiResponse({
    status: 201,
    description: 'Store configuration set successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async setStoreConfig(@Body() dto: CreateStoreConfigDto) {
    try {
      const config = await this.nftAdminService.setStoreConfig(dto);
      return {
        success: true,
        data: config,
        message: 'Store configuration set successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in setStoreConfig controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to set store configuration',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('store-config/:tabName')
  @ApiOperation({
    summary: 'Update store configuration',
    description: 'Update an existing store tab configuration'
  })
  @ApiParam({
    name: 'tabName',
    description: 'Tab name (building, troops, or others)',
    example: 'building'
  })
  @ApiBody({ type: UpdateStoreConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Store configuration updated successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Store configuration not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async updateStoreConfig(
    @Param('tabName') tabName: string,
    @Body() dto: UpdateStoreConfigDto
  ) {
    try {
      const config = await this.nftAdminService.updateStoreConfig(tabName, dto);
      return {
        success: true,
        data: config,
        message: 'Store configuration updated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in updateStoreConfig controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update store configuration',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('store-configs')
  @ApiOperation({
    summary: 'Get all store configurations',
    description: 'Retrieves all store tab configurations'
  })
  @ApiResponse({
    status: 200,
    description: 'Store configurations retrieved successfully'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getAllStoreConfigs() {
    try {
      const configs = await this.nftAdminService.getAllStoreConfigs();
      return {
        success: true,
        data: configs
      };
    } catch (error) {
      console.error('Error in getAllStoreConfigs controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch store configurations',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('store-config/:tabName')
  @ApiOperation({
    summary: 'Get store configuration by tab name',
    description: 'Retrieves store configuration for a specific tab'
  })
  @ApiParam({
    name: 'tabName',
    description: 'Tab name (building, troops, or others)',
    example: 'building'
  })
  @ApiResponse({
    status: 200,
    description: 'Store configuration retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Store configuration not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getStoreConfig(@Param('tabName') tabName: string) {
    try {
      const config = await this.nftAdminService.getStoreConfig(tabName);
      return {
        success: true,
        data: config
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in getStoreConfig controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch store configuration',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('store-config/:tabName')
  @ApiOperation({
    summary: 'Delete store configuration',
    description: 'Deletes store configuration for a specific tab'
  })
  @ApiParam({
    name: 'tabName',
    description: 'Tab name (building, troops, or others)',
    example: 'building'
  })
  @ApiResponse({
    status: 200,
    description: 'Store configuration deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Store configuration not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async deleteStoreConfig(@Param('tabName') tabName: string) {
    try {
      await this.nftAdminService.deleteStoreConfig(tabName);
      return {
        success: true,
        message: 'Store configuration deleted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in deleteStoreConfig controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete store configuration',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync/collections')
  @ApiOperation({
    summary: 'Sync collections from Solana blockchain',
    description: 'Fetches all collections from the Solana program and syncs them to the database'
  })
  @ApiResponse({
    status: 200,
    description: 'Collections synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            synced: { type: 'number', example: 3 },
            created: { type: 'number', example: 1 },
            updated: { type: 'number', example: 2 },
            collections: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async syncCollections() {
    try {
      const result = await this.nftAdminService.syncCollectionsFromBlockchain();
      return {
        success: true,
        data: result,
        message: `Synced ${result.synced} collections (${result.created} created, ${result.updated} updated)`
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in syncCollections controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync collections',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync/types')
  @ApiOperation({
    summary: 'Sync NFT types from Solana blockchain',
    description: 'Fetches all NFT types from the Solana program and syncs them to the database'
  })
  @ApiResponse({
    status: 200,
    description: 'NFT types synced successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            synced: { type: 'number', example: 5 },
            created: { type: 'number', example: 2 },
            updated: { type: 'number', example: 3 },
            skipped: { type: 'number', example: 0 },
            types: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async syncTypes() {
    try {
      const result = await this.nftAdminService.syncTypesFromBlockchain();
      return {
        success: true,
        data: result,
        message: `Synced ${result.synced} types (${result.created} created, ${result.updated} updated, ${result.skipped} skipped)`
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in syncTypes controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync NFT types',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync/all')
  @ApiOperation({
    summary: 'Sync all data from Solana blockchain',
    description: 'Syncs both collections and NFT types from the Solana program to the database'
  })
  @ApiResponse({
    status: 200,
    description: 'All data synced successfully'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async syncAll() {
    try {
      console.log('Starting full blockchain sync...');

      // First sync collections
      const collectionsResult = await this.nftAdminService.syncCollectionsFromBlockchain();
      console.log('Collections synced:', collectionsResult);

      // Then sync types
      const typesResult = await this.nftAdminService.syncTypesFromBlockchain();
      console.log('Types synced:', typesResult);

      return {
        success: true,
        data: {
          collections: collectionsResult,
          types: typesResult
        },
        message: `Full sync complete: ${collectionsResult.synced} collections, ${typesResult.synced} types`
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in syncAll controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync all data',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('mint')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mint NFT from collection',
    description: 'Mints an NFT from a specific collection type. Requires both collection admin and buyer to sign the transaction. Requires JWT authentication.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['collectionName', 'typeName', 'collectionMintAddress', 'buyerPublicKey'],
      properties: {
        collectionName: { type: 'string', example: 'VYBE_HEROES_COLLECTION' },
        typeName: { type: 'string', example: 'Duma_Bright' },
        collectionMintAddress: { type: 'string', example: 'Cv7jep...' },
        buyerPublicKey: { type: 'string', example: '7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'NFT minted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            signature: { type: 'string', example: '5Kq...' },
            nftMint: { type: 'string', example: '9Aqrcm...' },
            buyerTokenAccount: { type: 'string', example: 'Cv7jep...' },
            explorerUrl: { type: 'string', example: 'https://explorer.solana.com/tx/...?cluster=devnet' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async mintNft(
    @Req() req: RequestWithUser,
    @Body() body: {
      collectionName: string;
      typeName: string;
      collectionMintAddress: string;
      buyerPublicKey: string;
    }
  ) {
    try {
      return await this.nftAdminService.mintNftWithAuth(
        req.user.encryptedPrivateKey,
        body.collectionName,
        body.typeName,
        body.collectionMintAddress,
        body.buyerPublicKey
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error in mintNft controller:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mint NFT',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
