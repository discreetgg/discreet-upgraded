import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipDto } from './dto/tip.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { BuyMenuDto } from './dto/buy-menu.dto';
import { SubscribeUserDto } from './dto/subscribe.dto';
import { PayInMessageMediaAssetDto } from './dto/pay-in-message-asset.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('purchased')
  async getPurchasedMedias(
    @Query('buyerId') buyerId: string,
    @Query('sellerId') sellerId: string,
  ) {
    return await this.paymentService.getUserPaidMenu(buyerId, sellerId);
  }

  // ─────────────────────────────────────────────────────────────
  // TIP
  // ─────────────────────────────────────────────────────────────

  @Post('tip')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tip user' })
  @ApiBody({ type: TipDto })
  @ApiResponse({
    status: 201,
    description: 'Tip sent successfully',
  })
  //   @ApiResponse({ status: 404, description: 'User not found' })
  async tipCreator(@Body() dto: TipDto, @Req() req: any): Promise<any> {
    const userId = req.user.sub;
    if (dto.tipperId !== userId)
      throw new BadRequestException('sender is not same as logged in user');
    return this.paymentService.tipCreator(dto);
  }

  // ─────────────────────────────────────────────────────────────
  // Menu
  // ─────────────────────────────────────────────────────────────

  @Post('buy-menu')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buy Menu' })
  @ApiBody({ type: BuyMenuDto })
  @ApiResponse({
    status: 201,
    description: 'successfully bought a menu',
  })
  //   @ApiResponse({ status: 404, description: 'User not found' })
  async buyMenu(@Body() dto: BuyMenuDto, @Req() req: any): Promise<any> {
    const userId = req.user.sub;
    if (dto.buyerId !== userId)
      throw new BadRequestException('buyer is not same as logged in user');
    return this.paymentService.buyMenu(dto);
  }

  // ─────────────────────────────────────────────────────────────
  // subscribe
  // ─────────────────────────────────────────────────────────────

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe user to a plan' })
  @ApiBody({ type: SubscribeUserDto })
  @ApiResponse({
    status: 201,
    description: 'successfully subscribed to a plan',
  })
  //   @ApiResponse({ status: 404, description: 'User not found' })
  async subscribeToPlan(
    @Body() dto: SubscribeUserDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user.sub;
    if (dto.buyerId !== userId)
      throw new BadRequestException('subscriber is not same as logged in user');
    return this.paymentService.subscribeToPlan(dto);
  }

  // ─────────────────────────────────────────────────────────────
  // in-message asset
  // ─────────────────────────────────────────────────────────────

  @Post('message-asset')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pay for an in-message asset' })
  @ApiBody({ type: PayInMessageMediaAssetDto })
  @ApiResponse({
    status: 201,
    description: 'successfully paid for a media asset',
  })
  //   @ApiResponse({ status: 404, description: 'User not found' })
  async payForInMessageMediaAsset(
    @Body() dto: PayInMessageMediaAssetDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user.sub;
    if (dto.buyerId !== userId)
      throw new BadRequestException(
        'media asset reciever is not same as logged in user',
      );
    return this.paymentService.payForInMessageMediaAsset(dto);
  }
}
