import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WebSocket, Server } from 'ws';

@WebSocketGateway({
  path: '/ws',  // WebSocket 的路径
})
export class WsChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clientIdMap: Map<WebSocket, any> = new Map();
  private logger = new Logger('WsChatGateway');

  async handleConnection(client: WebSocket, request: Request): Promise<void> {
    const params = new URLSearchParams(request.url.split('?')[1]);
    const clientInfo = {
      account: params.get('account'),
      connectionTime: new Date(),
    };
    
    this.clientIdMap.set(client, clientInfo);
    this.logger.log(`Client connected: ${clientInfo.account}`);
  }

  async handleDisconnect(client: WebSocket): Promise<void> {
    const clientInfo = this.clientIdMap.get(client);
    if (!clientInfo) return;

    this.clientIdMap.delete(client);
    this.logger.log(`Client disconnected: ${clientInfo.account}`);
  }

  // 广播消息到所有连接的客户端
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // 发送消息给特定用户
  sendToUser(client: WebSocket, message: any): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  // 发送排行榜更新
  sendRankUpdate(rankData: any): void {
    this.broadcast({
      type: 'rankUpdate',
      data: rankData
    });
  }
}
