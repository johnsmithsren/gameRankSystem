import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from 'src/entities/account.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsChatGateway } from 'src/io/io.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { RANK_PROCESS_QUEUE } from 'src/utils/constant';
import { RankProcessor } from './rank.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB'),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: RANK_PROCESS_QUEUE,
        defaultJobOptions: {
          removeOnComplete: true,
        },
      },),
    ScheduleModule.forRoot()
  ],
  providers: [PushService, ConfigService, WsChatGateway,RankProcessor],
})
export class PushModule { }
