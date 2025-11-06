import { Module } from '@nestjs/common';
import { StakingService } from './staking.service';
import { StakingController } from './staking.controller';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [NftModule],
  controllers: [StakingController],
  providers: [StakingService],
  exports: [StakingService],
})
export class StakingModule {}
