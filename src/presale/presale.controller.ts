import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { PresaleService } from './presale.service';

@ApiTags('Presale')
@Controller('presale')
export class PresaleController {
  constructor(private readonly presaleService: PresaleService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get presale information' })
  async getPresaleInfo() {
    return this.presaleService.getPresaleInfo();
  }

  @Post('prepare-initialize')
  @ApiOperation({
    summary: 'Prepare initialize presale transaction',
    description:
      'Returns a serialized transaction for admin to sign with their wallet. Creates the presale PDA with 1-day timer and 845 SOL target.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminWallet: {
          type: 'string',
          description: 'Admin wallet public key',
        },
      },
      required: ['adminWallet'],
    },
  })
  async prepareInitializePresale(@Body('adminWallet') adminWallet: string) {
    return this.presaleService.prepareInitializePresale(adminWallet);
  }

  @Post('prepare-contribute')
  @ApiOperation({
    summary: 'Prepare contribute to presale transaction',
    description:
      'Returns a serialized transaction for user to sign with their wallet. Contributes SOL to the presale.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contributorWallet: {
          type: 'string',
          description: 'Contributor wallet public key',
        },
        amountSol: {
          type: 'number',
          description: 'Amount of SOL to contribute',
        },
      },
      required: ['contributorWallet', 'amountSol'],
    },
  })
  async prepareContributePresale(
    @Body('contributorWallet') contributorWallet: string,
    @Body('amountSol') amountSol: number,
  ) {
    return this.presaleService.prepareContributePresale(
      contributorWallet,
      amountSol,
    );
  }

  @Post('prepare-end')
  @ApiOperation({
    summary: 'Prepare end presale transaction',
    description:
      'Returns a serialized transaction for admin to sign. Ends the presale and withdraws funds to admin.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminWallet: {
          type: 'string',
          description: 'Admin wallet public key',
        },
      },
      required: ['adminWallet'],
    },
  })
  async prepareEndPresale(@Body('adminWallet') adminWallet: string) {
    return this.presaleService.prepareEndPresale(adminWallet);
  }

  @Post('prepare-restart')
  @ApiOperation({
    summary: 'Prepare restart presale transaction',
    description:
      'Returns a serialized transaction for admin to sign. Restarts the presale with a new 1-day timer.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminWallet: {
          type: 'string',
          description: 'Admin wallet public key',
        },
      },
      required: ['adminWallet'],
    },
  })
  async prepareRestartPresale(@Body('adminWallet') adminWallet: string) {
    return this.presaleService.prepareRestartPresale(adminWallet);
  }

  @Get('contribution')
  @ApiOperation({ summary: 'Get contribution info for a wallet' })
  async getContribution(@Body('wallet') wallet: string) {
    return this.presaleService.getContribution(wallet);
  }
}

