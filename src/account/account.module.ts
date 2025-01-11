import { Module } from '@nestjs/common'
import { AccountService } from './account.service'
import { AccountController } from './account.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Account, AccountSchema } from '../entities/account.entity'
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    ],
    exports: [AccountService],
    controllers: [AccountController],
    providers: [AccountService],
})
export class AccountModule { }
