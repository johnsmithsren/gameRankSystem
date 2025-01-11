import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common"


import { ConfigService } from "@nestjs/config"

import { MyLogger } from "./utils/MyLogger/MyLogger"
import { GlobalExceptionFilter } from "./exception/global.exception"
import { TimeoutInterceptor } from "./interceptors/timeout.interceptor"
import { util } from "./utils/util"

async function bootstrap() {
    let logger = new Logger("bootstrap")

    const app = await NestFactory.create(
        AppModule,
        {
          
            logger: new MyLogger()
        },
    )
    app.enableCors({})
    app.useGlobalPipes(
        new ValidationPipe({
            forbidUnknownValues: false,
            transformOptions: {
                enableImplicitConversion: true,
            },
            transform: true
        }),
    )
    app.useGlobalFilters(new GlobalExceptionFilter())
    app.useGlobalInterceptors(
        new TimeoutInterceptor(),
    )
    app.enableVersioning({
        type: VersioningType.URI,
    })
    // _port
    let port = app.get(ConfigService).get('PORT')
    if (util.IsDev(app.get(ConfigService))) {
        logger.warn(`IsDev: true ===>  Application is running, Port:`, port)
    } else {
        logger.warn(`IsDev: False ===>  Application is running, Port:`, port)
    }
    // await app.startAllMicroservices()
    await app.listen(port)
}
bootstrap()
