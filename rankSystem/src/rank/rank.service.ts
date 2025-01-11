import { Injectable, Logger } from "@nestjs/common"
import { UpdateScoreDto } from "./dto/update-score.dto"
import { QueryRankDto } from "./dto/query-rank.dto"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"
import { RANK_PROCESS_QUEUE } from "src/utils/constant"
import { InjectRedis } from "@songkeys/nestjs-redis"
import { Redis } from "ioredis"

@Injectable()
export class RankService {
    private readonly logger = new Logger(RankService.name)
    private readonly RANK_KEY = "game:rank";
    private readonly SCORE_BITS = 32n; // 用于位运算的常量
    constructor(
        @InjectQueue(RANK_PROCESS_QUEUE)
        private readonly rankQueue: Queue,
        @InjectRedis()
        private readonly redis: Redis
    ) { }

    // 增加时间戳，来确保分数的唯一性
    async updateScore(updateScoreDto: UpdateScoreDto): Promise<void> {
        const timestamp = BigInt(Date.now())
        const score = BigInt(updateScoreDto.score)
        const rankScore = Number(
            (score << this.SCORE_BITS) | (timestamp & ((1n << this.SCORE_BITS) - 1n))
        )
        try {
            this.logger.log(`Attempting to add job to queue for user ${updateScoreDto.userId}`)
            await this.rankQueue.add(
                "updateScore",
                { ...updateScoreDto, rankScore, updateTime: Date.now() }
            )
            this.logger.log(`Successfully added job to queue for user ${updateScoreDto.userId}`)
        } catch (error) {
            this.logger.error(`Failed to add job to queue: ${error.message}`, error.stack)
            throw error
        }
    }

    private getOriginalScore(rankScore: number): number {
        return Number(BigInt(rankScore) >> this.SCORE_BITS)
    }

    private getTimestamp(rankScore: number): number {
        return Number(BigInt(rankScore) & ((1n << this.SCORE_BITS) - 1n))
    }

    async getRankings(queryRankDto: QueryRankDto) {
        const { page = 1, pageSize = 20 } = queryRankDto
        const start = (page - 1) * pageSize
        const stop = start + pageSize - 1

        // Get total count
        const total = await this.redis.zcard(this.RANK_KEY)

        // Get rankings with scores
        const rankings = await this.redis.zrevrange(
            this.RANK_KEY,
            start,
            stop,
            "WITHSCORES"
        )

        // Format the results
        const formattedRankings = []
        for (let i = 0; i < rankings.length; i += 2) {
            const userId = rankings[i]
            const score = parseInt(rankings[i + 1])
            const rank = await this.redis.zrevrank(this.RANK_KEY, userId)
            formattedRankings.push({
                userId,
                score: this.getOriginalScore(score),
                rank: rank + 1, // Redis ranks are 0-based
            })
        }

        return {
            data: formattedRankings,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        }
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

    async getNeighborRanks(userId: string, neighborCount: number = 5) {
        const rank = await this.redis.zrevrank(this.RANK_KEY, userId)
        if (rank === null) {
            return null
        }

        const score = await this.redis.zscore(this.RANK_KEY, userId)

        // Get previous ranks
        const start = Math.max(0, rank - neighborCount)
        const prevRanks = await this.redis.zrevrange(
            this.RANK_KEY,
            start,
            rank - 1,
            "WITHSCORES"
        )

        // Get next ranks
        const nextRanks = await this.redis.zrevrange(
            this.RANK_KEY,
            rank + 1,
            rank + neighborCount,
            "WITHSCORES"
        )

        const formatRankings = (rankings: string[], startRank: number) => {
            const result = []
            for (let i = 0; i < rankings.length; i += 2) {
                result.push({
                    userId: rankings[i],
                    score: this.getOriginalScore(parseInt(rankings[i + 1])),
                    rank: startRank + Math.floor(i / 2),
                })
            }
            return result
        }

        return {
            prevRanks: formatRankings(prevRanks, start + 1),
            currentRank: {
                userId,
                score: this.getOriginalScore(parseInt(score)),
                rank: rank + 1,
            },
            nextRanks: formatRankings(nextRanks, rank + 2),
        }
    }
}
