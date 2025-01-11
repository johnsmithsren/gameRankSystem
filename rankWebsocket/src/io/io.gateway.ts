import { Logger } from "@nestjs/common"
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from "@nestjs/websockets"
import { IncomingMessage } from "http"
import * as WebSocket from "ws"
import { parse } from "url"
import { InjectRedis } from "@songkeys/nestjs-redis"
import Redis from "ioredis"

interface ClientInfo {
    ws: WebSocket
    lastPing?: number
}

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: WebSocket.Server

    private WebSocketClientsMap: Map<string, ClientInfo[]> = new Map();
    private readonly PING_INTERVAL = 30000; // 30秒发送一次心跳
    private readonly PING_TIMEOUT = 5000; // 5秒内没有回应则认为断线
    private readonly logger = new Logger(WsGateway.name);
    constructor(@InjectRedis() private readonly redis: Redis) {
        // 启动心跳检测
        setInterval(() => this.heartbeat(), this.PING_INTERVAL)
    }

    handleConnection(client: WebSocket, request: IncomingMessage): void {
        const { query } = parse(request.url || '', true)
        const userId = query.userId as string
        if (!userId) {
            this.logger.error("No userId provided")
            client.close()
            return
        }

        // 设置 pong 监听器
        client.on('pong', () => {
            const clients = this.WebSocketClientsMap.get(userId)
            const clientInfo = clients?.find(c => c.ws === client)
            if (clientInfo) {
                clientInfo.lastPing = Date.now()
            }
        })

        // 处理重连
        client.on("error", (error) => {
            this.logger.error(`WebSocket error: ${error.message}`)
        })

        const clientInfo: ClientInfo = {
            ws: client,
            lastPing: Date.now(),
        }

        if (!this.WebSocketClientsMap.has(userId)) {
            this.WebSocketClientsMap.set(userId, [])
        }

        // 清理同一个客户端的旧连接
        const clients = this.WebSocketClientsMap.get(userId)
        const existingClientIndex = clients?.findIndex(c =>
            c.ws.readyState !== WebSocket.CLOSED &&
            (request as any)._socket === (c.ws as any)._socket
        )

        if (existingClientIndex !== undefined && existingClientIndex !== -1) {
            // 关闭旧连接
            const oldClient = clients[existingClientIndex]
            oldClient.ws.close()
            clients.splice(existingClientIndex, 1)
        }

        // 清理已断开的连接
        if (clients) {
            const activeClients = clients.filter(c => c.ws.readyState !== WebSocket.CLOSED)
            this.WebSocketClientsMap.set(userId, activeClients)
        }

        this.WebSocketClientsMap.get(userId)?.push(clientInfo)

        this.logger.log(`Client connected: ${userId}`)
    }

    handleDisconnect(client: WebSocket): void {
        for (const [userId, clients] of this.WebSocketClientsMap.entries()) {
            const index = clients.findIndex(c => c.ws === client)
            if (index !== -1) {
                this.logger.log(`Client disconnected: ${userId}`)
                clients.splice(index, 1)
                if (clients.length === 0) {
                    this.WebSocketClientsMap.delete(userId)
                }
                break
            }
        }
    }

    private heartbeat(): void {
        const now = Date.now()
        for (const [userId, clients] of this.WebSocketClientsMap.entries()) {
            const activeClients = clients.filter(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    // 如果超过 PING_TIMEOUT 时间没有收到 pong，则关闭连接
                    if (client.lastPing && now - client.lastPing > this.PING_TIMEOUT) {
                        this.logger.debug(`Client ${userId} timed out, terminating connection`)
                        client.ws.terminate()
                        return false
                    }
                    // 发送 ping
                    try {
                        client.ws.ping()
                    } catch (e) {
                        this.logger.error(`Failed to send ping to client ${userId}: ${e.message}`)
                        return false
                    }
                    return true
                }
                return false
            })

            if (activeClients.length === 0) {
                this.WebSocketClientsMap.delete(userId)
                this.logger.debug(`Removed all connections for user ${userId}`)
            } else {
                this.WebSocketClientsMap.set(userId, activeClients)
            }
        }
    }

    public sendMessageToUser(userId: string, message: string): void {
        const userClients = this.WebSocketClientsMap.get(userId)
        if (userClients) {
            userClients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(message)
                }
            })
        }
    }

    public broadcastRankUpdate(message: string): void {
        for (const clients of this.WebSocketClientsMap.values()) {
            clients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(message)
                }
            })
        }
    }
}
