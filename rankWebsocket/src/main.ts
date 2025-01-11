import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { MyLogger } from "./utils/MyLogger/MyLogger";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT");

  await app.listen(port, async () => {
    const serverUrl = await app.getUrl();
    Logger.log(`WebSocket服务已经启动`);
    Logger.log(`WebSocket监听端口: ${port}`);
    Logger.log(`WebSocket连接地址: ws://localhost:${port}`);
  });
}
bootstrap();
