import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@Controller('payment-analytics')
export class PaymentAnalyticsController {
  constructor(
    private readonly paymentAnalyticsService: PaymentAnalyticsService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Fan insight
  // ─────────────────────────────────────────────────────────────

  @Get('fan-insight')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment insight between a buyer and seller' })
  @ApiQuery({
    name: 'buyerId',
    type: String,
    description: 'Buyer (payer) Discord ID',
  })
  @ApiQuery({
    name: 'sellerId',
    type: String,
    description: 'Seller (receiver) Discord ID',
  })
  async fanInsight(
    @Query('buyerId') buyerId: string,
    @Query('sellerId') sellerId: string,
    @Req() req: any,
  ): Promise<any> {
    const requesterDiscordId = req.user.sub;
    if (buyerId !== requesterDiscordId && sellerId !== requesterDiscordId) {
      throw new ForbiddenException(
        'You can only access insights for your own account',
      );
    }

    return this.paymentAnalyticsService.getPayerToReceiverInsights({
      buyerId,
      sellerId,
    });
  }
  // ─────────────────────────────────────────────────────────────
  // creators insight
  // ─────────────────────────────────────────────────────────────

  @Get('alltime')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get alltime earning of a seller' })
  @ApiQuery({ name: 'sellerId', type: String })
  getAllTime(@Query('sellerId') sellerId: string, @Req() req: any) {
    if (sellerId !== req.user.sub) {
      throw new ForbiddenException(
        'You can only access all-time insights for your own account',
      );
    }

    return this.paymentAnalyticsService.getAllTimeEarnings(sellerId);
  }

  @Get('monthly')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get monthly earning of a seller' })
  @ApiQuery({ name: 'sellerId', type: String })
  @ApiQuery({ name: 'month', type: Number })
  @ApiQuery({ name: 'year', type: Number })
  getMonthly(
    @Query('sellerId') sellerId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req: any,
  ) {
    if (sellerId !== req.user.sub) {
      throw new ForbiddenException(
        'You can only access monthly insights for your own account',
      );
    }

    return this.paymentAnalyticsService.getMonthlyInsight({
      sellerId,
      month,
      year,
    });
  }
}
