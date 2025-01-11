import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, SchemaTypes } from 'mongoose'
export type AccountDocument = Account & Document
export interface IPointInfoInDB {
    totalPoint: number               
    totalPointUpdateTimeMS: number   // 总积分更新时间        
    // totalPointForSort: string // 用于排序，先>=积分, <更新时间  ===>  totalPoint * 100000000000000   + (100000000000000 -totalPointUpdateTimeMS )
}
@Schema({ collection: 'account' })
export class Account extends Document {
    @Prop({ index: true, unique: true })
    account: string           

    @Prop({ type: SchemaTypes.Mixed })
    pointInfo: IPointInfoInDB

}
export const AccountSchema = SchemaFactory.createForClass(Account)
AccountSchema.index({ 'pointInfo.totalPoint': -1, 'pointInfo.totalPointUpdateTimeMS': 1 })
