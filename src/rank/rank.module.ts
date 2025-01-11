import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RankController } from './rank.controller';
import { RankService } from './rank.service';
import { Rank, RankSchema } from '../entities/rank.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Rank.name, schema: RankSchema }])],
  controllers: [RankController],
  providers: [RankService],
  exports: [RankService],
})
export class RankModule {}
