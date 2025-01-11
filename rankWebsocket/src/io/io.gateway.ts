import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';
import { parse } from 'url';

interface RankData {
  playerId: string;
  score: number;
  rank: number;
  name: string;
  timestamp: number;
}

interface ClientInfo {
  playerId: string;
  ws: WebSocket;
}

@WebSocketGateway()
export class WsChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: WebSocket.Server;
  private logger = new Logger('RankGateway');
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private rankData: RankData[] = [];

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const { query } = parse(request.url || '', true);
    const playerId = query.playerId as string;

    if (!playerId) {
      this.logger.error('No playerId provided');
      client.close();
      return;
    }

    this.clients.set(client, { playerId, ws: client });
    this.logger.log(`Client connected: ${playerId}`);

    // Send current rank data to the newly connected client
    this.sendRankUpdate(client);

    // Handle incoming messages
    client.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        this.logger.error('Failed to parse message:', error);
      }
    });
  }

  handleDisconnect(client: WebSocket): void {
    const clientInfo = this.clients.get(client);
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${clientInfo.playerId}`);
      this.clients.delete(client);
    }
  }

  private handleMessage(client: WebSocket, message: any): void {
    const { type, data } = message;

    switch (type) {
      case 'updateScore':
        this.handleScoreUpdate(client, data);
        break;
      case 'getRankData':
        this.sendRankUpdate(client);
        break;
      default:
        this.logger.warn(`Unknown message type: ${type}`);
    }
  }

  private handleScoreUpdate(client: WebSocket, data: { score: number; name: string }): void {
    const clientInfo = this.clients.get(client);
    if (!clientInfo) return;

    const { playerId } = clientInfo;
    const { score, name } = data;

    // Update or add new rank data
    const existingIndex = this.rankData.findIndex(data => data.playerId === playerId);
    const newRankData: RankData = {
      playerId,
      score,
      name,
      rank: 0,
      timestamp: Date.now()
    };

    if (existingIndex !== -1) {
      this.rankData[existingIndex] = newRankData;
    } else {
      this.rankData.push(newRankData);
    }

    // Sort and update ranks
    this.updateRanks();

    // Broadcast updated rank data to all connected clients
    this.broadcastRankUpdate();
  }

  private updateRanks(): void {
    // Sort by score in descending order
    this.rankData.sort((a, b) => b.score - a.score);
    
    // Update rank positions
    this.rankData.forEach((data, index) => {
      data.rank = index + 1;
    });
  }

  private sendRankUpdate(client: WebSocket): void {
    const message = JSON.stringify({
      type: 'rankUpdate',
      data: this.rankData
    });
    client.send(message);
  }

  private broadcastRankUpdate(): void {
    const message = JSON.stringify({
      type: 'rankUpdate',
      data: this.rankData
    });

    this.clients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}
