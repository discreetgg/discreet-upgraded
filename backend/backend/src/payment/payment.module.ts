import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Wallet, WalletSchema } from 'src/database/schemas/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/database/schemas/transaction.schema';
import { WalletModule } from 'src/wallet/wallet.module';
import { Menu, MenuSchema } from 'src/database/schemas/menu.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { Payment, PaymentSchema } from 'src/database/schemas/payment.schema';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from 'src/database/schemas/subscription-plan.schema';
import {
  UserSubscription,
  UserSubscriptionSchema,
} from 'src/database/schemas/user-subscription.schema';
import { Message, MessageSchema } from 'src/database/schemas/message.schema';
import { ChatModule } from 'src/chat/chat.module';
import {
  MenuMedia,
  MenuMediaSchema,
} from 'src/database/schemas/menu-media.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: MenuMedia.name, schema: MenuMediaSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    WalletModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => ChatModule),
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
