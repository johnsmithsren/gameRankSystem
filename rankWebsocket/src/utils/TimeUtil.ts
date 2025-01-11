/*
获取的时间，有两种类型：
GetLocalMilliSecond
GetServerMilliSecond

local 是客户端本地的时间
server 是服务端的时间（底层已经完成对服务端时间的同步）

如果客户端本地 手动改了系统时间，那么 local 和 server 的值就会相差很大。 
（处于不同的时区，没有这个问题，两个值是一样的，但是返回 年月日-小时 这种字符串，是不一样的）

我们游戏里面，基本上都应该用 server 这个时间去判断各种逻辑。
 */

export class TimeUtil {
    public static currentFrameIdx = 0; // 如果需要准确的值，就用 CS.UnityEngine.Time.frameCount

    static Update() {
        TimeUtil.currentFrameIdx++
    }

    //时区偏差
    // static TimeZoneOffsetSecondInServer = 28800 // 东八区
    static TimeZoneOffsetSecondInServer = 0 // 设置服务区时区为 utc-0

    static __GetLocalMilliSecond(): number {
        return TimeUtil.__GetRealNowMilliSecond()
    }


    static __GetLocalNowSecond(): number {
        return TimeUtil.__GetLocalMilliSecond() / 1000
    }

    /*
    获取实时时间(毫秒)
     */
    static __GetRealNowMilliSecond(): number {
        // return CS.KitCore.Frame.TimeUtil.JsNowMilliSecond
        return Date.now()
    }

    /**
     * 返回的时间：比服务端时间慢（不断逼近服务端时间，但是始终是比服务端时间慢的）
     */
    static GetServerMilliSecond(): number {
        return TimeUtil.__GetLocalMilliSecond()
    }

    /**
     * 本地毫秒时间
     */
    static GetLocalMilliSecond(): number {
        return TimeUtil.__GetLocalMilliSecond()
    }

    /**
     * 传入一个时间戳，返回一个新的时间戳（新的时间戳可以用来获得服务端的当前时区时间）
     * @param millisecond
     */
    static _CovertToServerTimezone(millisecond: number): number {
        let date = new Date()
        let isdst = TimeUtil.IsDst()
        let localTimeZoneOffsetSecond = date.getTimezoneOffset() * 60 // -28800 东八区
        millisecond = millisecond + localTimeZoneOffsetSecond * 1000
        millisecond = millisecond + TimeUtil.TimeZoneOffsetSecondInServer * 1000 - (isdst ? 3600000 : 0)
        return millisecond
    }

    /**
     * 判断是否夏令时
     */
    static IsDst(): boolean {
        let d1 = new Date(2009, 0, 1)
        let d2 = new Date(2009, 6, 1)
        return d1.getTimezoneOffset() != d2.getTimezoneOffset()
    }

    /**
     * 返回本地 local 对应的具体时间。  比如 按东八区来算，今天是星期几、几号
     * @returns 
     */
    static GetDateNumbers(millisecond: number): Array<number> {
        let date = new Date(millisecond)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let hour = date.getHours()
        let min = date.getMinutes()
        let second = date.getSeconds()
        return [year, month, day, hour, min, second]
    }

    static GetFormatDateStrings(millisecond: number): Array<string> {
        let dateInfoList = TimeUtil.GetDateNumbers(millisecond)
        return [
            dateInfoList[0].toString(), // year
            dateInfoList[1].toString().padStart(2, "0"), // month
            dateInfoList[2].toString().padStart(2, "0"), // day
            dateInfoList[3].toString().padStart(2, "0"), // hour
            dateInfoList[4].toString().padStart(2, "0"), // min
            dateInfoList[5].toString().padStart(2, "0")  // second
        ]
    }

    static GetServerYMD(millisecond: number): string {
        let date_numbers = TimeUtil.GetFormatDateStrings(TimeUtil._CovertToServerTimezone(millisecond))
        return `${date_numbers[0]}/${date_numbers[1]}/${date_numbers[2]}`
    }

    static GetServerYMDHMS(millisecond: number): string {
        let date_numbers = TimeUtil.GetFormatDateStrings(TimeUtil._CovertToServerTimezone(millisecond))
        return `${date_numbers[0]}/${date_numbers[1]}/${date_numbers[2]} ${date_numbers[3]}:${date_numbers[4]}:${date_numbers[5]}`
    }

    static GetServerHMS(millisecond: number): string {
        let date_numbers = TimeUtil.GetFormatDateStrings(TimeUtil._CovertToServerTimezone(millisecond))
        return `${date_numbers[3]}:${date_numbers[4]}:${date_numbers[5]}`
    }

    /**
     * 获取当前 今天过去的时间 单位s
     */
    static GetServerDaySeconds(millisecond: number): number {
        let date_numbers = TimeUtil.GetDateNumbers(TimeUtil._CovertToServerTimezone(millisecond))
        return date_numbers[3] * 3600 + date_numbers[4] * 60 + date_numbers[5]
    }

    /**
     * 获取0点时刻,毫秒
     * @param millisecond
     */
    static GetServerDayStartTime(millisecond: number): number {
        let date_numbers = TimeUtil.GetDateNumbers(TimeUtil._CovertToServerTimezone(millisecond))
        return (
            millisecond -
            (date_numbers[3] * 3600 + date_numbers[4] * 60 + date_numbers[5]) * 1000 -
            (millisecond % 1000)
        )
    }

    static IsSameDayInServerTime(millisecond1: number, millisecond2: number): boolean {
        let date_numbers1 = TimeUtil.GetDateNumbers(TimeUtil._CovertToServerTimezone(millisecond1))
        let date_numbers2 = TimeUtil.GetDateNumbers(TimeUtil._CovertToServerTimezone(millisecond2))
        if (
            date_numbers1[0] == date_numbers2[0] &&
            date_numbers1[1] == date_numbers2[1] &&
            date_numbers1[2] == date_numbers2[2]
        ) {
            return true
        }
        return false
    }

    static IsSameDay(millisecond1: number, millisecond2: number): boolean {
        let date_numbers1 = TimeUtil.GetDateNumbers(millisecond1)
        let date_numbers2 = TimeUtil.GetDateNumbers(millisecond2)
        if (
            date_numbers1[0] == date_numbers2[0] &&
            date_numbers1[1] == date_numbers2[1] &&
            date_numbers1[2] == date_numbers2[2]
        ) {
            return true
        }
        return false
    }

    static IsSameWeek(millisecond1: number, millisecond2: number): boolean {
        let date1 = new Date(millisecond1)
        let date2 = new Date(millisecond2)
        let week_day1 = date1.getDay() - 1 < 0 ? 6 : date1.getDay() - 1
        let week_day2 = date2.getDay() - 1 < 0 ? 6 : date2.getDay() - 1
        let week_first_day1 = Math.max(millisecond1 - week_day1 * 86400000, 0)
        let week_first_day2 = Math.max(millisecond1 - week_day2 * 86400000, 0)
        return TimeUtil.IsSameDayInServerTime(week_first_day1, week_first_day2)
    }

    static GetDayInWeek(time: number): number {
        let date = new Date(time)
        return date.getDay() - 1 < 0 ? 6 : date.getDay() - 1
    }

    static GetTodayInWeek(): number {
        return TimeUtil.GetDayInWeek(TimeUtil.GetServerMilliSecond())
    }

    /**
     * 输出 00:00:00 格式时间 输入时间单位秒s
     */
    static ConvertTo_HH_MM_SS_BySecond(s: number): string {
        return TimeUtil.formatStopWatch(s * 1000, "hh : mm : ss")
        // let hours = Math.round((s - 30 * 60) / (60 * 60))
        // let minutes = Math.round((s - 30) / 60) % 60
        // let seconds = Math.round(s % 60)
        // return (hours > 9 ? hours.toString() : "0" + hours.toString()) + " : " + (minutes > 9 ? minutes.toString() : "0" + minutes.toString()) + " : " + (seconds > 9 ? seconds.toString() : "0" + seconds.toString())
    }

    /**
     * 输出 00:00 格式时间 输入时间单位秒s
     */
    static ConvertTo_MM_SS_BySecond(s: number): string {
        return TimeUtil.formatStopWatch(s * 1000, "mm : ss")
        // let minutes = Math.round((s - 30) / 60) % 60
        // let seconds = Math.round(s % 60)
        // return (minutes > 9 ? minutes.toString() : "0" + minutes.toString()) + " : " + (seconds > 9 ? seconds.toString() : "0" + seconds.toString())
    }


    static __date_year_regexp = new RegExp("y+")
    static __date_month_regexp = new RegExp("M+")
    static __date_day_regexp = new RegExp("d+")
    static __date_hour_regexp = new RegExp("h+")
    static __date_minute_regexp = new RegExp("m+")
    static __date_second_regexp = new RegExp("s+")
    static __date_millisecond_regexp = new RegExp("S+")
    static _date_regexp_list = [TimeUtil.__date_year_regexp, TimeUtil.__date_month_regexp, TimeUtil.__date_day_regexp,
    TimeUtil.__date_hour_regexp, TimeUtil.__date_minute_regexp, TimeUtil.__date_second_regexp,
    TimeUtil.__date_millisecond_regexp]

    /**
     * 用于格式化：秒表，倒计时之类的时间，而不是 Date.getTime()!!!   
     * 里面会判断：是否有更小的单位、更大的单位
     * 比如：
     * formatStopWatch(999, "ss.SSS")   ==> 00.999
     * formatStopWatch(999, "ss")       ==> 01
     * formatStopWatch(1000*80, "ss")   ==> 80  
     * formatStopWatch(1000*80, "mm:ss")   ==> 01:20  
     * formatStopWatch(1000*60*60*24 * 3, "ddd")   ==> 003
     * formatStopWatch(1000*60*60*24 * 3, "d")   ==> 3
     * @param milliSecond 
     * @param fmt  "ddd hh:mm:ss.SSS" 分别表示 天 小时 分钟 秒 毫秒   
     * ! 注意 fmt 字符串里，不应该出现中文（多语言翻译的时候，会导致里面的中文，变成 hh mm ss 之类的字符串），从而导致匹配出错
     * 多个相同字母表示：如果时间长度不够字母的数量，则左边补0（除了毫秒）
     * @returns 
     */
    public static formatStopWatch(milliSecond: number, fmt: string) {
        let t = Math.floor(milliSecond / 1000)
        let hasLitterUnit: Map<RegExp, boolean> = new Map()
        let hasBigUnit: Map<RegExp, boolean> = new Map()
        for (let i = 0; i < TimeUtil._date_regexp_list.length; i++) {
            if (fmt.match(TimeUtil._date_regexp_list[i])) {
                for (let j = 0; j < i; j++) {
                    hasLitterUnit.set(TimeUtil._date_regexp_list[j], true)
                }
                // 有更大单位的判断，其实有点问题， 比如 天 不能完全算 秒 的更大单位
                // 目前 这样个判断，只对 相邻的单位 有效
                for (let j = i + 1; j < TimeUtil._date_regexp_list.length; j++) {
                    hasBigUnit.set(TimeUtil._date_regexp_list[j], true)
                }
            }
        }
        let withCarry = false
        { // 毫秒
            let reg = TimeUtil.__date_millisecond_regexp
            let matchedInfo = fmt.match(reg)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    if (hasBigUnit.has(reg)) {
                        fmt = fmt.replace(item, (milliSecond % 1000).toString().padStart(3, "0"))
                    } else {
                        fmt = fmt.replace(item, (milliSecond).toString())
                    }
                }
            }
        }
        { // 秒
            let reg = TimeUtil.__date_second_regexp
            let matchedInfo = fmt.match(reg)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    let value = milliSecond / 1000
                    if (hasBigUnit.has(reg)) {
                        value = value % 60
                    }
                    if (hasLitterUnit.has(reg)) {
                        value = Math.floor(value)
                    } else {
                        value = Math.ceil(value)
                    }
                    if (value == 60 && hasBigUnit.has(reg)) {
                        withCarry = true
                        value = 0
                    }
                    fmt = fmt.replace(item, value.toString().padStart(item.length, "0"))
                }
            }
        }
        { // 分钟
            let reg = TimeUtil.__date_minute_regexp
            let matchedInfo = fmt.match(reg)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    let value = milliSecond / 1000 / 60
                    if (hasBigUnit.has(reg)) {
                        value = value % 60
                    }
                    if (withCarry) {
                        withCarry = false
                        value++
                    }

                    if (hasLitterUnit.has(reg)) {
                        value = Math.floor(value)
                    } else {
                        value = Math.ceil(value)
                    }

                    if (value == 60 && hasBigUnit.has(reg)) {
                        withCarry = true
                        value = 0
                    }

                    fmt = fmt.replace(item, value.toString().padStart(item.length, "0"))
                }
            }
        }
        { // 小时
            let reg = TimeUtil.__date_hour_regexp
            let matchedInfo = fmt.match(reg)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    let value = milliSecond / 1000 / 60 / 60
                    if (hasBigUnit.has(reg)) {
                        value = value % 24
                    }

                    if (withCarry) {
                        withCarry = false
                        value++
                    }

                    if (hasLitterUnit.has(reg)) {
                        value = Math.floor(value)
                    } else {
                        value = Math.ceil(value)
                    }

                    if (value == 24 && hasBigUnit.has(reg)) {
                        withCarry = true
                        value = 0
                    }

                    fmt = fmt.replace(item, value.toString().padStart(item.length, "0"))
                }
            }
        }
        { // 日
            let reg = TimeUtil.__date_day_regexp
            let matchedInfo = fmt.match(reg)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    let value = milliSecond / 1000 / 60 / 60 / 24
                    if (withCarry) {
                        withCarry = false
                        value++
                    }

                    if (hasLitterUnit.has(reg)) {
                        value = Math.floor(value)
                    } else {
                        value = Math.ceil(value)
                    }

                    fmt = fmt.replace(item, value.toString().padStart(item.length, "0"))
                }
            }
        }
        return fmt
    }

    /**
     * 例子 TimeUtil.format(Date.now(), "yyyy-MM-dd hh-mm-ss:S") ===> 2022-07-07 18-04-29:901
     * 
     * @param milliSecond 时间戳
     * @param fmt  "yyyy-MM-dd hh:mm:ss.S"
     * ! 注意 fmt 字符串里，不应该出现中文（多语言翻译的时候，会导致里面的中文，变成 hh mm ss 之类的字符串），从而导致匹配出错
     * 多个相同字母表示：如果时间长度不够字母的数量，则左边补0
     * @returns 
     */
    public static format(milliSecond: number, fmt: string) {
        let date = new Date(milliSecond)
        let o = new Map([
            [TimeUtil.__date_year_regexp, date.getFullYear()],                      // 年
            [TimeUtil.__date_month_regexp, date.getMonth() + 1],                    // 月份
            [TimeUtil.__date_day_regexp, date.getDate()],                           // 日
            [TimeUtil.__date_hour_regexp, date.getHours()],                         // 小时
            [TimeUtil.__date_minute_regexp, date.getMinutes()],                     // 分
            [TimeUtil.__date_second_regexp, date.getSeconds()],                     // 秒
            // ["q+", Math.floor((date.getMonth() + 3) / 3)],  // 季度
            [TimeUtil.__date_millisecond_regexp, date.getMilliseconds()]            // 毫秒
        ])

        o.forEach((value, k) => {
            let matchedInfo = fmt.match(k)
            if (matchedInfo) {
                for (let item of matchedInfo) {
                    if (k == TimeUtil.__date_year_regexp) {
                        fmt = fmt.replace(item, value.toString().padStart(4, "0"))
                    } else if (k == TimeUtil.__date_millisecond_regexp) {
                        fmt = fmt.replace(item, value.toString().padStart(3, "0"))
                        // }
                        // else if (k == "q+") {
                        //     fmt = fmt.replace(item, value.toString())
                    } else {
                        fmt = fmt.replace(item, value.toString().padStart(item.length, "0"))
                    }
                }
            }
        })
        return fmt
    }
}
