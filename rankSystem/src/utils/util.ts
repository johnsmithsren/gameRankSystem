
import { Logger } from '@nestjs/common'
import { TimeUtil } from "./TimeUtil"
import { ConfigService } from "@nestjs/config"
export class util {
    private static readonly logger = new Logger(util.name);
    static isSameDayForUTC0(time1MilliSecond: number, time2MilliSecond: number): boolean {
        let ret = TimeUtil.IsSameDayInServerTime(time1MilliSecond, time2MilliSecond)
        return ret
    }

    static IsDev(configService: ConfigService): boolean {
        return configService.get("IsDev") == "true"
    }


    static ParseStr(source: string, ...argv: any[]): string {
        let result = source
        for (let i = 0; i < argv.length; i++) {
            let str = `##${i}##`
            result = result.replaceAll(str, String(argv[i]))
        }
        return result
    }


    public static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        })
    }

   
}