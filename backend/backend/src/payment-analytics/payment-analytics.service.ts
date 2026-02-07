import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';
import { FanInsightDto } from './dto/fan-insight.dto';
import { User } from 'src/database/schemas/user.schema';
import { MonthlyEarningDto } from './dto/monthly-earning-insight.dto';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class PaymentAnalyticsService {
  constructor(
    private readonly walletService: WalletService,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getPayerToReceiverInsights(dto: FanInsightDto) {
    const [buyer, seller] = await Promise.all([
      this.userModel.findOne({ discordId: dto.buyerId }),
      this.userModel.findOne({ discordId: dto.sellerId }),
    ]);

    if (!buyer) throw new BadRequestException('buyer does not exist');
    if (!seller) throw new BadRequestException('Seller does not exist');

    const [result] = await this.paymentModel.aggregate([
      {
        $match: {
          payer: buyer._id,
          receiver: seller._id,
          status: { $in: [PaymentStatus.COMPLETED, PaymentStatus.RELEASED] },
        },
      },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                highestPayment: { $max: '$amount' },
              },
            },
          ],
          typeBreakdown: [
            {
              $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
          ],
          lastPayment: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                amount: 1,
                type: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          totalAmount: {
            $ifNull: [{ $arrayElemAt: ['$totalStats.totalAmount', 0] }, 0],
          },
          highestPayment: {
            $ifNull: [{ $arrayElemAt: ['$totalStats.highestPayment', 0] }, 0],
          },
          typeBreakdown: {
            $arrayToObject: {
              $map: {
                input: '$typeBreakdown',
                as: 't',
                in: { k: '$$t._id', v: '$$t.total' },
              },
            },
          },
          lastPayment: { $arrayElemAt: ['$lastPayment', 0] },
        },
      },
    ]);

    return (
      result || {
        totalAmount: 0,
        highestPayment: 0,
        typeBreakdown: {},
        lastPayment: null,
      }
    );
  }

  async getAllTimeEarnings(sellerId: string) {
    const seller = await this.userModel.findOne({ discordId: sellerId });
    if (!seller) throw new BadRequestException('Seller does not exist');

    const result = await this.paymentModel.aggregate([
      {
        $match: {
          receiver: seller._id,
          status: { $in: [PaymentStatus.COMPLETED, PaymentStatus.RELEASED] },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
        },
      },
    ]);

    return {
      seller: seller.discordId,
      totalEarnings: result?.[0]?.totalEarnings ?? 0,
    };
  }

  async getMonthlyInsight(dto: MonthlyEarningDto) {
    const seller = await this.userModel.findOne({ discordId: dto.sellerId });
    if (!seller) throw new BadRequestException('Seller does not exist');

    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 1);

    const monthlyData = await this.paymentModel.aggregate([
      {
        $match: {
          receiver: seller._id,
          status: { $in: [PaymentStatus.COMPLETED, PaymentStatus.RELEASED] },
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // ensure stable response shape
    const breakdown: Record<PaymentType, number> = {
      [PaymentType.TIP]: 0,
      [PaymentType.SUBSCRIPTION]: 0,
      [PaymentType.SUBSCRIPTION_RENEWAL]: 0,
      [PaymentType.MENU_PURCHASE]: 0,
      [PaymentType.MEDIA_PURCHASE]: 0,
      [PaymentType.CALL_SESSION]: 0,
    };

    for (const row of monthlyData) breakdown[row._id] = row.total;

    const totalMonthlyEarnings = Object.values(breakdown).reduce(
      (a, b) => a + b,
      0,
    );

    return {
      seller: seller.discordId,
      month: dto.month,
      year: dto.year,
      totalMonthlyEarnings,
      breakdown,
    };
  }
}
