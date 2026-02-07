import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsFollowingResponseDto } from './dto/response.dto';
import { Block } from 'src/database/schemas/blocked.schema';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ─────────────────────────────────────────────────────────────
  // Delete / Restore User
  // ─────────────────────────────────────────────────────────────

  /**
   * Soft delete user account (30-day grace period)
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @ApiOkResponse({
    description: 'Account scheduled for deletion',
    schema: {
      example: {
        message:
          'Account scheduled for deletion. You can restore within 30 days.',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Account already deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteMyAccount(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.deleteAccount(userId);
  }

  /**
   * Restore user account within 30 days
   */
  @Post('me/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restore user account' })
  @ApiOkResponse({
    description: 'Account successfully restored',
    schema: {
      example: {
        message: 'Account successfully restored',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Restoration period expired or not eligible',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async restoreMyAccount(@Req() req: any) {
    const userId = req.user.userId;
    return this.userService.restoreAccount(userId);
  }

  // ─────────────────────────────────────────────────────────────
  // Block user
  // ─────────────────────────────────────────────────────────────
  @Post('block')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Block a user' })
  @ApiBody({ type: BlockUserDto })
  @ApiCreatedResponse({ description: 'User blocked', type: Block })
  async blockUser(@Req() req: any, @Body() dto: BlockUserDto) {
    const userId = req.user.sub;
    return this.userService.blockUser(userId, dto.discordId);
  }

  @Post('unblock')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiCreatedResponse({ description: 'User unblocked', type: Block })
  async unblockUser(@Req() req: any, @Body() dto: BlockUserDto) {
    const userId = req.user.sub;
    return this.userService.unblockUser(userId, dto.discordId);
  }

  @Get('blocked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Fetch all users blocked by the authenticated user',
  })
  @ApiOkResponse({
    description: 'List of blocked users returned successfully',
  })
  async getBlockedUsers(@Req() req: any) {
    const userId = req.user.sub;
    return this.userService.getBlockedUsers(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'get authenticated User' })
  @ApiOkResponse({ description: 'User found.' })
  @ApiNotFoundResponse({ description: 'user not found.' })
  async getAuthenticatedUser(@Req() req: any) {
    const userId = req.user.sub;
    return await this.userService.findUserByDiscordId(userId);
  }

  @Get('username')
  @ApiOperation({ summary: 'fetch a user by username' })
  @ApiQuery({ name: 'username', type: String, description: 'username' })
  @ApiOkResponse({ description: 'User found.' })
  @ApiNotFoundResponse({ description: 'user not found.' })
  async fetchUser(@Query('username') username: string) {
    return await this.userService.findUserByUsername(username);
  }

  @Get('creators')
  @ApiOperation({ summary: 'Fetch creators' })
  @ApiOkResponse({ description: 'Creators found.' })
  @ApiNotFoundResponse({ description: 'creators not found.' })
  async fetchCreators() {
    return await this.userService.fetchAllCreators();
  }

  @Get('buyers')
  @ApiOperation({ summary: 'Fetch buyers' })
  @ApiOkResponse({ description: 'Buyers found.' })
  @ApiNotFoundResponse({ description: 'buyers not found.' })
  async fetchBuyers() {
    return await this.userService.fetchAllBuyers();
  }

  @Get('users')
  @ApiOperation({ summary: 'Fetch all users' })
  @ApiOkResponse({ description: 'Users found.' })
  @ApiNotFoundResponse({ description: 'users not found.' })
  async fetchUsers() {
    return await this.userService.fetchAllUsers();
  }

  // ─────────────────────────────────────────────────────────────
  // Follow
  // ─────────────────────────────────────────────────────────────

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'follow a user' })
  @ApiParam({ name: 'id', type: String, description: 'target user discordId' })
  async follow(@Req() req: any, @Param('id') targetId: string) {
    const userId = req.user.sub;
    return this.userService.followUser(userId, targetId);
  }

  @Post(':id/unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'unfollow a user' })
  @ApiParam({ name: 'id', type: String, description: 'target user discordId' })
  async unfollow(@Req() req: any, @Param('id') targetId: string) {
    const userId = req.user.sub;
    return this.userService.unfollowUser(userId, targetId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Fetch followers of a user' })
  @ApiParam({ name: 'id', type: String, description: 'discordId' })
  async followers(
    @Param('id') id: string,
    @Query('limit') limit = 50,
    @Query('skip') skip = 0,
  ) {
    return this.userService.getFollowers(id, +limit, +skip);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Fetch users that the given user is following' })
  @ApiParam({ name: 'id', type: String, description: 'discordId' })
  async following(
    @Param('id') id: string,
    @Query('limit') limit = 50,
    @Query('skip') skip = 0,
  ) {
    return this.userService.getFollowing(id, +limit, +skip);
  }

  @Get(':id/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if the current user follows a target user' })
  @ApiParam({ name: 'id', type: String, description: 'target User discordId' })
  @ApiOkResponse({ type: IsFollowingResponseDto })
  async isFollowing(@Req() req: any, @Param('id') targetId: string) {
    const userId = req.user.sub;
    const isFollowing = await this.userService.isFollowing(userId, targetId);
    return { isFollowing };
  }

  // ─────────────────────────────────────────────────────────────
  // User
  // ─────────────────────────────────────────────────────────────
  @Get(':id')
  // @ApiCookieAuth('auth_token')
  @ApiOperation({ summary: 'fetch a user' })
  @ApiParam({ name: 'id', type: String, description: 'User discord id' })
  @ApiOkResponse({ description: 'User found.' })
  @ApiNotFoundResponse({ description: 'user not found.' })
  async getUser(@Param('id') id: string) {
    return await this.userService.findUserByDiscordId(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Updates user details' })
  @ApiParam({ name: 'id', type: String, description: 'user discord id' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'User updated.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.updateUser(id, updateUserDto);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post(':id/profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile picture for a user' })
  @ApiParam({ name: 'id', description: 'User discord id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload user profile picture',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded and saved successfully',
  })
  @ApiResponse({ status: 400, description: 'No file provided or bad request' })
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.userService.uploadProfilePicture(id, file);
  }

  @Post(':id/profile-banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile banner for a user' })
  @ApiParam({ name: 'id', description: 'User discord id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload user profile Banner',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded and saved successfully',
  })
  @ApiResponse({ status: 400, description: 'No file provided or bad request' })
  async uploadProfileBanner(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.userService.uploadProfileBanner(id, file);
  }

  @Delete(':id/profile-image')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a user’s profile Image' })
  @ApiParam({ name: 'id', description: 'User discord id' })
  @ApiResponse({
    status: 200,
    description: 'Profile image deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or profile picture not found',
  })
  async deleteProfilePicture(@Param('id') id: string) {
    return this.userService.deleteProfilePicture(id);
  }

  @Delete(':id/profile-banner')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a user’s profile Banner' })
  @ApiParam({ name: 'id', description: 'User discord id' })
  @ApiResponse({
    status: 200,
    description: 'Profile banner deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or profile Banner not found',
  })
  async deleteProfileBanner(@Param('id') id: string) {
    return this.userService.deleteProfileBanner(id);
  }
}
