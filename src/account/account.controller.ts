import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common'
import { AccountService } from './account.service'
import { InjectRedis } from "@songkeys/nestjs-redis"
import Redis from "ioredis"
import { DTOGeRank } from "./dto/create-account.dto"
@Controller({
    path: 'account',
    version: '1'
},)
export class AccountController {
    constructor(private readonly accountService: AccountService, @InjectRedis() private readonly redis: Redis) { }
    @Get(':id')
    findOne(@Headers('address') account: string) {
        return this.accountService.findAccount(account)
    }

    @Get()
    async rankInfo(@Headers('address') account: string) {
        if (await this.redis.exists(`accountRank:${account}`)) {
            return JSON.parse(await this.redis.get(`accountRank:${account}`))
        }
        await this.accountService.findAccount(account)
        let pointInfoInDB = await this.accountService.GetNewPointInfoInDB(account)
        let ret = {
            myRank: 0,
            point: 0,
        }
        if (pointInfoInDB) {
            ret.myRank = pointInfoInDB.rank ? pointInfoInDB.rank : 0
            ret.point = pointInfoInDB.point ? pointInfoInDB.point : 0
        }
        // 缓存五分钟
        await this.redis.set(`accountRank:${account}`, JSON.stringify(ret), 'EX', 60 * 5)
        return ret
    }

    @Get('/ranking')
    async getRanking(@Headers('address') account: string, @Query() queryParams: DTOGeRank) {
        let ret = await this.accountService.GetComputingPowerRanking(account, queryParams.page, queryParams.size)
        return ret
    }

}
