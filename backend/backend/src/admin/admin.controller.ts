import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/schemas/user.schema';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @Get('users/banned')
  async getBannedUsers() {
    return this.adminService.getBannedUsers();
  }

  @Patch('users/:discordId/ban')
  @ApiBody({ type: BanUserDto })
  async banUser(
    @Param('discordId') discordId: string,
    @Body() body: BanUserDto,
  ) {
    return this.adminService.banUser(discordId, body.reason);
  }

  @Patch('users/:discordId/unban')
  async unbanUser(@Param('discordId') discordId: string) {
    return this.adminService.unbanUser(discordId);
  }

  @Delete('users/:discordId')
  async deleteUser(@Param('discordId') discordId: string) {
    return this.adminService.softDeleteUser(discordId);
  }

  @Patch('users/:discordId')
  @ApiBody({ type: AdminUpdateUserDto })
  async updateUser(
    @Param('discordId') discordId: string,
    @Body() data: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(discordId, data);
  }

  @Get('chats')
  async getChats(
    @Query('user1DiscordId') user1: string,
    @Query('user2DiscordId') user2: string,
  ) {
    return this.adminService.getChats(user1, user2);
  }
}
