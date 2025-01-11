import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { IncomingMessage } from "http";
import * as WebSocket from "ws";
import { parse } from "url";
import { InjectRedis } from "@songkeys/nestjs-redis";
import Redis from "ioredis";

interface ClientInfo {
  userId: string;
  ws: WebSocket;
  lastPing?: number;
}

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private logger = new Logger(WsGateway.name);
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private readonly PING_INTERVAL = 30000; // 30秒发送一次心跳
  private readonly PING_TIMEOUT = 5000;   // 5秒内没有回应则认为断线

  constructor(@InjectRedis() private readonly redis: Redis) {
    // 启动心跳检测
    setInterval(() => this.heartbeat(), this.PING_INTERVAL);
  }

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const { query } = parse(request.url || "", true);
    const userId = query.userId as string;
    if (!userId) {
      this.logger.error("No userId provided");
      client.close();
      return;
    }

    // 清理同一用户的旧连接
    this.cleanupOldConnections(userId);

    // 设置心跳检测
    client.on('pong', () => {
      const clientInfo = this.clients.get(client);
      if (clientInfo) {
        clientInfo.lastPing = Date.now();
      }
    });

    // 处理重连
    client.on('error', (error) => {
      this.logger.error(`WebSocket error: ${error.message}`);
    });

    this.clients.set(client, { 
      userId, 
      ws: client,
      lastPing: Date.now()
    });
    
    // 存储用户最后在线时间
    this.redis.hset('user:last_online', userId, Date.now().toString());
    
    this.logger.log(`Client connected: ${userId}`);
  }

  handleDisconnect(client: WebSocket): void {
    const clientInfo = this.clients.get(client);
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${clientInfo.userId}`);
      // 更新用户最后在线时间
      this.redis.hset('user:last_online', clientInfo.userId, Date.now().toString());
      this.clients.delete(client);
    }
  }

  private cleanupOldConnections(userId: string): void {
    for (const [ws, info] of this.clients.entries()) {
      if (info.userId === userId) {
        this.logger.log(`Cleaning up old connection for user: ${userId}`);
        ws.close();
        this.clients.delete(ws);
      }
    }
  }

  private heartbeat(): void {
    const now = Date.now();
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!clientInfo.lastPing || now - clientInfo.lastPing > this.PING_TIMEOUT) {
          this.logger.warn(`Client ${clientInfo.userId} timed out`);
          ws.terminate();
          this.clients.delete(ws);
        } else {
          ws.ping();
        }
      }
    });
  }

  public sendMessageToUser(userId: string, message: string): void {
    for (let client of this.clients.values()) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  public broadcastRankUpdate(message: string): void {
    this.clients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}
