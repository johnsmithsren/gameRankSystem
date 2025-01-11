import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
export type AccountDocument = Account & Document
@Schema({ collection: 'account' })
export class Account extends Document {
    @Prop({ index: true, unique: true })
    userId: string           

    @Prop({ index: true})
    name: string
}
export const AccountSchema = SchemaFactory.createForClass(Account)

