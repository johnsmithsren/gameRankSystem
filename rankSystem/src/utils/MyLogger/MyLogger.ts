import { LoggerService } from '@nestjs/common'
import { LogMgr } from "./LogMgr"


export class MyLogger implements LoggerService {
    verbose?(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.log(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    debug?(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.debug(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    log(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.log(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    warn(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.warn(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    error(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.error(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    fatal?(message: any, ...optionalParams: any[]) {
        LogMgr.stackDepthOverride = 7
        LogMgr.fatal(message, ...optionalParams)
        LogMgr.stackDepthOverride = LogMgr._stackDepthRawDefault
    }
    // setLogLevels?(levels: LogLevel[]) {
    //     util.ThrowErrorException("Method not implemented.")
    // }
}