import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rank } from '../entities/rank.entity';
import { UpdateScoreDto } from './dto/update-score.dto';
import { QueryRankDto } from './dto/query-rank.dto';

@Injectable()
export class RankService {
  constructor(
    @InjectModel(Rank.name)
    private readonly rankModel: Model<Rank>,
  ) {}

  async updateScore(updateScoreDto: UpdateScoreDto): Promise<Rank> {
    const { userId, score } = updateScoreDto;
    const rankRecord = await this.rankModel.findOneAndUpdate(
      { userId },
      { score },
      { upsert: true, new: true }
    );

    await this.updateRankings();
    return rankRecord;
  }

  private async updateRankings(): Promise<void> {
    // 获取所有玩家并按分数降序排序
    const players = await this.rankModel.find().sort({ score: -1 });

    // 批量更新排名
    const bulkOps = players.map((player, index) => ({
      updateOne: {
        filter: { _id: player._id },
        update: { $set: { rank: index + 1 } }
      }
    }));

    await this.rankModel.bulkWrite(bulkOps);
  }

  async getRankings(queryRankDto: QueryRankDto) {
    const { page = 1, pageSize = 20 } = queryRankDto;
    const skip = (page - 1) * pageSize;

    const [rankings, total] = await Promise.all([
      this.rankModel.find()
        .sort({ rank: 1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.rankModel.countDocuments()
    ]);

    return {
      data: rankings,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPersonalRank(userId: string) {
    return await this.rankModel.findOne({ userId }).exec();
  }

  async getNeighborRanks(userId: string, neighborCount: number = 5) {
    const userRank = await this.getPersonalRank(userId);
    if (!userRank) {
      return null;
    }

    const [prevRanks, nextRanks] = await Promise.all([
      // 获取前面的排名
      this.rankModel.find({ rank: { $lt: userRank.rank } })
        .sort({ rank: -1 })
        .limit(neighborCount)
        .exec(),
      // 获取后面的排名
      this.rankModel.find({ rank: { $gt: userRank.rank } })
        .sort({ rank: 1 })
        .limit(neighborCount)
        .exec(),
    ]);

    return {
      prevRanks: prevRanks.reverse(),
      currentRank: userRank,
      nextRanks,
    };
  }
}
