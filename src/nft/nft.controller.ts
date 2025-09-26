import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NftService, MarketplaceData, NFTCollection, NFTItemType, Marketplace } from './nft.service';
import { 
  MarketplaceDataResponseDto, 
  CollectionsResponseDto, 
  UserNFTsResponseDto, 
  MarketplaceInfoResponseDto 
} from './dto/marketplace-response.dto';

@ApiTags('nft')
@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

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
}
