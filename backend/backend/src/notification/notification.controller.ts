import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Post('send-mail')
  @ApiOperation({ summary: 'Send an email to one or more recipients' })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async sendMail(@Body() dto: SendEmailDto) {
    return await this.notificationsService.sendEmail(dto);
  }

  @Get(':id')
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
  ) {
    return this.notificationsService.getUserNotifications(discordId, page);
  }

  @Patch('read')
  @ApiOperation({
    summary: 'Mark notifications as read',
  })
  @ApiBody({ type: ReadDto })
  @ApiResponse({
    status: 200,
    description: 'Returns count of updated notifications and new unread count',
  })
  async markAsRead(@Body() dto: ReadDto) {
    return this.notificationsService.markAsRead(dto);
  }
}
