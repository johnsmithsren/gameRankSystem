import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectRedis } from '@songkeys/nestjs-redis'
import { AccountDocument } from '../entities/account.entity'
import Redis from 'ioredis'
import { Model } from 'mongoose'
@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name);
    constructor(
        @InjectRedis() private readonly redis: Redis,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
    ) {
    }
   


}
