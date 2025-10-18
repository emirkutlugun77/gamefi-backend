import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { NftAdminController } from './nft-admin.controller';
import { NftAdminService } from './nft-admin.service';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { StoreConfig } from '../entities/store-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NftCollection, NftType, StoreConfig])],
  controllers: [NftController, NftAdminController],
  providers: [NftService, NftAdminService],
  exports: [NftService, NftAdminService],
})
export class NftModule {}
