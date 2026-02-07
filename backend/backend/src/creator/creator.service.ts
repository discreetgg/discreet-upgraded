import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Server } from 'src/database/schemas/discord-server.schema';
import { Race, Role, User } from 'src/database/schemas/user.schema';
import {
  SubmitDiscordServerDto,
  UpdateDiscordServerDtoDto,
} from './dto/discord-server.dto';
import { CreateLikeDto } from 'src/post/dto/create-like.dto';
import { Like } from 'src/database/schemas/like.schema';
import { LikeServerDto } from './dto/like-server.dto';
import { CamSettingDto } from './dto/cam-setting.dto';
import { SetRaceDto } from './dto/set-race.dto';
import { DiscordBotService } from 'src/discord-bot/discord-bot.service';

@Injectable()
export class CreatorService {
  private logger = new Logger(CreatorService.name);

  constructor(
    private readonly discordService: DiscordBotService,
    @InjectModel(Server.name)
    private readonly serverModel: Model<Server>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Like.name) private readonly likeModel: Model<Like>,
  ) {}

  // set cam settings
  async camSettings(dto: CamSettingDto): Promise<User> {
    try {
      const seller = await this.userModel.findOne({ discordId: dto.sellerId });
      if (!seller) throw new NotFoundException('Seller not found');

      const minimumCallTime = dto.minimumCallTime ?? 1;

      const updateFields: any = {
        callRate: dto.rate,
        minimumCallTime,
      };

      if (dto.takingCams !== undefined)
        updateFields.takingCams = dto.takingCams;

      if (dto.takingCalls !== undefined)
        updateFields.takingCalls = dto.takingCalls;

      const updatedSeller = await this.userModel
        .findOneAndUpdate(
          { _id: seller._id.toString() },
          { $set: updateFields },
          { new: true },
        )
        .select(' -__v -hashedPin -_2FAData -backupCodes');

      if (!updatedSeller)
        throw new BadRequestException('Failed to update call rate');

      return updatedSeller;
    } catch (error) {
      this.logger.error(error);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Failed to set seller call rate');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SELLERS
  // ─────────────────────────────────────────────────────────────
  async searchSellers(query: string): Promise<User[]> {
    const regex = new RegExp(query, 'i'); // case-insensitive search

    // First search for username matches
    const usernameMatches = await this.userModel
      .find({
        role: Role.SELLER,
        username: { $regex: regex },
      })
      .exec();

    // Then search for displayName matches, excluding already found users
    const displayNameMatches = await this.userModel
      .find({
        role: Role.SELLER,
        displayName: { $regex: regex },
        _id: { $nin: usernameMatches.map((u) => u._id) }, // avoid duplicates
      })
      .exec();

    // Merge results: usernames first, then displayNames
    return [...usernameMatches, ...displayNameMatches];
  }
  // ─────────────────────────────────────────────────────────────
  // DISCORD SERVER
  // ─────────────────────────────────────────────────────────────

  async submitServer(
    creatorId: string,
    dto: SubmitDiscordServerDto,
  ): Promise<Server> {
    try {
      const creator = await this.userModel.findOne({ discordId: creatorId });
      if (!creator) {
        throw new BadRequestException('User not found');
      }

      //TODO:VERIFY DISCORD SERVER
      const verifiedServerDetail =
        await this.discordService.verifyServerSubmittion(
          creatorId,
          dto.guildId,
        );

      if (!verifiedServerDetail) {
        throw new BadRequestException('Failed to verify server');
      }

      const serverStat = await this.discordService.updateGuildStats(
        dto.guildId,
      );

      const newServer = new this.serverModel({
        ...dto,
        name: verifiedServerDetail.name,
        icon: verifiedServerDetail.icon,
        creator: creator._id,
        activeMemberCount: serverStat.activeMembers || 0,
        totalMemberCount: serverStat.totalMembers || 0,
      });

      await newServer.save();

      await newServer.populate(
        'creator',
        'discordId  username displayName discordAvatar profileImage',
      );

      return newServer;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException('Failed to submit server');
    }
  }

  async updateServer(
    serverId: string,
    creatorId: string,
    data: UpdateDiscordServerDtoDto,
  ): Promise<Server> {
    try {
      // Use findOneAndUpdate to include creatorId in the filter
      const updatedServer = await this.serverModel
        .findOneAndUpdate(
          { _id: serverId, creator: creatorId }, // Filter with both ID and creator
          { $set: data },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedServer) {
        throw new NotFoundException('Server  not found or unauthorized');
      }
      await updatedServer.populate(
        'creator',
        'discordId  username displayName discordAvatar profileImage',
      );
      return updatedServer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid server data');
      }

      throw new BadRequestException('Failed to update server');
    }
  }

  async updateServerStat(guildId: string) {
    const serverStat = await this.discordService.updateGuildStats(guildId);

    if (serverStat) {
      await this.serverModel
        .findOneAndUpdate(
          { guildId },
          {
            $set: {
              activeMemberCount: serverStat.activeMembers,
              totalMemberCount: serverStat.totalMembers,
            },
          },
          { new: true },
        )
        .exec();
    }
  }

  async deleteServer(serverId: string, creatorId: string) {
    const server = await this.serverModel.findOne({
      _id: serverId,
      creator: creatorId,
    });

    if (!server)
      throw new NotFoundException('Server not found or not owned by user');

    await this.serverModel.findByIdAndDelete(serverId);

    return { deleted: true };
  }

  async getServer(id: string): Promise<Server> {
    const server = await this.serverModel
      .findById(id)
      .populate({
        path: 'creator',
        select: 'discordId  username displayName discordAvatar profileImage',
      })
      .exec();

    if (!server) {
      throw new NotFoundException('server not found');
    }
    return server;
  }

  async getAllServer(): Promise<Server[]> {
    const servers = await this.serverModel
      .find()
      .populate({
        path: 'creator',
        select: 'discordId  username displayName discordAvatar profileImage',
      })
      .exec();

    if (!servers) {
      throw new NotFoundException('servers not found');
    }
    return servers;
  }

  async searchServer(query: string): Promise<Server[]> {
    const regex = new RegExp(query, 'i'); // case-insensitive search

    return await this.serverModel
      .find({
        name: { $regex: regex },
      })
      .exec();
  }

  // ─────────────────────────────────────────────────────────────
  // LIKE SERVER
  // ─────────────────────────────────────────────────────────────

  async likeServer(userId: string, dto: LikeServerDto): Promise<any> {
    const { serverId } = dto;

    const targetModels: Record<string, Model<any>> = {
      Server: this.serverModel,
    };

    const targetModel = targetModels['Server'];
    if (!targetModel) {
      throw new BadRequestException('Invalid targetType');
    }

    // Validate target existence
    const target = await targetModel.findById(serverId);
    if (!target) {
      throw new NotFoundException(`Server not found`);
    }

    // Prevent duplicate like (enforced also by unique index)
    const exists = await this.likeModel.findOne({
      user: userId,
      targetId: serverId,
      targetType: 'Server',
    });

    if (exists) {
      throw new ConflictException('You already liked this item');
    }

    // Create like
    const like = await this.likeModel.create({
      user: userId,
      targetId: serverId,
      targetType: 'Server',
    });

    // Increment likes count on the target
    await targetModel.findByIdAndUpdate(serverId, {
      $inc: { likesCount: 1 },
    });

    // Return structured response
    return {
      status: 'successful',
      like,
    };
  }

  async unlikeServer(userId: string, dto: CreateLikeDto): Promise<any> {
    const { targetId, targetType } = dto;

    // Dynamically resolve the correct model based on targetType
    const targetModels: Record<string, Model<any>> = {
      Server: this.serverModel,
    };

    const targetModel = targetModels[targetType];
    if (!targetModel) {
      throw new BadRequestException('Invalid targetType');
    }

    // Validate target existence
    const target = await targetModel.findById(targetId);
    if (!target) {
      throw new NotFoundException(`${targetType} not found`);
    }

    // Check if like exists
    const existingLike = await this.likeModel.findOne({
      user: userId,
      targetId,
      targetType,
    });

    if (!existingLike) {
      throw new NotFoundException('Like not found');
    }

    // Delete the like
    await this.likeModel.deleteOne({ _id: existingLike._id });

    // Decrement likes count on the target
    await targetModel.findByIdAndUpdate(targetId, {
      $inc: { likesCount: -1 },
    });

    // Return structured response
    return {
      status: 'successful',
      message: 'Like removed successfully',
    };
  }

  async hasUserLiked(
    userId: string,
    targetId: string,
    targetType: 'Server',
  ): Promise<boolean> {
    const userLiked = await this.likeModel.exists({
      user: userId,
      targetId,
      targetType,
    });
    if (!userLiked) return false;
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  //  RACE
  // ─────────────────────────────────────────────────────────────

  async setRace(discordId: string, dto: SetRaceDto): Promise<User> {
    return this.userModel.findOneAndUpdate(
      { discordId, role: Role.SELLER },
      { race: dto.race },
      { new: true },
    );
  }

  async editRace(discordId: string, dto: SetRaceDto): Promise<User> {
    return this.setRace(discordId, dto);
  }

  async getCreatorsByRace(race?: Race): Promise<User[]> {
    const filter = race ? { race } : {};
    return this.userModel
      .find(filter)
      .lean()
      .select('-_id -__v -hashedPin -_2FAData');
  }
}
