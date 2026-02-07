import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TopUpDto } from './dto/wallet.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':discordId')
  @ApiOperation({ summary: 'Get wallet by Discord ID' })
  async getWallet(@Param('discordId') discordId: string) {
    return this.walletService.getWallet(discordId);
  }

  @Get(':discordId/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@Param('discordId') discordId: string) {
    return this.walletService.getWalletBalance(discordId);
  }

  @Post('fund')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fund wallet ' })
  async topUp(@Body() dto: TopUpDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.walletService.topUp(userId, dto.amount);
  }

  //   @Post('transfer')
  //   @ApiOperation({ summary: 'Transfer funds between wallets' })
  //   async transfer(@Body() dto: TransferDto) {
  //     return this.walletService.transfer(
  //       dto.senderId,
  //       dto.receiverId,
  //       dto.amount,
  //     );
  //   }

  //   @Post('pay')
  //   @ApiOperation({ summary: 'Pay a merchant (specialized transfer)' })
  //   async pay(@Body() dto: PayDto) {
  //     return this.walletService.transfer(dto.payerId, dto.merchantId, dto.amount);
  //   }

  @Get(':discordId/transactions')
  @ApiOperation({ summary: 'Get recent wallet transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Param('discordId') discordId: string,
    @Query('limit') limit = 100,
  ) {
    return this.walletService.getWalletTransaction(discordId, Number(limit));
  }
}
