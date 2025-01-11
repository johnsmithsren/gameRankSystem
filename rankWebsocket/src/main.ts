import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { MyLogger } from './utils/MyLogger/MyLogger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger()
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(5500, async () => {
    Logger.log(`WebSocket服务已经启动,服务请访问:${await app.getUrl()}`);
  });
}
bootstrap();
