import { Controller, Post, Get, Put, Delete, Body, Query, Param, HttpException, HttpStatus, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { NftAdminService } from './nft-admin.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';

@ApiTags('nft-admin')
@Controller('nft-admin')
export class NftAdminController {
  constructor(private readonly nftAdminService: NftAdminService) {}

  @Post('collection')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create NFT collection with IPFS metadata',
    description: 'Creates a new NFT collection and uploads image + metadata to IPFS via QuickNode'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['adminPublicKey', 'name', 'symbol', 'royalty', 'description'],
      properties: {
        adminPublicKey: { type: 'string', example: 'Fn4P5PRhr7H58Ye1qcnaMvqDZAk3HGsgm6hDaXkVf46M' },
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
    description: 'Collection created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            collection: { type: 'object' },
            metadata: { type: 'object' },
            metadataUri: { type: 'string', example: 'ipfs://QmX...' },
            message: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async createCollection(
    @Body() dto: CreateCollectionDto,
    @UploadedFile() image: Express.Multer.File
  ) {
    try {
      return await this.nftAdminService.createCollectionWithFile(dto, image);
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
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create NFT type with IPFS metadata',
    description: 'Creates a new NFT type for a collection and uploads images + metadata to IPFS via QuickNode'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['adminPublicKey', 'collectionName', 'name', 'price', 'maxSupply', 'description'],
      properties: {
        adminPublicKey: { type: 'string', example: 'Fn4P5PRhr7H58Ye1qcnaMvqDZAk3HGsgm6hDaXkVf46M' },
        collectionName: { type: 'string', example: 'VYBE_BUILDINGS_COLLECTION' },
        name: { type: 'string', example: 'Wooden House' },
        price: { type: 'number', example: 0.5 },
        maxSupply: { type: 'number', example: 1000 },
        stakingAmount: { type: 'number', example: 0.01 },
        description: { type: 'string', example: 'A basic wooden house for your village' },
        attributes: { type: 'string', example: '[{"trait_type":"Rarity","value":"Common"}]' },
        mainImage: { type: 'string', format: 'binary', description: 'Main NFT image file' },
        additionalImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Additional image files (optional)' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'NFT type created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            nftType: { type: 'object' },
            metadata: { type: 'object' },
            metadataUri: { type: 'string', example: 'ipfs://QmX...' },
            priceLamports: { type: 'number' },
            stakingLamports: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    }
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
    @Body() dto: CreateTypeDto,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[], additionalImages?: Express.Multer.File[] }
  ) {
    try {
      return await this.nftAdminService.createTypeWithFiles(dto, files);
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
    summary: 'Get all collections',
    description: 'Retrieves all NFT collections from the database'
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
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
      const collections = await this.nftAdminService.getAllCollections();
      return {
        success: true,
        data: collections
      };
    } catch (error) {
      console.error('Error in getAllCollections controller:', error);
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

  @Get('types')
  @ApiOperation({
    summary: 'Get NFT types by collection',
    description: 'Retrieves all NFT types for a specific collection'
  })
  @ApiQuery({
    name: 'collection',
    description: 'Collection name',
    example: 'VYBE_BUILDINGS_COLLECTION',
    required: true
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
    status: 400,
    description: 'Collection name is required'
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getTypesByCollection(@Query('collection') collectionName: string) {
    if (!collectionName) {
      throw new HttpException(
        {
          success: false,
          message: 'Collection name is required'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const types = await this.nftAdminService.getTypesByCollection(collectionName);
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
}
