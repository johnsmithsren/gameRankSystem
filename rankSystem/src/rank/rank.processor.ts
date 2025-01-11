import { RANK_PROCESS_QUEUE } from "src/utils/constant";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectRedis } from "@songkeys/nestjs-redis";
import { Redis } from "ioredis";
import { Model } from "mongoose";
import { Rank } from "../entities/rank.entity";

@Processor(RANK_PROCESS_QUEUE)
export class RankProcessor extends WorkerHost {
  private readonly logger = new Logger(RankProcessor.name);
  private readonly RANK_KEY = "game:rank";

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectModel(Rank.name) private readonly rankModel: Model<Rank>
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      this.logger.log(`Processing job ${job.name}`);

      switch (job.name) {
        case "updateScore":
          await this.handleUpdateScore(job.data);
          break;
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }

      return {};
    } catch (error) {
      this.logger.error(`Job processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleUpdateScore(data: { userId: string; score: number }) {
    const { userId, score } = data;

    // Update MongoDB
    await this.rankModel.findOneAndUpdate(
      { userId },
      { score },
      { upsert: true, new: true }
    );

    // Update Redis sorted set
    await this.redis.zadd(this.RANK_KEY, score, userId);

    this.logger.log(`Updated score for user ${userId}: ${score}`);
  }
}
