import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { MyLogger } from './utils/MyLogger/MyLogger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger()
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors();
  await app.listen(5500, async () => {
    Logger.log(`WebSocket服务已经启动,服务请访问:${await app.getUrl()}`);
  });
}
bootstrap();
