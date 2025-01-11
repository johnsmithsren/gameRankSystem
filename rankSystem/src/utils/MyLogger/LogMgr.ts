import * as winston from "winston"
import { FileUtil } from "../FileUtil/FileUtil"
import { TimeUtil } from "../TimeUtil"

let logger: winston.Logger

let tempCallerStr = ""

export class LogMgr {
    public static getCallerInfo(stackDepth: number, dirKeepCount: number): string {
        let err = new Error()
        let caller_line = err.stack?.split("\n")[stackDepth]
        if (caller_line === undefined) {
            return "undefined!"
        }
        caller_line = caller_line.replace(/\\/g, "/")
        // console.log(caller_line)
        caller_line = caller_line.replace(FileUtil.WorkDir, "")
        let startIdx = -1
        let tempIdx = caller_line.length
        for (let i = 0; i < dirKeepCount; i++) {
            let index = caller_line.lastIndexOf("/", tempIdx)
            if (index != -1) {
                startIdx = index
                tempIdx = index - 1
                if (index - 1 < 0) {
                    break
                }
            }
        }

        let lastIdx = caller_line.lastIndexOf(":")
        let clean = caller_line.slice(startIdx + 1, lastIdx)
        if (clean.startsWith("/")) {
            clean = clean.slice(1)
        }
        return clean
    }
    public static configure(opt: any) {
        logger = winston.createLogger(LogMgr._getDefaultConfig())
    }


    public static _stackDepthRawDefault = 4; // 直接调用 LogMgr 输出的 log
    public static stackDepthOverride = LogMgr._stackDepthRawDefault;
    public static dirKeepCount = 2;
    public static _recordCaller() {
        tempCallerStr = LogMgr.getCallerInfo(LogMgr.stackDepthOverride, LogMgr.dirKeepCount)
    }
    public static _getRecordCaller() {
        return tempCallerStr
    }

    /**
     * 
     * @param level trace info warn error ...
     */
    public static setLogLevel(level: string) {
        logger.level = level
    }

    private static _combineLog(...args: any[]) {
        if (args.length == 1) {
            return args[0]
        }
        let msg = ''
        for (let i = 0; i < args.length; i++) {
            if (i != 0) {
                msg += " "
            }
            msg += args[i]
        }
        return msg
    }
    public static trace(...p: any[]) {
        LogMgr._recordCaller()
        logger.silly(LogMgr._combineLog(...p))
    }

    public static log(...p: any[]) {
        LogMgr._recordCaller()
        logger.debug(LogMgr._combineLog(...p))
    }

    public static debug(...p: any[]) {
        LogMgr._recordCaller()
        logger.debug(LogMgr._combineLog(...p))
    }

    public static info(...p: any) {
        LogMgr._recordCaller()
        logger.info(LogMgr._combineLog(...p))
    }

    static warn(...p: any) {
        LogMgr._recordCaller()
        logger.warn(LogMgr._combineLog(...p))
    }


    public static error(...p: any) {
        LogMgr._recordCaller()
        logger.error(p)
        // logger.error(LogMgr._combineLog(...p))
    }

    public static fatal(...p: any) {
        LogMgr._recordCaller()
        logger.error(p)
        // logger.error(LogMgr._combineLog(...p))
        // process.exit(1)
    }

    public static _getDefaultConfig(): winston.LoggerOptions {
        const { combine, timestamp, label, printf } = winston.format

        let caller = () => {
            return LogMgr._getRecordCaller()
        }
        const myFormat = printf(({ level, message, stack }) => {
            if (stack) {
                return `${TimeUtil.format(Date.now(), "yyyy-MM-dd hh:mm:ss.S")} [${level}]  ${caller()} ${message} ${stack}`
            }
            return `${TimeUtil.format(Date.now(), "yyyy-MM-dd hh:mm:ss.S")} [${level}]  ${caller()} ${message}`
        })

        return {
            level: 'silly',
            transports: [
                new winston.transports.Console(),
            ],
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.colorize({ all: true }),
                winston.format.align(),
                // timestamp({
                //     format: 'YYYY-MM-DD hh:mm:ss.SSSZ'
                // }),
                myFormat
            )
        }
    }
}


LogMgr.configure(LogMgr._getDefaultConfig())