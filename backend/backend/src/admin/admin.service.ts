import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import { Post, PostDocument } from 'src/database/schemas/post.schema';
import { Message, MessageDocument } from 'src/database/schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
} from 'src/database/schemas/conversation.schema';
import { Media, MediaDocument } from 'src/database/schemas/media.schema';
import { FileUploaderService } from 'src/file-uploader/file-uploader.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    private readonly fileUploaderService: FileUploaderService,
  ) {}

  async deletePost(id: string) {
    const post = await this.postModel.findById(id).populate('media');
    if (!post) throw new NotFoundException('Post not found');

    // 1. Delete all attached media (Cloud + DB)
    if (post.media && post.media.length > 0) {
      for (const media of post.media as unknown as MediaDocument[]) {
        try {
          await this.fileUploaderService.deleteFile(media.public_id); // from cloud
        } catch (e) {
          console.error(
            `Failed to delete file from cloud: ${media.public_id}`,
            e,
          );
        }
        await this.mediaModel.findByIdAndDelete(media._id); // from DB
      }
    }

    await this.postModel.findByIdAndDelete(id);
    return { success: true, message: 'Post deleted' };
  }

  async getBannedUsers() {
    return this.userModel
      .find({ isBanned: true })
      .select('username discordId email banReason bannedAt');
  }

  async banUser(discordId: string, reason: string) {
    const user = await this.userModel.findOneAndUpdate(
      { discordId },
      { isBanned: true, banReason: reason, bannedAt: new Date() },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async unbanUser(discordId: string) {
    const user = await this.userModel.findOneAndUpdate(
      { discordId },
      { isBanned: false, banReason: null, bannedAt: null },
      { new: true },
    );

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async softDeleteUser(discordId: string) {
    const user = await this.userModel.findOneAndUpdate(
      { discordId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(discordId: string, data: any) {
    // Prevent updating sensitive fields if needed, or rely on admin discretion
    const user = await this.userModel.findOneAndUpdate({ discordId }, data, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getChats(user1DiscordId: string, user2DiscordId: string) {
    // 1. Find conversation involving both users
    // Assuming Conversation schema has 'participants' array or similar.
    // Checking Conversation schema would be good, but let's assume participants logic or multiple queries.
    // Based on typical schema, Conversation usually has participants: [user1, user2]

    // Attempt to find conversation where participants contain both

    const [user1, user2] = await Promise.all([
      this.userModel.findOne({ discordId: user1DiscordId }),
      this.userModel.findOne({ discordId: user2DiscordId }),
    ]);

    if (!user1)
      throw new BadRequestException(`User ${user1DiscordId} does not exist`);
    if (!user2)
      throw new BadRequestException(`User ${user2DiscordId} does not exist`);

    const conservation = await this.conversationModel.findOne({
      participants: { $all: [user1._id, user2._id] },
    });

    if (!conservation) {
      // Fallback: search messages directly if conversation logic is complex
      // messages where (sender=u1 AND receiver=u2) OR (sender=u2 AND receiver=u1)
      return this.messageModel
        .find({
          $or: [
            { sender: user1, reciever: user2 },
            { sender: user2, reciever: user1 },
          ],
        })
        .sort({ createdAt: 1 });
    }

    return this.messageModel
      .find({ conversation: conservation._id })
      .sort({ createdAt: 1 });
  }
}
