import { Action_Type, RANK_BROADCAST_QUEUE, RANK_PROCESS_QUEUE } from "src/utils/constant"
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

            // 检查是否首次上榜
            const isFirstRank = !(await this.redis.zscore(this.RANK_KEY, userId))
            if (isFirstRank) {
                this.logger.log(`First time ranking for user ${userId}`)
                await this.rankBroadcastQueue.add(Action_Type.firstRank, {
                    userId,
                    message: JSON.stringify({
                        score,
                        rank: await this.redis.zrevrank(this.RANK_KEY, userId)
                    })
                })
            }

            // 获取当前排名
            const currentRank = await this.redis.zrevrank(this.RANK_KEY, userId)

            // 如果不是首次上榜，检查是否超越其他玩家
            if (!isFirstRank && currentRank !== null) {
                // 获取即将超越的玩家
                const potentialOverRankedUsers = await this.redis.zrevrangebyscore(
                    this.RANK_KEY,
                    rankScore,
                    '-inf',
                    'WITHSCORES',
                    'LIMIT',
                    0,
                    1
                )

                // 如果有被超越的玩家
                if (potentialOverRankedUsers.length >= 2) {
                    const overRankedUserId = potentialOverRankedUsers[0]
                    const overRankedScore = parseInt(potentialOverRankedUsers[1])

                    if (overRankedUserId !== userId) {
                        this.logger.log(`User ${userId} surpassed user ${overRankedUserId}`)
                        await this.rankBroadcastQueue.add(Action_Type.overRank, {
                            userId: overRankedUserId,  // 被超越的玩家
                            message: JSON.stringify({
                                surpassedByUserId: userId, // 超越的玩家
                                oldScore: overRankedScore,
                                newScore: score
                            })
                        })
                    }
                }
            }

            // 更新 MongoDB
            await this.rankModel.findOneAndUpdate(
                { userId },
                { score },
                { upsert: true, new: true }
            )
            this.logger.log(`MongoDB update successful for user ${userId}`)

            // 更新 Redis
            await this.redis.zadd(this.RANK_KEY, rankScore, userId)
            this.logger.log(`Redis rank update successful for user ${userId}`)

            // 发送广播消息
            await this.rankBroadcastQueue.add(Action_Type.broadcastRank, {
                userId,
                score,
                rank: await this.redis.zrevrank(this.RANK_KEY, userId)
            })
            this.logger.log(`Broadcast message sent for user ${userId}`)
        } catch (error) {
            this.logger.error(`handleUpdateScore failed for user ${userId}: ${error.message}`, error.stack)
            throw error
        }
    }
}
