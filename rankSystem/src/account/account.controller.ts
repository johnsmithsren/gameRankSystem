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
   

}
