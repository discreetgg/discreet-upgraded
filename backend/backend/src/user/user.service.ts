import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Role, User } from 'src/database/schemas/user.schema';
import { DiscordUser } from './interfaces/userAuth.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileUploaderService } from 'src/file-uploader/file-uploader.service';
import { Follow } from 'src/database/schemas/follow.schema';
import { WalletService } from 'src/wallet/wallet.service';
import { NotificationService } from 'src/notification/notification.service';
import {
  CreateNotificationDto,
  NotificationEntityType,
} from 'src/notification/dto/in-app-notification.dto';
import { Block } from 'src/database/schemas/blocked.schema';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private readonly fileUploaderService: FileUploaderService,
    readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Follow.name) private readonly followModel: Model<Follow>,
    @InjectModel(Block.name) private readonly blockModel: Model<Block>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // async createUser(user: DiscordUser): Promise<User> {
  //   //TODO:ADD refereall code when they verify their account
  //   // change role to SELLER, when they verify their account
  //   try {
  //     const existingUser = await this.userModel
  //       .findOne({ discordId: user.id })
  //       .select(' -__v -hashedPin -_2FAData')
  //       .lean();
  //     if (existingUser) {
  //       return existingUser;
  //     }
  //     const newUser = new this.userModel({
  //       discordId: user.id,
  //       email: user.email ?? undefined,
  //       username: user.username,
  //       discordDisplayName: user.global_name,
  //       displayName: user.global_name,
  //       discordAvatar: user.avatar,
  //     });
  //     await newUser.save();

  //     await this.walletService.createWallet(newUser._id.toString());

  //     return newUser;
  //   } catch (error) {
  //     this.logger.error('Error creating user', error);
  //     throw error;
  //   }
  // }

  async createUser(user: DiscordUser): Promise<User> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // check if user already exists
      const existingUser = await this.userModel
        .findOne({ discordId: user.id })
        .select('-__v -hashedPin -_2FAData')
        .lean();

      if (existingUser) {
        await session.endSession();
        return existingUser as User;
      }

      // create user
      const newUser = new this.userModel({
        discordId: user.id,
        email: user.email ?? undefined,
        username: user.username,
        discordDisplayName: user.global_name,
        displayName: user.global_name,
        discordAvatar: user.avatar,
      });

      await newUser.save({ session });

      // create wallet linked to user
      await this.walletService.createWallet(newUser._id.toString(), session);

      await session.commitTransaction();
      return newUser.toObject(); // keep consistent with existingUser
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error creating user', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findUserByDiscordId(id: string): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({ discordId: id })
        .lean()
        .select('-_id -__v -hashedPin -_2FAData');
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`error finding user with Id ${id}`, error);
      throw error;
    }
  }

  async findUserByUsername(username: string): Promise<User> {
    try {
      const user = await this.userModel
        .findOne({ username: username })
        .lean()
        .select('-_id -__v -hashedPin -_2FAData');
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`error finding user with username ${username}`, error);
      throw error;
    }
  }

  async fetchAllCreators(): Promise<User[]> {
    try {
      const creators = await this.userModel
        .find({ role: Role.SELLER })
        .lean()
        .select('-_id -__v -hashedPin -_2FAData');
      if (!creators) {
        throw new NotFoundException('No creator found');
      }

      return creators;
    } catch (error) {
      this.logger.error(`error fetching creators`, error);
      throw error;
    }
  }

  async fetchAllBuyers(): Promise<User[]> {
    try {
      const buyers = await this.userModel
        .find({ role: Role.BUYER })
        .lean()
        .select('-_id -__v -hashedPin -_2FAData');
      if (!buyers) {
        throw new NotFoundException('No buyer found');
      }

      return buyers;
    } catch (error) {
      this.logger.error(`error fetching buyers`, error);
      throw error;
    }
  }

  async fetchAllUsers(): Promise<User[]> {
    try {
      const users = await this.userModel
        .find()
        .lean()
        .select('-_id -__v -hashedPin -_2FAData');
      if (!users) {
        throw new NotFoundException('No user found');
      }

      return users;
    } catch (error) {
      this.logger.error(`error fetching users`, error);
      throw error;
    }
  }

  async updateUser(discordId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userModel
        .findOneAndUpdate(
          { discordId },
          {
            $set: updateUserDto,
            isUsingDiscordName: updateUserDto.displayName ? false : true,
          },
          { new: true, runValidators: true }, // ensure DTO validation runs
        )
        .select('-__v -hashedPin -_2FAData')
        .lean();

      if (!user) return null;

      return {
        message: 'User detail updated successfully',
        user,
      };
    } catch (error) {
      this.logger.error(
        `Error updating user with Discord ID ${discordId}`,
        error,
      );
      throw error;
    }
  }

  async UpdateUserDiscordDetails(user: DiscordUser): Promise<User> {
    try {
      const existingUser = await this.userModel.findOne({ discordId: user.id });

      if (!existingUser) {
        throw new Error(`User with discordId ${user.id} not found`);
      }

      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { discordId: user.id },
          {
            username: user.username,
            discordDisplayName: user.global_name,
            displayName: existingUser.isUsingDiscordName
              ? user.global_name
              : existingUser.displayName,
            discordAvatar: user.avatar,
            email: user.email,
          },
          { new: true },
        )
        .select('-__v -hashedPin -_2FAData')
        .lean();

      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user', error);
      throw error;
    }
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');
    console.log(user);
    if (user.profileImage?.public_id) {
      await this.fileUploaderService.deleteFile(
        user.profileImage.public_id,
        'image',
      );
    }
    const uploaded = await this.fileUploaderService.uploadImage(file);
    console.log(uploaded);

    await this.userModel
      .findOneAndUpdate(
        { discordId: userId },
        {
          profileImage: {
            url: uploaded.url,
            public_id: uploaded.public_id,
            uploadedAt: new Date(),
          },
        },
      )
      .lean();

    return {
      message: 'Profile picture uploaded successfully',
      data: uploaded,
    };
  }

  async uploadProfileBanner(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');
    if (user.profileBanner?.public_id) {
      await this.fileUploaderService.deleteFile(
        user.profileBanner.public_id,
        'image',
      );
    }
    const uploaded = await this.fileUploaderService.uploadImage(file);

    await this.userModel.findOneAndUpdate(
      { discordId: userId },
      {
        profileBanner: {
          url: uploaded.url,
          public_id: uploaded.public_id,
          uploadedAt: new Date(),
        },
      },
    );

    return {
      message: 'Profile Banner uploaded successfully',
      data: uploaded,
    };
  }

  async deleteProfilePicture(userId: string) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    const publicId = user.profileImage?.public_id;
    if (!publicId) throw new NotFoundException('No profile picture found');

    // Delete from Cloudinary
    await this.fileUploaderService.deleteFile(publicId, 'image');

    // Remove from DB
    user.profileImage = null;
    await user.save();

    return { message: 'Profile picture deleted successfully' };
  }

  async deleteProfileBanner(userId: string) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    const publicId = user.profileBanner?.public_id;
    if (!publicId) throw new NotFoundException('No profile banner found');

    // Delete from Cloudinary
    const deletedImage = await this.fileUploaderService.deleteFile(
      publicId,
      'image',
    );

    console.log(deletedImage);

    // Remove from DB
    user.profileBanner = null;
    await user.save();

    return { message: 'Profile Banner deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────
  // Follow
  // ─────────────────────────────────────────────────────────────

  async followUser(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const [user, target] = await Promise.all([
      this.userModel.findOne({ discordId: userId }),
      this.userModel.findOne({ discordId: targetId }),
    ]);

    if (!target) throw new NotFoundException('User not found');

    console.log(this.followModel);

    // Prevent duplicates
    const existing = await this.followModel.findOne({
      follower: user.id,
      following: target.id,
    });
    if (existing) throw new ConflictException('Already following');

    console.log('hereeee :', user.id, target.id);
    const follow = new this.followModel({
      follower: user.id,
      following: target.id,
    });
    await follow.save();

    await Promise.all([
      this.userModel.findByIdAndUpdate(target.id, {
        $inc: { followerCount: 1 },
      }),
      this.userModel.findByIdAndUpdate(user.id, {
        $inc: { followingCount: 1 },
      }),
    ]);

    //TODO:EMIT event to send notifications
    // this.eventEmitter.emit('user.followed', { userId, targetId });
    const inAppNotficationPayload: CreateNotificationDto = {
      user: target._id.toString(),
      sender: user._id.toString(),
      entityType: NotificationEntityType.Follow,
    };

    await this.notificationService.createInAppNotication(
      inAppNotficationPayload,
    );

    console.log(target);

    return { message: `Now following ${target.username}`, status: 'success' };
  }

  async unfollowUser(userId: string, targetId: string) {
    const [user, target] = await Promise.all([
      this.userModel.findOne({ discordId: userId }),
      this.userModel.findOne({ discordId: targetId }),
    ]);
    if (!target) throw new NotFoundException('User not found');
    const res = await this.followModel.deleteOne({
      follower: user.id,
      following: target.id,
    });
    if (res.deletedCount === 0) {
      throw new BadRequestException('You are not following this user');
    }

    await Promise.all([
      this.userModel.findByIdAndUpdate(target.id, {
        $inc: { followerCount: -1 },
      }),
      this.userModel.findByIdAndUpdate(user.id, {
        $inc: { followingCount: -1 },
      }),
    ]);
    return { message: 'Unfollowed successfully', status: 'success' };
  }

  async getFollowers(userId: string, limit = 50, skip = 0) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    const result = await this.followModel
      .find({ following: user.id })
      .skip(skip)
      .limit(limit)
      .select('-following')
      .populate(
        'follower',
        'id username displayName discordAvatar discordId role profileImage followerCount followingCount',
      )
      .lean();

    // transform follower → user
    return result.map((f) => ({
      user: f.follower,
    }));
  }

  async getFollowing(userId: string, limit = 50, skip = 0) {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    const result = await this.followModel
      .find({ follower: user.id })
      .skip(skip)
      .limit(limit)
      .select('-follower')
      .populate(
        'following',
        'id username displayName discordAvatar discordId role  profileImage followerCount followingCount',
      )
      .lean();

    // transform following → user
    return result.map((f) => ({
      user: f.following,
    }));
  }

  async isFollowing(userId: string, targetId: string): Promise<boolean> {
    const [user, target] = await Promise.all([
      this.userModel.findOne({ discordId: userId }),
      this.userModel.findOne({ discordId: targetId }),
    ]);
    if (!target) throw new NotFoundException('User not found');

    const exists = await this.followModel.findOne({
      follower: user.id,
      following: target.id,
    });
    return !!exists;
  }

  // ─────────────────────────────────────────────────────────────
  // Block user
  // ─────────────────────────────────────────────────────────────

  async blockUser(blockerDiscordId: string, blockedDiscordId: string) {
    if (blockerDiscordId === blockedDiscordId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const [blocker, blocked] = await Promise.all([
      this.userModel.findOne({ discordId: blockerDiscordId }),
      this.userModel.findOne({ discordId: blockedDiscordId }),
    ]);
    if (!blocker) throw new NotFoundException('User not found');
    if (!blocked) throw new NotFoundException('User not found');

    // Check if already blocked
    const existing = await this.blockModel.findOne({
      blocker: blocker._id.toString(),
      blocked: blocked._id.toString(),
    });

    if (existing) return existing;

    const block = await this.blockModel.create({
      blocker: blocker._id.toString(),
      blocked: blocked._id.toString(),
    });

    return block;
  }

  async unblockUser(blockerDiscordId: string, blockedDiscordId: string) {
    const [blocker, blocked] = await Promise.all([
      this.userModel.findOne({ discordId: blockerDiscordId }),
      this.userModel.findOne({ discordId: blockedDiscordId }),
    ]);
    if (!blocker) throw new NotFoundException('User not found');
    if (!blocked) throw new NotFoundException('User not found');

    const result = await this.blockModel.findOneAndDelete({
      blocker: blocker._id.toString(),
      blocked: blocked._id.toString(),
    });

    return result;
  }

  async getBlockedUsers(blockerDiscordId: string) {
    const blocker = await this.userModel.findOne({
      discordId: blockerDiscordId,
    });

    if (!blocker) throw new NotFoundException('User not found');

    return this.blockModel
      .find({ blocker: blocker._id.toString() })
      .populate(
        'blocked',
        'username displayName discordAvatar discordId role profileImage',
      )
      .select('blocked createdAt')
      .sort({ createdAt: -1 });
  }

  async getUsersWhoBlocked(blockedDiscordId: string) {
    const blocked = await this.userModel.findOne({
      discordId: blockedDiscordId,
    });

    if (!blocked) throw new NotFoundException('User not found');

    return this.blockModel
      .find({ blocked: blocked._id.toString() })
      .populate('blocker', 'username')
      .select('blocker createdAt');
  }

  async getBlockRelations(userId: string) {
    const blocks = await this.blockModel
      .find({
        $or: [{ blocker: userId }, { blocked: userId }],
      })
      .lean();

    const blockedUsers = blocks
      .filter((b) => b.blocker.toString() === userId)
      .map((b) => b.blocked.toString());

    const blockedByUsers = blocks
      .filter((b) => b.blocked.toString() === userId)
      .map((b) => b.blocker.toString());

    return { blockedUsers, blockedByUsers };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isDeleted) {
      throw new BadRequestException('Account already scheduled for deletion');
    }

    user.isArchived = true;
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    return {
      message:
        'Account scheduled for deletion. You can restore within 30 days.',
    };
  }

  async restoreAccount(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user || !user.isDeleted) {
      throw new BadRequestException('Account not eligible for restoration');
    }

    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (Date.now() - user.deletedAt.getTime() > THIRTY_DAYS) {
      throw new BadRequestException('Restoration period expired');
    }

    user.isArchived = false;
    user.isDeleted = false;
    user.deletedAt = null;

    await user.save();

    return { message: 'Account successfully restored' };
  }

  @Cron('0 0 * * *') // Runs daily at midnight
  async permanentlyDeleteUsers() {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const users = await this.userModel.find({
      isDeleted: true,
      deletedAt: { $lte: THIRTY_DAYS_AGO },
    });

    for (const user of users) {
      await this.userModel.findByIdAndDelete(user._id);
    }

    console.log(`Deleted ${users.length} users permanently`);

    //TODO: delete profile and banner images
  }
}

// async updateUser(discordId: string, updateUserDto: UpdateUserDto) {
//   try {
//     const user = await this.userModel.findOne({ discordId });
//     if (!user) return null;
//     Object.assign(user, updateUserDto);

//     await user.save();

//     return { message: 'user detail updated successfully', user };
//   } catch (error) {
//     this.logger.error(`error Updating user with discord ${discordId}`, error);
//     throw error;
//   }
// }

// async UpdateUserDiscordDetails(user: DiscordUser): Promise<User> {
//   try {
//     const updatedUser = await this.userModel
//       .findOneAndUpdate(
//         { discordId: user.id },
//         {
//           username: user.username,
//           displayName: user.global_name,
//           discordAvatar: user.avatar,
//           email: user.email,
//         },
//         { new: true },
//       )
//       .lean();

//     const safeUser = plainToInstance(UserResponseDto, updatedUser, {
//       excludeExtraneousValues: true,
//     });

//     console.log('updated user', safeUser);
//     return safeUser;
//   } catch (error) {
//     this.logger.error('Error creating user', error);
//     throw error;
//   }
// }
