import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { DiscordBotModule } from './discord-bot/discord-bot.module';
import { DatabaseModule } from './database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FileUploaderModule } from './file-uploader/file-uploader.module';
import { PostModule } from './post/post.module';
import { CreatorModule } from './creator/creator.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationModule } from './notification/notification.module';
import { MediaModule } from './media/media.module';
import { ChatModule } from './chat/chat.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MenuModule } from './menu/menu.module';
// import { PurchaseContentModule } from './purchase-content/purchase-content.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentAnalyticsModule } from './payment-analytics/payment-analytics.module';
import { ReportModule } from './report/report.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  //DiscordBotModule
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_SECONDS ?? 60) * 1000,
        limit: Number(process.env.THROTTLE_LIMIT ?? 120),
      },
    ]),
    RedisModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    FileUploaderModule,
    PostModule,
    CreatorModule,
    SubscriptionModule,
    WalletModule,
    NotificationModule,
    MediaModule,
    ChatModule,
    MenuModule,
    PaymentModule,
    PaymentAnalyticsModule,
    ReportModule,
    WebhooksModule,
    ScheduleModule.forRoot(),
    AdminModule,
    // PurchaseContentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
