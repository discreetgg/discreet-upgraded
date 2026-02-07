import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CreatorService } from './creator.service';
import { CreateLikeDto } from 'src/post/dto/create-like.dto';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import {
  SubmitDiscordServerDto,
  UpdateDiscordServerDtoDto,
} from './dto/discord-server.dto';
import { Server } from 'src/database/schemas/discord-server.schema';
import { Race, User } from 'src/database/schemas/user.schema';
import { LikeServerDto } from './dto/like-server.dto';
import { CamSettingDto } from './dto/cam-setting.dto';
import { SetRaceDto } from './dto/set-race.dto';

@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  // ─────────────────────────────────────────────────────────────
  // 🟩 seller cam settings
  // ─────────────────────────────────────────────────────────────
  @Patch('cam-settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'sellers cam settings' })
  @ApiResponse({
    status: 200,
    description: 'cam settings set successfully',
    type: User,
  })
  async CamSettings(@Body() dto: CamSettingDto, @Req() req: any) {
    const creatorId = req.user.sub;
    if (creatorId !== dto.sellerId) {
      throw new BadRequestException('seller is not the same as logged in user');
    }
    return this.creatorService.camSettings(dto);
  }

  // ─────────────────────────────────────────────────────────────
  // 🟩 SERVERS
  // ─────────────────────────────────────────────────────────────

  @Post('server/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Like a server ',
  })
  @ApiOkResponse({ description: 'Server liked successfully' })
  async like(@Body() dto: LikeServerDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.creatorService.likeServer(userId, dto);
  }

  @Post('server/unlike')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Unlike server ',
  })
  @ApiOkResponse({ description: 'Server unliked successfully' })
  async unlike(@Body() dto: CreateLikeDto, @Req() req: any) {
    const userId = req.user.userId;

    return this.creatorService.unlikeServer(userId, dto);
  }

  @Get('server/has-liked/:serverId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Check if user has liked a server ',
  })
  @ApiOkResponse({ description: 'Returns true or false' })
  async hasLiked(@Param('serverId') serverId: string, @Req() req: any) {
    const userId = req.user.userId;
    const exists = await this.creatorService.hasUserLiked(
      userId,
      serverId,
      'Server',
    );
    return { liked: !!exists };
  }

  @Post('server/:creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Submit a discord server',
  })
  @ApiParam({
    name: 'creatorId',
    type: String,
    description: 'Creator Discord ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Discord server submitted',
  })
  async submitServer(
    @Param('creatorId') creatorId: string,
    @Body() dto: SubmitDiscordServerDto,
  ) {
    //TODO:check if is a creators
    return this.creatorService.submitServer(creatorId, dto);
  }

  @Patch('server/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a server' })
  @ApiParam({ name: 'id', type: String, description: 'server id' })
  @ApiResponse({
    status: 200,
    description: 'Server updated',
    type: Server,
  })
  async updateServer(
    @Param('id') id: string,
    @Body() dto: UpdateDiscordServerDtoDto,
    @Req() req: any,
  ) {
    const creatorId = req.user.userId;
    return this.creatorService.updateServer(id, creatorId, dto);
  }

  @Get('server/:id')
  @ApiOperation({ summary: 'get a server' })
  @ApiParam({ name: 'id', type: String, description: 'server Id' })
  @ApiResponse({
    status: 200,
    description: 'server found',
    type: Server,
  })
  async getServer(@Param('id') id: string) {
    return this.creatorService.getServer(id);
  }

  @Get('server')
  @ApiOperation({ summary: 'get all server' })
  @ApiResponse({
    status: 200,
    description: 'servers found',
    type: [Server],
  })
  async getAllServer() {
    return this.creatorService.getAllServer();
  }

  @Delete('server/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Permanently delete a server',
  })
  @ApiQuery({ name: 'discordId', required: true, type: String })
  async deleteServer(
    @Param('id') serverId: string,
    @Query('discordId') discordId: string,
  ) {
    // const authorId = req.user.userId;

    return this.creatorService.deleteServer(serverId, discordId);
  }

  @Get('search-server')
  @ApiOperation({ summary: 'Search servers by name' })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search string for server name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of servers matching query',
    type: [Server],
  })
  async searchServer(@Query('q') query: string): Promise<Server[]> {
    return this.creatorService.searchServer(query);
  }

  // ─────────────────────────────────────────────────────────────
  // 🟩 CREATORS
  // ─────────────────────────────────────────────────────────────

  @Get('search-sellers')
  @ApiOperation({ summary: 'Search sellers by username or display name' })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search string (matches username first, then displayName)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sellers matching the query',
    type: [User],
  })
  async searchSellers(@Query('q') query: string): Promise<User[]> {
    return this.creatorService.searchSellers(query);
  }

  // ─────────────────────────────────────────────────────────────
  // 🟩 CREATOR RACE
  // ─────────────────────────────────────────────────────────────

  // @Patch(':id/race')
  @Patch('race/:id')
  @ApiOperation({ summary: 'Set Seller race for the first time' })
  @ApiParam({ name: 'id', description: 'discord Id', type: String })
  @ApiBody({ type: SetRaceDto })
  @ApiResponse({ status: 200, description: 'Race set successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async setRace(@Param('id') id: string, @Body() dto: SetRaceDto) {
    return this.creatorService.setRace(id, dto);
  }

  @Patch('race/edit/:id')
  @ApiOperation({ summary: 'Edit/Update sellers race' })
  @ApiParam({ name: 'id', description: 'discord Id', type: String })
  @ApiBody({ type: SetRaceDto })
  @ApiResponse({ status: 200, description: 'Race updated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async editRace(@Param('id') id: string, @Body() dto: SetRaceDto) {
    return this.creatorService.editRace(id, dto);
  }

  @Get('race')
  @ApiOperation({ summary: 'Fetch sellers, optionally filtered by race' })
  @ApiQuery({
    name: 'race',
    required: false,
    enum: Race,
    description: 'Filter sellers by race',
  })
  @ApiResponse({ status: 200, description: 'seller fetched successfully' })
  async getUsers(@Query('race') race?: Race) {
    return this.creatorService.getCreatorsByRace(race);
  }
}
