import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NftModule } from './nft/nft.module';
import { UserModule } from './user/user.module';
import { NftCollection } from './entities/nft-collection.entity';
import { NftType } from './entities/nft-type.entity';
import { UserNft } from './entities/user-nft.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:ZinjEqdWdceEXeFYFsFUeMgtSfyrSKZA@hopper.proxy.rlwy.net:31815/railway',
      autoLoadEntities: true,
      synchronize: true,
      entities: [NftCollection, NftType, UserNft, User],
    }),
    NftModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
