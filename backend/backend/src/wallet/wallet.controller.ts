import {
  Body,
  Controller,
  ForbiddenException,
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
import { Role } from 'src/database/schemas/user.schema';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':discordId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet by Discord ID' })
  async getWallet(@Param('discordId') discordId: string, @Req() req: any) {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException('Cannot access another user wallet');
    }
    return this.walletService.getWallet(discordId);
  }

  @Get(':discordId/balance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@Param('discordId') discordId: string, @Req() req: any) {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException('Cannot access another user wallet balance');
    }
    return this.walletService.getWalletBalance(discordId);
  }

  @Post('fund')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Fund wallet ' })
  async topUp(@Body() dto: TopUpDto, @Req() req: any) {
    const allowLocalFunding = process.env.ALLOW_LOCAL_WALLET_FUND === 'true';
    const isAdmin = req.user.role === Role.ADMIN;
    if (!allowLocalFunding && !isAdmin) {
      throw new ForbiddenException(
        'Direct wallet funding is disabled in this environment',
      );
    }
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recent wallet transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Param('discordId') discordId: string,
    @Query('limit') limit = 100,
    @Req() req: any,
  ) {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException(
        'Cannot access another user wallet transactions',
      );
    }
    return this.walletService.getWalletTransaction(discordId, Number(limit));
  }
}
