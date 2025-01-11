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

interface ClientInfo {
  userId: string;
  ws: WebSocket;
}

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private logger = new Logger(WsGateway.name);
  private clients: Map<WebSocket, ClientInfo> = new Map();

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const { query } = parse(request.url || "", true);
    const userId = query.userId as string;
    if (!userId) {
      this.logger.error("No userId provided");
      client.close();
      return;
    }

    this.clients.set(client, { userId, ws: client });
    this.logger.log(`Client connected: ${userId}`);
  }

  handleDisconnect(client: WebSocket): void {
    const clientInfo = this.clients.get(client);
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${clientInfo.userId}`);
      this.clients.delete(client);
    }
  }

  public sendMessageToUser(userId: string, message: string): void {
    for (let client of this.clients.values()) {
      if (client.userId === userId) {
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
