import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly client: Redis;

  constructor() {}
}
