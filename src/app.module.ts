import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NftModule } from './nft/nft.module';
import { UserModule } from './user/user.module';
import { AchievementsModule } from './achievements/achievements.module';
import { StakingModule } from './staking/staking.module';
import { NftCollection } from './entities/nft-collection.entity';
import { NftType } from './entities/nft-type.entity';
import { UserNft } from './entities/user-nft.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { UserTask } from './entities/user-task.entity';
import { StoreConfig } from './entities/store-config.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgresql://postgres:ZinjEqdWdceEXeFYFsFUeMgtSfyrSKZA@hopper.proxy.rlwy.net:31815/railway',
      autoLoadEntities: true,
      synchronize: true,
      entities: [
        NftCollection,
        NftType,
        UserNft,
        User,
        Task,
        UserTask,
        StoreConfig,
      ],
    }),
    AuthModule,
    NftModule,
    UserModule,
    AchievementsModule,
    StakingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
