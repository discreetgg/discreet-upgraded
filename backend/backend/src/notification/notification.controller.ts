import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendEmailDto } from './dto/email.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ReadDto } from './dto/read-notification.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/schemas/user.schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Post('send-mail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send an email to one or more recipients' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async sendMail(@Body() dto: SendEmailDto) {
    return await this.notificationsService.sendEmail(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user notifications',
    // description:
    //   'Fetch paginated list of notifications for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: String, description: ' user discordId' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications with unread count',
  })
  async getUserNotifications(
    @Query('page') page = 1,
    @Param('id') discordId: string,
    @Req() req: any,
  ) {
    if (discordId !== req.user.sub) {
      throw new ForbiddenException(
        'Cannot access notifications for another user',
      );
    }
    return this.notificationsService.getUserNotifications(discordId, page);
  }

  @Patch('read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mark notifications as read',
  })
  @ApiBody({ type: ReadDto })
  @ApiResponse({
    status: 200,
    description: 'Returns count of updated notifications and new unread count',
  })
  async markAsRead(@Body() dto: ReadDto, @Req() req: any) {
    dto.discordId = req.user.sub;
    return this.notificationsService.markAsRead(dto);
  }
}
