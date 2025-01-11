import { Injectable, Logger } from '@nestjs/common'
import { InjectRedis } from '@songkeys/nestjs-redis'
import Redis from 'ioredis'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {  RANK_PROCESS_QUEUE, } from '../utils/constant'
import { AccountDocument } from 'src/entities/account.entity'
import { ConfigService } from '@nestjs/config'
import { WsChatGateway } from 'src/io/io.gateway'
import * as WebSocket from 'ws';
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly client: Redis
  pushMessageDragonComposeProcessing: boolean = false
  restartListenerProcessing: boolean = false
  constructor(
    @InjectQueue(RANK_PROCESS_QUEUE) private listenBullQueue: Queue,
    @InjectModel('Account') private accountModel: Model<AccountDocument>,
    private configService: ConfigService,
    private wsChatGateway: WsChatGateway,
    @InjectRedis() private readonly redis: Redis,

  ) {
   
  }

 
}
