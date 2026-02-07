import { Controller, Get, Query } from '@nestjs/common';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('payment-analytics')
export class PaymentAnalyticsController {
  constructor(
    private readonly paymentAnalyticsService: PaymentAnalyticsService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Fan insight
  // ─────────────────────────────────────────────────────────────

  @Get('fan-insight')
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
  ): Promise<any> {
    return this.paymentAnalyticsService.getPayerToReceiverInsights({
      buyerId,
      sellerId,
    });
  }
  // ─────────────────────────────────────────────────────────────
  // creators insight
  // ─────────────────────────────────────────────────────────────

  @Get('alltime')
  @ApiOperation({ summary: 'Get alltime earning of a seller' })
  @ApiQuery({ name: 'sellerId', type: String })
  getAllTime(@Query('sellerId') sellerId: string) {
    return this.paymentAnalyticsService.getAllTimeEarnings(sellerId);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly earning of a seller' })
  @ApiQuery({ name: 'sellerId', type: String })
  @ApiQuery({ name: 'month', type: Number })
  @ApiQuery({ name: 'year', type: Number })
  getMonthly(
    @Query('sellerId') sellerId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.paymentAnalyticsService.getMonthlyInsight({
      sellerId,
      month,
      year,
    });
  }
}
