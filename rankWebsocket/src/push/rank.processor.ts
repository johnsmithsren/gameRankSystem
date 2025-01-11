import { Action_Type, RANK_BROADCAST_QUEUE } from "src/utils/constant"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { Logger } from "@nestjs/common"
import { InjectRedis } from "@songkeys/nestjs-redis"
import Redis from "ioredis"
import { WsGateway } from "src/io/io.gateway"

@Processor(RANK_BROADCAST_QUEUE)
export class RankProcessor extends WorkerHost {
    private readonly logger = new Logger(RankProcessor.name);
    private readonly RANK_KEY = "game:rank";
    private readonly SCORE_BITS = 32n;
    constructor(
        private readonly wsGateway: WsGateway,
        @InjectRedis() private readonly redis: Redis
    ) {
        super()
    }
    async process(job: Job<any, any, string>): Promise<any> {
        try {
            let { userId } = job.data
            switch (job.name) {
                case Action_Type.broadcastRank:
                    this.logger.log(`start process ${job.name} ${userId} job`)
                    await this.broadcastRank(job.data)
                    this.logger.log(`end process ${job.name} ${userId} job`)
                    break
                case Action_Type.firstRank:
                    this.logger.log(`start process ${job.name} ${userId} job`)
                    await this.firstRank(job.data)
                    this.logger.log(`end process ${job.name} ${userId} job`)
                    break
                case Action_Type.overRank:
                    this.logger.log(`start process ${job.name} ${userId} job`)
                    await this.overRank(job.data)
                    this.logger.log(`end process ${job.name} ${userId} job`)
                    break
            }
            return {}
        } catch (error) {
            this.logger.error("[job]任务处理失败", error)
            throw error
        }
    }

    async broadcastRank(data: { userId: string; message: string }) {
        const { message } = data
        this.wsGateway.broadcastRankUpdate(message)
    }

    async firstRank(data: { userId: string; message: string }) {
        const { userId, message } = data
        this.wsGateway.sendMessageToUser(userId, message)
    }
    async overRank(data: { userId: string; message: string }) {
        const { userId, message } = data
        this.wsGateway.sendMessageToUser(userId, message)
    }

    private getOriginalScore(rankScore: number): number {
        return Number(BigInt(rankScore) >> this.SCORE_BITS)
    }

    async getPersonalRank(userId: string) {
        const score = await this.redis.zscore(this.RANK_KEY, userId)
        if (!score) {
            return null
        }

        const rank = await this.redis.zrevrank(this.RANK_KEY, userId)
        return {
            userId,
            score: this.getOriginalScore(parseInt(score)),
            rank: rank + 1,
        }
    }
}
