import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Wallet, WalletSchema } from 'src/database/schemas/wallet.schema';
import { WalletController } from './wallet.controller';
import {
  Transaction,
  TransactionSchema,
} from 'src/database/schemas/transaction.schema';
import { Menu, MenuSchema } from 'src/database/schemas/menu.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Menu.name, schema: MenuSchema },
    ]),
  ],
  providers: [WalletService],
  exports: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
