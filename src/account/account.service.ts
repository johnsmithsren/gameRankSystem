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

    async GetNewPointInfoInDB(account) {
        let myRank = await this.finalPointModal.findOne({ account }).lean()
        return myRank
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

    async GetComputingPowerRanking(account: string, page: number, size: number) {
        let ret: {
            myRank: number,
            myComputingPower: number,
            myAccount: string,
            itemList: {
                computingPower: number,
                account: string
            }[]
        } = {
            myRank: 0,
            myComputingPower: 0,
            myAccount: '',
            itemList: [],
        }
        let dataInDB = await this.accountModel.find({ "miningV3.computingPower": { $gt: 0 } }, { account: 1, miningV3: 1 }).sort({ "miningV3.computingPower": -1 }).skip((page - 1) * size).limit(size).lean()
        for (let item of dataInDB) {
            ret.itemList.push({
                account: item.account,
                computingPower: item.miningV3 ? item.miningV3.computingPower : 0
            })
        }
        let currentAccountInfo = await this.accountModel.findOne({ account }, { account: 1, miningV3: 1 }).lean()
        let userComputingPower = 0
        if (currentAccountInfo.miningV3) {
            userComputingPower = currentAccountInfo.miningV3.computingPower
        }
        let myRank = await this.GetComputingPowerRank(userComputingPower)
        if (myRank) {
            ret.myRank = myRank || 0
            ret.myAccount = account
            ret.myComputingPower = userComputingPower
        }
        return ret
    }
}
