import { RANK_BROADCAST_QUEUE, RANK_PROCESS_QUEUE } from "src/utils/constant"
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq"
import { Job, Queue } from "bullmq"
import { Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { InjectRedis } from "@songkeys/nestjs-redis"
import { Redis } from "ioredis"
import { Model } from "mongoose"
import { Rank } from "../entities/rank.entity"

@Processor(RANK_PROCESS_QUEUE)
export class RankProcessor extends WorkerHost {
    private readonly logger = new Logger(RankProcessor.name);
    private readonly RANK_KEY = "game:rank";

    constructor(
        @InjectRedis() private readonly redis: Redis,
        @InjectModel(Rank.name) private readonly rankModel: Model<Rank>,
        @InjectQueue(RANK_BROADCAST_QUEUE)
        private readonly rankBroadcastQueue: Queue
    ) {
        super()
    }

    async process(job: Job<any, any, string>): Promise<any> {
        try {
            this.logger.log(`Starting to process job ${job.name} with data:`, job.data)

            switch (job.name) {
                case "updateScore":
                    this.logger.log(`Processing updateScore job for user ${job.data.userId}`)
                    await this.handleUpdateScore(job.data)
                    this.logger.log(`Successfully processed updateScore job for user ${job.data.userId}`)
                    break
                default:
                    this.logger.warn(`Unknown job type: ${job.name}`)
            }

            return {}
        } catch (error) {
            this.logger.error(`Job processing failed: ${error.message}`, error.stack)
            throw error
        }
    }

    private async handleUpdateScore(data: {
        userId: string
        score: number
        rankScore: number
        updateTime: number
    }) {
        const { userId, score, rankScore } = data
        try {
            this.logger.log(`Starting handleUpdateScore for user ${userId}`)
            
            // 更新 MongoDB
            const updatedRank = await this.rankModel.findOneAndUpdate(
                { userId },
                { score },
                { upsert: true, new: true }
            )
            this.logger.log(`MongoDB update successful for user ${userId}`)

            // 更新 Redis
            await this.redis.zadd(this.RANK_KEY, rankScore, userId)
            this.logger.log(`Redis rank update successful for user ${userId}`)

            // 发送广播消息
            await this.rankBroadcastQueue.add("broadcast-game-rank", {
                userId,
            })
            this.logger.log(`Broadcast message sent for user ${userId}`)
        } catch (error) {
            this.logger.error(`handleUpdateScore failed for user ${userId}: ${error.message}`, error.stack)
            throw error
        }
    }
}
