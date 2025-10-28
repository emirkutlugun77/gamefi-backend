import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StakingService } from './staking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Get('pool')
  @ApiOperation({ summary: 'Get staking pool information' })
  async getStakingPool() {
    return this.stakingService.getStakingPool();
  }

  @Get('nfts')
  @ApiOperation({ summary: 'Get staked NFTs for a specific owner' })
  @ApiQuery({ name: 'owner', required: true, description: 'Owner public key' })
  async getStakedNFTs(@Query('owner') owner: string) {
    return this.stakingService.getStakedNFTs(owner);
  }

  @Post('prepare-stake')
  @ApiOperation({ 
    summary: 'Prepare stake NFT transaction',
    description: 'Returns a serialized transaction for the user to sign with their wallet'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userWallet: {
          type: 'string',
          description: 'User wallet public key',
        },
        nftMintAddress: {
          type: 'string',
          description: 'NFT mint address',
        },
      },
      required: ['userWallet', 'nftMintAddress'],
    },
  })
  async prepareStakeNFT(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
  ) {
    return this.stakingService.prepareStakeNFT(userWallet, nftMintAddress);
  }

  @Post('prepare-place')
  @ApiOperation({ 
    summary: 'Prepare place NFT transaction',
    description: 'Returns a serialized transaction for the user to sign with their wallet. Places NFT in village to receive instant VYBE reward.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userWallet: {
          type: 'string',
          description: 'User wallet public key',
        },
        nftMintAddress: {
          type: 'string',
          description: 'NFT mint address',
        },
        typeName: {
          type: 'string',
          description: 'NFT type name',
        },
        nftTypePda: {
          type: 'string',
          description: 'NFT Type PDA address',
        },
      },
      required: ['userWallet', 'nftMintAddress', 'typeName', 'nftTypePda'],
    },
  })
  async preparePlaceNFT(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
    @Body('typeName') typeName: string,
    @Body('nftTypePda') nftTypePda: string,
  ) {
    return this.stakingService.preparePlaceNFT(userWallet, nftMintAddress, typeName, nftTypePda);
  }

  @Post('prepare-unplace')
  @ApiOperation({ 
    summary: 'Prepare unplace NFT transaction',
    description: 'Returns a serialized transaction for the user to sign with their wallet'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userWallet: {
          type: 'string',
          description: 'User wallet public key',
        },
        nftMintAddress: {
          type: 'string',
          description: 'NFT mint address',
        },
      },
      required: ['userWallet', 'nftMintAddress'],
    },
  })
  async prepareUnplaceNFT(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
  ) {
    return this.stakingService.prepareUnplaceNFT(userWallet, nftMintAddress);
  }

  @Post('prepare-unstake')
  @ApiOperation({ 
    summary: 'Prepare unstake NFT transaction',
    description: 'Returns a serialized transaction for the user to sign with their wallet'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userWallet: {
          type: 'string',
          description: 'User wallet public key',
        },
        nftMintAddress: {
          type: 'string',
          description: 'NFT mint address',
        },
      },
      required: ['userWallet', 'nftMintAddress'],
    },
  })
  async prepareUnstakeNFT(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
  ) {
    return this.stakingService.prepareUnstakeNFT(userWallet, nftMintAddress);
  }

  @Post('initialize-pool')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Admin: Initialize staking pool',
    description: 'One-time initialization of the staking pool. Creates the pool PDA, derives token vault ATA, and sets reward rate.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminPrivateKey: {
          type: 'string',
          description: 'Admin private key (base58 encoded)',
        },
        rewardRate: {
          type: 'number',
          description: 'Reward rate in tokens per month (in smallest unit). Example: 1000000000 for 1 VYBE/month',
        },
      },
      required: ['adminPrivateKey', 'rewardRate'],
    },
  })
  async initializePool(
    @Body('adminPrivateKey') adminPrivateKey: string,
    @Body('rewardRate') rewardRate: number,
  ) {
    return this.stakingService.initializeStakingPool(adminPrivateKey, rewardRate);
  }

  @Post('fund-pool-sol')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Fund staking pool with SOL' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminPrivateKey: {
          type: 'string',
          description: 'Admin private key (base58 encoded)',
        },
        amountLamports: {
          type: 'number',
          description: 'Amount in lamports',
        },
      },
      required: ['adminPrivateKey', 'amountLamports'],
    },
  })
  async fundPoolSOL(
    @Body('adminPrivateKey') adminPrivateKey: string,
    @Body('amountLamports') amountLamports: number,
  ) {
    return this.stakingService.fundPoolSOL(adminPrivateKey, amountLamports);
  }

  @Post('fund-pool-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Fund staking pool with VYBE tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminPrivateKey: {
          type: 'string',
          description: 'Admin private key (base58 encoded)',
        },
        amountTokens: {
          type: 'number',
          description: 'Amount of tokens (in smallest unit)',
        },
      },
      required: ['adminPrivateKey', 'amountTokens'],
    },
  })
  async fundPoolTokens(
    @Body('adminPrivateKey') adminPrivateKey: string,
    @Body('amountTokens') amountTokens: number,
  ) {
    return this.stakingService.fundPoolTokens(adminPrivateKey, amountTokens);
  }

  @Post('distribute-rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin: List NFTs eligible for rewards distribution',
    description:
      'Returns a list of all placed NFTs that are eligible for rewards. Users must claim rewards themselves through the frontend.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminPrivateKey: {
          type: 'string',
          description: 'Admin private key (base58 encoded)',
        },
      },
      required: ['adminPrivateKey'],
    },
  })
  async distributeRewards(@Body('adminPrivateKey') adminPrivateKey: string) {
    return this.stakingService.distributeStakingRewards(adminPrivateKey);
  }
}

