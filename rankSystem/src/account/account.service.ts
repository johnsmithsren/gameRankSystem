import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectRedis } from '@songkeys/nestjs-redis'
import { AccountDocument, IPointInfoInDB } from '../entities/account.entity'
import Redis from 'ioredis'
import { Model } from 'mongoose'
@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name);
    constructor(
        @InjectRedis() private readonly redis: Redis,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
    ) {
    }
    async GetPointInfoInDB(account) {
        let accountInfoWithPointInfo: AccountDocument = await this.accountModel.findOne({ account }).select("pointInfo").lean()
        if (accountInfoWithPointInfo == null) {
            Logger.warn(`account not exist: ${account}`)
            throw new Error(`account not exist: ${account}`)
        }
        if (accountInfoWithPointInfo.pointInfo == null) {
            let ret: IPointInfoInDB = {
                totalPoint: 0,
                totalPointUpdateTimeMS: 0
            }
            return ret
        }
        return accountInfoWithPointInfo.pointInfo
    }


    async IncreaseTotalPoint(account: string, point: number) {
        let currentTimeMS = Date.now()
        let result = await this.accountModel.updateOne({ account }, {

            $inc: {
                "pointInfo.totalPoint": point,
                "pointInfo.taskFinishedCount": 1
            },
            $set: {
                "pointInfo.totalPointUpdateTimeMS": currentTimeMS,
            }
        }).exec()
    }

    async GetTotalPointRank(account, pointInfoInDB: IPointInfoInDB): Promise<number> {
        // 去掉一个判断条件，耗时变为  1/3 , 所以暂时先去掉
        let ret = await this.accountModel.countDocuments({
            "pointInfo.totalPoint": { $gt: pointInfoInDB.totalPoint }
        })


        return ret + 1
    }
    //#endregion


}
