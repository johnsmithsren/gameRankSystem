import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Rank } from "../entities/rank.entity";
import { UpdateScoreDto } from "./dto/update-score.dto";
import { QueryRankDto } from "./dto/query-rank.dto";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { RANK_PROCESS_QUEUE } from "src/utils/constant";
import { InjectRedis } from "@songkeys/nestjs-redis";
import { Redis } from "ioredis";

@Injectable()
export class RankService {
  private readonly RANK_KEY = "game:rank";

  constructor(
    @InjectModel(Rank.name)
    private readonly rankModel: Model<Rank>,
    @InjectQueue(RANK_PROCESS_QUEUE)
    private readonly rankQueue: Queue,
    @InjectRedis()
    private readonly redis: Redis
  ) {}

  async updateScore(updateScoreDto: UpdateScoreDto): Promise<void> {
    // Add job to queue for database update and Redis update
    await this.rankQueue.add("updateScore", updateScoreDto, {
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }

  async getRankings(queryRankDto: QueryRankDto) {
    const { page = 1, pageSize = 20 } = queryRankDto;
    const start = (page - 1) * pageSize;
    const stop = start + pageSize - 1;

    // Get total count
    const total = await this.redis.zcard(this.RANK_KEY);

    // Get rankings with scores
    const rankings = await this.redis.zrevrange(
      this.RANK_KEY,
      start,
      stop,
      "WITHSCORES"
    );

    // Format the results
    const formattedRankings = [];
    for (let i = 0; i < rankings.length; i += 2) {
      const userId = rankings[i];
      const score = parseInt(rankings[i + 1]);
      const rank = await this.redis.zrevrank(this.RANK_KEY, userId);
      formattedRankings.push({
        userId,
        score,
        rank: rank + 1, // Redis ranks are 0-based
      });
    }

    return {
      data: formattedRankings,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPersonalRank(userId: string) {
    const score = await this.redis.zscore(this.RANK_KEY, userId);
    if (!score) {
      return null;
    }

    const rank = await this.redis.zrevrank(this.RANK_KEY, userId);
    return {
      userId,
      score: parseInt(score),
      rank: rank + 1,
    };
  }

  async getNeighborRanks(userId: string, neighborCount: number = 5) {
    const rank = await this.redis.zrevrank(this.RANK_KEY, userId);
    if (rank === null) {
      return null;
    }

    const score = await this.redis.zscore(this.RANK_KEY, userId);

    // Get previous ranks
    const start = Math.max(0, rank - neighborCount);
    const prevRanks = await this.redis.zrevrange(
      this.RANK_KEY,
      start,
      rank - 1,
      "WITHSCORES"
    );

    // Get next ranks
    const nextRanks = await this.redis.zrevrange(
      this.RANK_KEY,
      rank + 1,
      rank + neighborCount,
      "WITHSCORES"
    );

    // Format the results
    const formatRankings = (rankings: string[]) => {
      const result = [];
      for (let i = 0; i < rankings.length; i += 2) {
        result.push({
          userId: rankings[i],
          score: parseInt(rankings[i + 1]),
          rank: start + Math.floor(i / 2) + 1,
        });
      }
      return result;
    };

    return {
      prevRanks: formatRankings(prevRanks),
      currentRank: {
        userId,
        score: parseInt(score),
        rank: rank + 1,
      },
      nextRanks: formatRankings(nextRanks),
    };
  }
}
