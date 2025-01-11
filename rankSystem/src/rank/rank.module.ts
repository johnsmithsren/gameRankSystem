import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RankController } from "./rank.controller";
import { RankService } from "./rank.service";
import { Rank, RankSchema } from "../entities/rank.entity";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { RANK_PROCESS_QUEUE } from "src/utils/constant";
import { RankProcessor } from "./rank.processor";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rank.name, schema: RankSchema }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
          password: configService.get<string>("REDIS_PASSWORD"),
          db: configService.get<number>("REDIS_DB"),
        },
      }),
    }),
    BullModule.registerQueue({
      name: RANK_PROCESS_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [RankController],
  providers: [RankService, RankProcessor],
  exports: [RankService],
})
export class RankModule {}
