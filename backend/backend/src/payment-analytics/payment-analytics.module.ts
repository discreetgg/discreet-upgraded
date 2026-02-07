import { Module } from '@nestjs/common';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { PaymentAnalyticsController } from './payment-analytics.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { Payment, PaymentSchema } from 'src/database/schemas/payment.schema';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    JwtModule,
    WalletModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  providers: [PaymentAnalyticsService],
  controllers: [PaymentAnalyticsController],
})
export class PaymentAnalyticsModule {}
