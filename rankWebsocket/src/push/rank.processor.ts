
import { Action_Type, RANK_PROCESS_QUEUE } from "src/utils/constant"
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job, Queue } from 'bullmq'
import { Logger } from '@nestjs/common'
import { ConfigService } from "@nestjs/config"
import { InjectModel } from "@nestjs/mongoose"
import { InjectRedis } from "@songkeys/nestjs-redis"
import Redis from "ioredis"
import { Model } from "mongoose"
import { AccountDocument } from "src/entities/account.entity"

@Processor(RANK_PROCESS_QUEUE)
export class RankProcessor extends WorkerHost {
    private readonly logger = new Logger(RankProcessor.name);
    usdtTransferProcessing: boolean = false
    constructor(
        @InjectQueue(RANK_PROCESS_QUEUE) private BullQueue: Queue,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
        private configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {
        super()
    }
    async process(job: Job<any, any, string>): Promise<any> {
        try {
            let { account, score } = job.data
            switch (job.name) {
                case Action_Type.updateRankByScore:
                    this.logger.log(`start process ${job.name} ${account} job`)
                    
                    this.logger.log(`end process ${job.name} ${account} job`)
                    break
               
            }
            return {}
        } catch (error) {
            this.logger.error('[job]任务处理失败', error)
            throw error
        }
    }

}