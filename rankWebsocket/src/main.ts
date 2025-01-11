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
  let port = app.get(ConfigService).get("PORT");
  await app.listen(port, async () => {
    Logger.log(`WebSocket服务已经启动`);
  });
}
bootstrap();
