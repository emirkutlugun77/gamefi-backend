import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StakingService } from './staking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Staking')
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @Get('addresses')
  @ApiOperation({
    summary: 'Get all contract addresses',
    description:
      'Returns all deployed smart contract addresses including program ID, stake pool, reward vault, etc.',
  })
  async getContractAddresses() {
    return this.stakingService.getContractAddresses();
  }

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

  @Get('pending-rewards')
  @ApiOperation({ summary: 'Calculate pending rewards for a staked NFT' })
  @ApiQuery({
    name: 'nftMint',
    required: true,
    description: 'NFT mint address',
  })
  @ApiQuery({
    name: 'staker',
    required: true,
    description: 'Staker wallet address',
  })
  async getPendingRewards(
    @Query('nftMint') nftMint: string,
    @Query('staker') staker: string,
  ) {
    return this.stakingService.calculatePendingRewards(nftMint, staker);
  }

  @Post('prepare-stake')
  @ApiOperation({
    summary: 'Prepare stake NFT transaction',
    description:
      'Returns a serialized transaction for the user to sign with their wallet. Stakes NFT and starts earning hourly rewards.',
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
        collectionName: {
          type: 'string',
          description: 'Collection name (e.g., "VYBE")',
        },
        typeName: {
          type: 'string',
          description: 'NFT type name (e.g., "Barbarian")',
        },
      },
      required: ['userWallet', 'nftMintAddress', 'collectionName', 'typeName'],
    },
  })
  async prepareStakeNFT(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
    @Body('collectionName') collectionName: string,
    @Body('typeName') typeName: string,
  ) {
    return this.stakingService.prepareStakeNFT(
      userWallet,
      nftMintAddress,
      collectionName,
      typeName,
    );
  }

  @Post('prepare-unstake')
  @ApiOperation({
    summary: 'Prepare unstake NFT transaction',
    description:
      'Returns a serialized transaction for the user to sign with their wallet. Unstakes NFT and claims all pending rewards.',
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

  @Post('prepare-claim')
  @ApiOperation({
    summary: 'Prepare claim rewards transaction',
    description:
      'Returns a serialized transaction for the user to sign with their wallet. Claims rewards without unstaking NFT.',
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
  async prepareClaimRewards(
    @Body('userWallet') userWallet: string,
    @Body('nftMintAddress') nftMintAddress: string,
  ) {
    return this.stakingService.prepareClaimRewards(userWallet, nftMintAddress);
  }

  @Post('fund-reward-vault')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin: Fund reward vault with tokens',
    description:
      'Transfer reward tokens to the vault so stakers can claim their rewards',
  })
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
          description: 'Amount of tokens (in smallest unit, e.g., 1e9 for 1 token)',
        },
      },
      required: ['adminPrivateKey', 'amountTokens'],
    },
  })
  async fundRewardVault(
    @Body('adminPrivateKey') adminPrivateKey: string,
    @Body('amountTokens') amountTokens: number,
  ) {
    return this.stakingService.fundRewardVault(adminPrivateKey, amountTokens);
  }
}
