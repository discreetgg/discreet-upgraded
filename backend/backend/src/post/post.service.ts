import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Comment } from 'src/database/schemas/comment.schema';
import { Post, Visibility } from 'src/database/schemas/post.schema';
import { SubscriptionPlan } from 'src/database/schemas/subscription-plan.schema';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import { FileUploaderService } from 'src/file-uploader/file-uploader.service';
import { CreatePostDto, MediaMetaDto } from './dto/create-post.dto';
import { Media, MediaDocument } from 'src/database/schemas/media.schema';
import { UpdateMediaMetaDto, UpdatePostDto } from './dto/update-post.dts';
import { CreateLikeDto } from './dto/create-like.dto';
import { Like } from 'src/database/schemas/like.schema';
import { UserSubscription } from 'src/database/schemas/user-subscription.schema';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { PostCategory } from 'src/database/schemas/post-categories.schema';
import { CreatePostCategoryDto } from './dto/creator-post-category';
import { Bookmark } from 'src/database/schemas/bookmark.schema';
import {
  CreateNotificationDto,
  NotificationEntityType,
} from 'src/notification/dto/in-app-notification.dto';
import { NotificationService } from 'src/notification/notification.service';
import { UserService } from 'src/user/user.service';
import { Category } from 'src/database/schemas/category.schema';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';

@Injectable()
export class PostService {
  private logger = new Logger(PostService.name);

  constructor(
    private readonly fileUploaderService: FileUploaderService,
    private readonly subscriptionService: SubscriptionService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(Like.name) private readonly likeModel: Model<Like>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<Bookmark>,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlan>,
    @InjectModel(UserSubscription.name)
    private readonly userSubscriptionModel: Model<UserSubscription>,
    @InjectModel(PostCategory.name)
    private readonly postCategoryModel: Model<PostCategory>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // POSTS
  // ─────────────────────────────────────────────────────────────

  // async createPost(
  //   userId: string,
  //   dto: CreatePostDto,
  //   files: Express.Multer.File[] = [],
  //   mediaMeta: MediaMetaDto[] = [],
  // ): Promise<Post> {
  //   try {
  //     let finalPost: Post;
  //     const user = await this.userModel.findOne({ discordId: userId });
  //     if (!user) throw new NotFoundException('User not found');

  //     if (!dto.content && files.length === 0) {
  //       throw new BadRequestException('Post must have content or media');
  //     }

  //     // Validate visibleToPlan if provided
  //     if (dto.visibleToPlan) {
  //       const plan = await this.subscriptionPlanModel.findOne({
  //         _id: dto.visibleToPlan,
  //         creator: user._id,
  //       });
  //       if (!plan) throw new BadRequestException('Subscription plan not found');
  //     }

  //     const post = await new this.postModel({
  //       ...dto,
  //       author: user.id,
  //     }).save();

  //     if (
  //       files.length > 0 &&
  //       mediaMeta.length > 0 &&
  //       files.length !== mediaMeta.length
  //     ) {
  //       throw new BadRequestException(
  //         'Each file must have a corresponding mediaMeta entry',
  //       );
  //     }

  //     const uploadedMedia = [];

  //     if (files.length > 0) {
  //       for (let i = 0; i < files.length; i++) {
  //         const file = files[i];
  //         const meta = (mediaMeta && mediaMeta[i]) || {};
  //         let upload;

  //         console.log(meta);
  //         if (meta.type === 'image') {
  //           upload = await this.fileUploaderService.uploadImage(file);
  //         } else if (meta.type === 'video') {
  //           upload = await this.fileUploaderService.uploadVideo(file);
  //         } else {
  //           throw new BadRequestException(`Unknown media type at index ${i}`);
  //         }

  //         const savedMedia = await new this.mediaModel({
  //           url: upload.url,
  //           public_id: upload.public_id,
  //           type: meta.type,
  //           caption: meta.caption || '',
  //           uploadedAt: new Date(),
  //           post: post.id,
  //           owner: user.id,
  //         }).save();

  //         uploadedMedia.push(savedMedia.id);
  //       }

  //       finalPost = await this.postModel
  //         .findByIdAndUpdate(
  //           post.id,
  //           {
  //             media: [...uploadedMedia],
  //           },
  //           { new: true },
  //         )
  //         .populate('media')
  //         .populate({
  //           path: 'author',
  //           select:
  //             'id discordId username displayName discordAvatar role profileImage',
  //         })
  //         .lean();
  //     }

  //     console.log(finalPost);
  //     return finalPost;
  //   } catch (error) {
  //     this.logger.error(error);
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new BadRequestException('Failed to create Post');
  //   }
  // }

  async createPost(
    userId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[] = [],
    mediaMeta: MediaMetaDto[] = [],
  ): Promise<Post> {
    const session = await this.connection.startSession();
    session.startTransaction();

    // Keep track of successfully uploaded files for cleanup if needed
    const uploadedFiles: { public_id: string }[] = [];

    try {
      const user = await this.userModel
        .findOne({ discordId: userId })
        .session(session);
      if (!user) throw new NotFoundException('User not found');

      if (dto.category) {
        const category = await this.categoryModel.findById(dto.category);
        if (!category)
          throw new NotFoundException('Menu Category does not exist');
      }

      if (!dto.content && files.length === 0) {
        throw new BadRequestException('Post must have content or media');
      }

      // Validate visibleToPlan if provided
      if (dto.visibleToPlan) {
        const plan = await this.subscriptionPlanModel
          .findOne({
            _id: dto.visibleToPlan,
            creator: user._id,
          })
          .session(session);
        if (!plan) throw new BadRequestException('Subscription plan not found');
      }

      // Step 1: create post (inside transaction)
      const post = await new this.postModel({
        ...dto,
        author: user.id,
      }).save({ session });

      // Step 2: handle media uploads if provided
      if (
        files.length > 0 &&
        mediaMeta.length > 0 &&
        files.length !== mediaMeta.length
      ) {
        throw new BadRequestException(
          'Each file must have a corresponding mediaMeta entry',
        );
      }

      if (files.length > 0) {
        const uploadedMedia = await Promise.all(
          files.map(async (file, i) => {
            const meta = mediaMeta?.[i] || {};

            try {
              let upload;
              if (meta.type === 'image') {
                upload = await this.fileUploaderService.uploadImage(file);
              } else if (meta.type === 'video') {
                upload = await this.fileUploaderService.uploadVideo(file);
              } else {
                throw new BadRequestException(
                  `Unknown media type at index ${i}`,
                );
              }

              // Track upload for cleanup if DB fails later
              uploadedFiles.push({ public_id: upload.public_id });

              const savedMedia = await new this.mediaModel({
                url: upload.url,
                public_id: upload.public_id,
                type: meta.type,
                caption: meta.caption || '',
                uploadedAt: new Date(),
                post: post.id,
                owner: user.id,
              }).save({ session });

              return savedMedia.id;
            } catch (err) {
              throw new BadRequestException(
                `Failed to upload media at index ${i}: ${err.message || err}`,
              );
            }
          }),
        );

        await this.postModel.findByIdAndUpdate(
          post.id,
          { media: uploadedMedia },
          { session },
        );
      }

      // Step 3: commit transaction
      await session.commitTransaction();
      session.endSession();

      // Step 4: return the final populated post
      const finalPost = await this.postModel
        .findById(post.id)
        .populate('media')
        .populate({
          path: 'author',
          select:
            'id discordId username displayName discordAvatar role profileImage',
        })
        .lean();

      return finalPost;
    } catch (error) {
      // Rollback DB
      await session.abortTransaction();
      session.endSession();

      // Cleanup orphaned uploads if DB failed after upload
      if (uploadedFiles.length > 0) {
        try {
          await Promise.all(
            uploadedFiles.map((f) =>
              this.fileUploaderService.deleteFile(f.public_id),
            ),
          );
          this.logger.warn(
            `Rolled back and cleaned up ${uploadedFiles.length} orphaned files.`,
          );
        } catch (cleanupErr) {
          this.logger.error('Failed to cleanup orphaned uploads', cleanupErr);
        }
      }

      this.logger.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to create Post');
    }
  }

  async updatePostWithoutMedia(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<Post> {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    if (dto.category) {
      const category = await this.categoryModel.findById(dto.category);
      if (!category)
        throw new NotFoundException('Menu Category does not exist');
    }

    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== user.id) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    // Validate visibleToPlan if provided
    if (dto.visibleToPlan) {
      const plan = await this.subscriptionPlanModel.findById(dto.visibleToPlan);
      if (!plan) throw new BadRequestException('Subscription plan not found');
      return;
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(postId, { $set: dto }, { new: true })
      .populate('media')
      .populate({
        path: 'author',
        select: 'id discordId username displayName discordAvatar role',
      })
      .lean();

    console.log(updatedPost);
    return updatedPost;
  }

  async updatePostWithMedia(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
    files: Express.Multer.File[] = [],
    mediaMeta: UpdateMediaMetaDto[] = [],
  ): Promise<Post> {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new NotFoundException('User not found');

    if (dto.category) {
      const category = await this.categoryModel.findById(dto.category);
      if (!category)
        throw new NotFoundException('Menu Category does not exist');
    }

    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    // Validate visibleToPlan if provided
    if (dto.visibleToPlan) {
      const plan = await this.subscriptionPlanModel.findById(dto.visibleToPlan);
      if (!plan) throw new BadRequestException('Subscription plan not found');
      return;
    }

    const uploadedMedia = [];

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const meta = (mediaMeta && mediaMeta[i]) || {};
        let upload;

        if (meta.type === 'image') {
          upload = await this.fileUploaderService.uploadImage(file);
        } else if (meta.type === 'video') {
          upload = await this.fileUploaderService.uploadVideo(file);
        } else {
          throw new BadRequestException(`Unknown media type at index ${i}`);
        }

        if (meta.updateMediaId) {
          const media = await this.mediaModel.findById(meta.updateMediaId);
          if (media) {
            await this.fileUploaderService.deleteFile(media.public_id);
            media.url = upload.url;
            media.public_id = upload.public_id;
            media.type = meta.type;
            media.uploadedAt = new Date();
            media.caption = meta.caption || '';

            await media.save();
          }
        } else {
          const savedMedia = await new this.mediaModel({
            url: upload.url,
            public_id: upload.public_id,
            type: meta.type,
            caption: meta.caption || '',
            uploadedAt: new Date(),
            post: postId,
            owner: user._id,
          }).save();

          uploadedMedia.push(savedMedia.id);
        }
      }
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(
        postId,
        {
          $set: {
            ...dto,
          },
          $addToSet: {
            media: {
              $each: [...uploadedMedia],
            },
          },
        },
        { new: true },
      )
      .populate('media')
      .populate({
        path: 'author',
        select:
          'id discordId username displayName discordAvatar role  profileImage',
      })
      .lean();

    return updatedPost;
  }

  async deletePost(
    discordId: string,
    postId: string,
  ): Promise<{ deleted: boolean }> {
    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.postModel.findById(postId).populate('media').exec();
    if (!post) throw new NotFoundException('Post not found');

    if (post.author.toString() !== user._id.toString()) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    // 1. Delete all attached media (Cloud + DB)
    if (post.media && post.media.length > 0) {
      for (const media of post.media as unknown as MediaDocument[]) {
        await this.fileUploaderService.deleteFile(media.public_id); // from cloud
        await this.mediaModel.findByIdAndDelete(media._id); // from DB
      }
    }

    // 2. Delete all comments associated with the post
    await this.commentModel.deleteMany({ post: postId });

    // 3. Delete the post itself
    await this.postModel.findByIdAndDelete(postId);

    return { deleted: true };
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select:
          'id discordId username displayName discordAvatar role  profileImage',
      })
      .lean();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likes = await this.likeModel
      .find({
        targetId: post._id,
        targetType: 'Post',
      })
      .populate(
        'user',
        'id username displayName discordAvatar discordId role  profileImage',
      );

    const likedBy = likes.map((like) => like.user);
    post['likedBy'] = likedBy;

    return post;
  }

  async getPostsByUser(discordId: string): Promise<Post[]> {
    const user = await this.userModel.findOne({ discordId }).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const posts = await this.postModel
      .find({ author: user._id })
      .populate('visibleToPlan')
      .populate('media')
      .lean()
      .sort({ createdAt: -1 });

    return posts.map((post) => ({
      ...post,
      author: user,
    }));
  }

  async getPostsByPlan(planId: string): Promise<Post[]> {
    const posts = await this.postModel
      .find({ visibleToPlan: planId })
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select:
          'id discordId username displayName discordAvatar role  profileImage',
      })
      .lean()
      .sort({ createdAt: -1 });

    // Populate author manually

    return posts.map((post) => ({
      ...post,
    }));
  }

  async getAllPosts(visibility?: Visibility): Promise<Post[]> {
    const query = visibility ? { visibility } : {};

    const posts = await this.postModel
      .find(query)
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select:
          'id discordId username displayName discordAvatar role  profileImage',
      })
      .lean()
      .sort({ createdAt: -1 });

    return posts.map((post) => ({
      ...post,
    }));
  }

  async getTrendingPosts(limit = 20): Promise<any[]> {
    return this.postModel
      .find({ isDraft: false })
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select:
          'id discordId username displayName discordAvatar role  profileImage',
      })
      .sort({ likesCount: -1 })
      .limit(limit);
  }

  async getRecentPosts(limit = 20): Promise<any[]> {
    return this.postModel
      .find({ isDraft: false })
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select: 'id discordId username displayName discordAvatar role',
      })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getPostsByCategory(category: string, limit = 20): Promise<any[]> {
    return this.postModel
      .find({ category: category, isDraft: false })
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select: 'id discordId username displayName discordAvatar role',
      })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getPaginatedPosts(page = 1, limit = 20): Promise<any[]> {
    const skip = (page - 1) * limit;
    return this.postModel
      .find({ isDraft: false })
      .populate('visibleToPlan')
      .populate('media')
      .populate({
        path: 'author',
        select: 'id discordId username displayName discordAvatar role',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getVisiblePostsForUser(discordId: string): Promise<Post[]> {
    const conditions: any[] = [{ visibility: Visibility.GENERAL }];

    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');

    // Get all user's active subscriptions
    const allUserActiveSubscription = await this.userSubscriptionModel.find({
      user: user._id,
      isActive: true,
    });

    // Subscribed to creators (for "SUBSCRIBERS" posts)
    const creatorsSubscribedTo =
      await this.subscriptionService.getCreatorsSubscribedTo(user.discordId);

    const creatorsSubscribedToIds = creatorsSubscribedTo.map((creator) =>
      creator.creator._id.toString(),
    );

    if (creatorsSubscribedToIds.length > 0) {
      console.log('here');
      conditions.push({
        visibility: Visibility.PAID_MEMBERS,
        author: { $in: creatorsSubscribedToIds },
      });
    }

    // Custom Plan access
    const userPlanIds = allUserActiveSubscription.map((sub) =>
      sub.plan.toString(),
    );
    if (userPlanIds.length > 0) {
      conditions.push({
        visibility: Visibility.CUSTOM_PLAN,
        visibleToPlan: { $in: userPlanIds },
      });
    }

    // Include user's own posts
    conditions.push({ author: user._id.toString() });

    console.log(conditions);

    return this.postModel
      .find({ $or: conditions })
      .sort({ createdAt: -1 })
      .populate('author', 'discordId id username displayName discordAvatar')
      .populate('media')
      .populate('visibleToPlan');
  }

  // async getRecentFeedForUser(discordId: string, limit = 10): Promise<Post[]> {
  //   const conditions: any[] = [{ visibility: Visibility.GENERAL }];

  //   const user = await this.userModel.findOne({ discordId });
  //   if (!user) throw new NotFoundException('User not found');

  //   const allUserActiveSubscription = await this.userSubscriptionModel.find({
  //     user: user._id,
  //     isActive: true,
  //   });

  //   const creatorsSubscribedTo =
  //     await this.subscriptionService.getCreatorsSubscribedTo(user.discordId);

  //   const creatorsSubscribedToIds = creatorsSubscribedTo.map((creator) =>
  //     creator.creator._id.toString(),
  //   );

  //   if (creatorsSubscribedToIds.length > 0) {
  //     conditions.push({
  //       visibility: Visibility.PAID_MEMBERS,
  //       author: { $in: creatorsSubscribedToIds },
  //     });
  //   }

  //   const userPlanIds = allUserActiveSubscription.map((sub) =>
  //     sub.plan.toString(),
  //   );

  //   if (userPlanIds.length > 0) {
  //     conditions.push({
  //       visibility: Visibility.CUSTOM_PLAN,
  //       visibleToPlan: { $in: userPlanIds },
  //     });
  //   }

  //   // Include user's own posts
  //   conditions.push({ author: user._id.toString() });

  //   return this.postModel
  //     .find({ $or: conditions })
  //     .sort({ createdAt: -1 }) // recent first
  //     .limit(limit)
  //     .populate('author', 'discordId id username displayName discordAvatar')
  //     .populate('media')
  //     .populate('visibleToPlan')
  //     .lean()
  //     .exec();
  // }

  async getRecentFeedForUser(discordId: string, limit = 10): Promise<Post[]> {
    const user = await this.userModel.findOne({ discordId }).lean();
    if (!user) throw new NotFoundException('User not found');

    // Get block relations
    const { blockedUsers, blockedByUsers } =
      await this.userService.getBlockRelations(user._id.toString());

    const excluded = [...blockedUsers, ...blockedByUsers];

    // Prepare OR conditions
    const conditions: any[] = [];

    //
    // 1. GENERAL posts (exclude blocked)
    //
    conditions.push({
      visibility: Visibility.GENERAL,
      author: { $nin: excluded },
    });

    //
    // 2. POSTS visible to subscribed creators
    //
    const creatorsSubscribedTo =
      await this.subscriptionService.getCreatorsSubscribedTo(discordId);

    const creatorsSubscribedToIds = creatorsSubscribedTo.map((c) =>
      c.creator._id.toString(),
    );

    if (creatorsSubscribedToIds.length > 0) {
      conditions.push({
        visibility: Visibility.PAID_MEMBERS,
        author: { $in: creatorsSubscribedToIds, $nin: excluded },
      });
    }

    //
    // 3. CUSTOM PLAN posts the user has access to
    //
    const allUserActiveSubscription = await this.userSubscriptionModel
      .find({ user: user._id, isActive: true })
      .lean();

    const userPlanIds = allUserActiveSubscription.map((sub) =>
      sub.plan.toString(),
    );

    if (userPlanIds.length > 0) {
      conditions.push({
        visibility: Visibility.CUSTOM_PLAN,
        visibleToPlan: { $in: userPlanIds },
        author: { $nin: excluded },
      });
    }

    //
    // 4. Always include user’s own posts
    //
    conditions.push({ author: user._id.toString() });

    //
    // FINAL FETCH
    //
    return this.postModel
      .find({ $or: conditions })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'discordId id username displayName discordAvatar')
      .populate('media')
      .populate('visibleToPlan')
      .lean()
      .exec();
  }

  async getFilteredPostsForUser(
    discordId: string,
    filter:
      | 'general'
      | 'subscribers'
      | 'custom_plan'
      | 'personal'
      | 'all' = 'all',
  ): Promise<Post[]> {
    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');

    const conditions: any[] = [];

    // GENERAL
    if (filter === 'general' || filter === 'all') {
      conditions.push({ visibility: Visibility.GENERAL });
    }

    // Get active subscriptions if needed
    let allUserActiveSubscription = [];
    if (
      filter === 'subscribers' ||
      filter === 'custom_plan' ||
      filter === 'all'
    ) {
      allUserActiveSubscription = await this.userSubscriptionModel.find({
        user: user._id,
        isActive: true,
      });
    }

    // SUBSCRIBERS
    if (filter === 'subscribers' || filter === 'all') {
      const creatorsSubscribedTo =
        await this.subscriptionService.getCreatorsSubscribedTo(user.discordId);

      const creatorsSubscribedToIds = creatorsSubscribedTo.map((c) =>
        c.creator._id.toString(),
      );

      if (creatorsSubscribedToIds.length > 0) {
        conditions.push({
          visibility: Visibility.PAID_MEMBERS,
          author: { $in: creatorsSubscribedToIds },
        });
      }
    }

    // CUSTOM PLAN
    if (filter === 'custom_plan' || filter === 'all') {
      const userPlanIds = allUserActiveSubscription.map((sub) =>
        sub.plan.toString(),
      );

      if (userPlanIds.length > 0) {
        conditions.push({
          visibility: Visibility.CUSTOM_PLAN,
          visibleToPlan: { $in: userPlanIds },
        });
      }
    }

    // PERSONAL
    if (filter === 'personal' || filter === 'all') {
      conditions.push({ author: user._id.toString() });
    }

    // Fallback: avoid empty $or if no conditions
    if (conditions.length === 0) return [];

    return this.postModel
      .find({ $or: conditions })
      .sort({ createdAt: -1 })
      .populate(
        'author',
        'id discordId username displayName discordAvatar profileImage',
      )
      .populate('media')
      .populate('visibleToPlan');
  }

  async getPostMediaByUser(discordId: string): Promise<any[]> {
    const user = await this.userModel.findOne({ discordId }).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const medias = await this.mediaModel
      .find({ owner: user._id, post: { $exists: true, $ne: null } })
      .lean()
      .sort({ createdAt: -1 });

    return medias.map((media) => ({
      id: media._id,
      mediaUrl: media.url,
      type: media.type,
      postId: media.post,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // LIKES
  // ─────────────────────────────────────────────────────────────

  async likeTarget(userId: string, dto: CreateLikeDto): Promise<any> {
    const { targetId, targetType } = dto;

    // Dynamically resolve the correct model based on targetType
    const targetModels: Record<string, Model<any>> = {
      Post: this.postModel,
      Comment: this.commentModel,
      // Future: Reply, Story, etc.
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

    // Prevent duplicate like (enforced also by unique index)
    const exists = await this.likeModel.findOne({
      user: userId,
      targetId,
      targetType,
    });

    if (exists) {
      throw new ConflictException('You already liked this item');
    }

    // Create like
    const like = await this.likeModel.create({
      user: userId,
      targetId,
      targetType,
    });

    // Increment likes count on the target
    if (targetType !== 'Server') {
      const likedTarget = await targetModel
        .findByIdAndUpdate(
          targetId,
          {
            $inc: { likesCount: 1 },
          },
          { new: true },
        )
        .select('author');

      const inAppNotficationPayload: CreateNotificationDto = {
        user: likedTarget.author.toString(),
        sender: userId,
        entityType: NotificationEntityType.Like,
        entityId: likedTarget._id.toString(),
        metadata:
          targetType === 'Post'
            ? { post: likedTarget._id.toString() }
            : { comment: likedTarget._id.toString() },
      };

      await this.notificationService.createInAppNotication(
        inAppNotficationPayload,
      );
    } else {
      await targetModel.findByIdAndUpdate(
        targetId,
        {
          $inc: { likesCount: 1 },
        },
        { new: true },
      );
    }

    // Return structured response
    return {
      status: 'successful',
      like,
    };
  }

  async unlikeTarget(userId: string, dto: CreateLikeDto): Promise<any> {
    const { targetId, targetType } = dto;

    // Dynamically resolve the correct model based on targetType
    const targetModels: Record<string, Model<any>> = {
      Post: this.postModel,
      Comment: this.commentModel,
      // Future: Reply, Story, etc.
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
    targetType: 'Post' | 'Comment',
  ): Promise<boolean> {
    const userLiked = await this.likeModel.exists({
      user: userId,
      targetId,
      targetType,
    });
    if (!userLiked) return false;
    return true;
  }

  async getUsersWhoLikedPost(postId: string): Promise<any[]> {
    const likes = await this.likeModel.find({
      targetId: postId,
      targetType: 'Post',
    });

    const userIds = likes.map((like) => like.user);

    const users = await this.userModel.find(
      { _id: { $in: userIds } },
      'username displayName  discordAvatar discordId role', // projection
    );

    return users;
  }

  async getPostsLikedByUser(userId: string): Promise<any[]> {
    const likes = await this.likeModel
      .find({ user: userId, targetType: 'Post' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'targetId',
        model: 'Post',
        populate: [
          {
            path: 'author',
            select: 'id discordId username displayName discordAvatar role',
          },
          { path: 'media' },
        ],
      });

    // Extract just the populated Post documents
    const likedPosts = likes
      .map((like) => like.targetId)
      .filter((post) => post !== null); // In case some posts were deleted

    return likedPosts;
  }

  // ─────────────────────────────────────────────────────────────
  // COMMENTS
  // ─────────────────────────────────────────────────────────────

  async createComment(
    authorId: string,
    postId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<Comment> {
    const comment = await this.commentModel.create({
      author: authorId,
      post: postId,
      content,
      parentComment: parentCommentId ?? null,
    });

    let postOrCommentAuthor;
    let entityId;
    let metadata;
    // Update comment/reply count
    if (parentCommentId) {
      // This is a reply to another comment
      const parentComment = await this.commentModel
        .findByIdAndUpdate(
          parentCommentId,
          {
            $inc: { commentsCount: 1 },
          },
          { new: true },
        )
        .select('author');

      postOrCommentAuthor = parentComment.author;
      entityId = parentComment._id.toString();
      metadata = { comment: parentComment._id.toString(), post: postId };
    } else {
      // This is a direct comment on the post
      const post = await this.postModel
        .findByIdAndUpdate(
          postId,
          {
            $inc: { commentsCount: 1 },
          },
          { new: true },
        )
        .select('author');

      postOrCommentAuthor = post.author;
      entityId = post._id.toString();
      metadata = { post: postId };
    }
    await comment.populate(
      'author',
      'discordId username displayName discordAvatar profileImage',
    );

    const inAppNotficationPayload: CreateNotificationDto = {
      user: postOrCommentAuthor.toString(),
      sender: authorId,
      entityType: NotificationEntityType.Comment,
      entityId,
      metadata,
    };

    await this.notificationService.createInAppNotication(
      inAppNotficationPayload,
    );
    return comment;
  }

  async updateComment(commentId: string, authorId: string, content: string) {
    const comment = await this.commentModel.findOne({
      _id: commentId,
      author: authorId,
    });

    if (!comment)
      throw new NotFoundException('Comment not found or not owned by user');

    comment.content = content;
    return await comment.save();
  }

  async deleteComment(commentId: string, authorId: string) {
    const comment = await this.commentModel.findOne({
      _id: commentId,
      author: authorId,
    });

    if (!comment)
      throw new NotFoundException('Comment not found or not owned by user');

    await this.commentModel.findByIdAndDelete(commentId);

    // Decrement counts
    if (comment.parentComment) {
      await this.commentModel.findByIdAndUpdate(comment.parentComment, {
        $inc: { commentsCount: -1 },
      });
    } else {
      await this.postModel.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 },
      });
    }

    return { deleted: true };
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    const comments = await this.commentModel
      .find({
        post: postId,
        parentComment: null, // only top-level comments
      })
      .sort({ createdAt: -1 })
      .populate(
        'author',
        'discordId username displayName discordAvatar profileImage',
      )
      .lean()
      .select('-__v')
      .exec();

    return comments;
  }

  async getReplies(commentId: string): Promise<Comment[]> {
    return await this.commentModel
      .find({ parentComment: commentId })
      .sort({ createdAt: 1 }) // oldest first; change to -1 for newest first
      .populate(
        'author',
        'discordId username displayName discordAvatar profileImage',
      )
      .lean()
      .exec();
  }

  // ─────────────────────────────────────────────────────────────
  // POST CATEGORIES
  // ─────────────────────────────────────────────────────────────

  // Create category
  async createCategory(dto: CreatePostCategoryDto): Promise<PostCategory> {
    let creator: UserDocument | null;
    if (!dto.general && !dto.creator) {
      throw new Error(
        'Creator ID must be provided for non-general categories.',
      );
    }
    if (dto.creator) {
      creator = await this.userModel.findOne({ discordId: dto.creator });
      if (!creator) {
        throw new NotFoundException('Creator not found');
      }
    }

    const category = new this.postCategoryModel({
      general: dto.general || false,
      categories: dto.categories,
      creator: dto.creator ? creator._id : null,
    });

    return category.save();
  }

  // Fetch all general categories
  async getGeneralCategories(): Promise<PostCategory[]> {
    console.log('ere');
    return this.postCategoryModel.find({ general: true }).exec();
  }

  // Fetch categories for a particular creator
  async getCreatorCategories(creatorId: string): Promise<PostCategory[]> {
    return this.postCategoryModel.find({ creator: creatorId }).exec();
  }

  // Delete a category by ID
  async deleteCategory(categoryId: string): Promise<void> {
    const result = await this.postCategoryModel
      .findByIdAndDelete(categoryId)
      .exec();
    if (!result) throw new NotFoundException('Category not found');
  }

  // views
  async increasePostView(postId: string): Promise<any> {
    // Increment likes count on the target
    return await this.postModel.findByIdAndUpdate(
      postId,
      {
        $inc: { viewCount: 1 },
      },
      { new: true },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BOOKMARKS
  // ─────────────────────────────────────────────────────────────

  async addBookmark(userId: string, postId: string) {
    const [user, post] = await Promise.all([
      this.userModel.findOne({ discordId: userId }),
      this.postModel.findById(postId),
    ]);

    if (!user) throw new BadRequestException('User does not exist');
    if (!post) throw new BadRequestException('Post does not exist');

    try {
      const bookmark = await this.bookmarkModel.create({
        user: user._id.toString(),
        post: post._id.toString(),
      });

      // Increase bookmark count
      await this.postModel.updateOne(
        { _id: postId },
        { $inc: { bookmarksCount: 1 } },
      );

      return bookmark;
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('Post already bookmarked');
      }
      throw err;
    }
  }

  async removeBookmark(userId: string, postId: string) {
    const [user, post] = await Promise.all([
      this.userModel.findOne({ discordId: userId }),
      this.postModel.findById(postId),
    ]);

    if (!user) throw new BadRequestException('User does not exist');
    if (!post) throw new BadRequestException('Post does not exist');

    const deleted = await this.bookmarkModel.findOneAndDelete({
      user: user._id.toString(),
      post: post._id.toString(),
    });

    if (!deleted) throw new NotFoundException('Bookmark not found');
    // Decrease bookmark count
    await this.postModel.updateOne(
      { _id: postId },
      { $inc: { bookmarksCount: -1 } },
    );

    return { message: 'Bookmark removed' };
  }

  async hasUserBookmarked(userId: string, postId: string): Promise<boolean> {
    const user = await this.userModel.findOne({ discordId: userId });

    if (!user) throw new BadRequestException('User does not exist');

    const userBookmarked = await this.bookmarkModel.exists({
      user: user._id.toString(),
      post: postId,
    });
    if (!userBookmarked) return false;
    return true;
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    const user = await this.userModel.findOne({ discordId: userId });
    if (!user) throw new BadRequestException('User does not exist');

    return this.bookmarkModel
      .find({ user: user._id })
      .populate({
        path: 'post',
        select:
          'title content author media visibility visibleToPlan priceToView bookmarksCount likesCount commentsCount viewCount createdAt',
        populate: [
          {
            path: 'author',
            select:
              'id discordId username displayName discordAvatar role profileImage',
          },
          {
            path: 'media',
          },
          {
            path: 'visibleToPlan',
            select: 'name description price type benefits',
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ─────────────────────────────────────────────────────────────
  // Post stats
  // ─────────────────────────────────────────────────────────────

  async getPostStats(
    postId: string,
    month?: number,
    year?: number,
  ): Promise<any> {
    const post = await this.postModel
      .findById(postId)
      .populate('media')
      .lean()
      .sort({ createdAt: -1 });
    if (!post) throw new BadRequestException('Post not found');

    let dateFilter = {};
    if ((month && !year) || (!month && year)) {
      throw new BadRequestException('Month and year must be provided together');
    }

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      dateFilter = { createdAt: { $gte: start, $lt: end } };
    }

    const tips = await this.paymentModel.aggregate([
      {
        $match: {
          type: PaymentType.TIP,
          status: PaymentStatus.COMPLETED,
          'meta.post': postId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          tipsCount: { $sum: 1 },
        },
      },
    ]);

    const tipStats = tips[0] || { totalAmount: 0, tipsCount: 0 };

    return {
      post,
      title: post.title,
      views: post.viewCount ?? 0,
      likes: post.likesCount,
      comments: post.commentsCount,
      tipsCount: tipStats.tipsCount,
      totalEarnings: tipStats.totalAmount,
      monthFilter: month ? { month, year } : null,
    };
  }

  async getCreatorPostsStats(creatorId: string, month?: number, year?: number) {
    const seller = await this.userModel.findOne({ discordId: creatorId });
    if (!seller) throw new BadRequestException('Seller does not exist');

    let dateFilter = {};
    if ((month && !year) || (!month && year)) {
      throw new BadRequestException('Month and year must be provided together');
    }

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      dateFilter = { createdAt: { $gte: start, $lt: end } };
    }

    // const posts = await this.postModel.find({ author: seller._id }).lean();

    // const results = [];
    // for (const post of posts) {
    //   const stats = await this.getPostStats(post._id.toString(), month, year);
    //   results.push(stats);
    // }

    const posts = await this.postModel
      .find({
        author: seller._id,
        ...dateFilter,
      })
      .lean();

    const results = await Promise.all(
      posts.map((post) => this.getPostStats(post._id.toString(), month, year)),
    );

    return {
      seller: seller._id.toString(),
      totalPosts: posts.length,
      posts: results,
      totalEarnings: results.reduce((sum, p) => sum + p.totalEarnings, 0),
      totalViews: results.reduce((sum, p) => sum + p.views, 0),
      totalLikes: results.reduce((sum, p) => sum + p.likes, 0),
      totalComments: results.reduce((sum, p) => sum + p.comments, 0),
    };
  }
}

// async getPostWithLikers(postId: string): Promise<any> {
//   const post = await this.postModel.findById(postId);
//   if (!post) throw new NotFoundException('Post not found');

//   const likes = await this.likeModel.find({
//     targetId: postId,
//     targetType: 'Post',
//   });
//   const userIds = likes.map((like) => like.user); // assumes `user` is a Discord ID string

//   const users = await this.userModel.find(
//     { discordId: { $in: userIds } },
//     'username displayName  discordAvatar discordId', // projection
//   );

//   return {
//     post,
//     likedBy: users,
//   };
// }

// async likePostOrComment(userId: string, dto: CreateLikeDto): Promise<any> {
//   const { targetId, targetType } = dto;

//   // Validate target existence
//   const targetModel: Model<any> =
//     targetType === 'Post' ? this.postModel : this.commentModel;

//   const target = await targetModel.findById(targetId);
//   if (!target) {
//     throw new NotFoundException(`${targetType} not found`);
//   }

//   // Prevent duplicate like (handled also by unique index)
//   const exists = await this.likeModel.findOne({
//     user: userId,
//     targetId,
//     targetType,
//   });

//   if (exists) {
//     throw new ConflictException('You already liked this item');
//   }

//   // Create like
//   const like = await this.likeModel.create({
//     user: userId,
//     targetId,
//     targetType,
//   });

//   if (targetType === 'Post') {
//     await this.postModel.findByIdAndUpdate(targetId, {
//       $inc: { likesCount: 1 },
//     });
//   } else {
//     await this.commentModel.findByIdAndUpdate(targetId, {
//       $inc: { likesCount: 1 },
//     });
//   }

//   // Return structured response
//   return {
//     status: 'successful',
//     like,
//   };
// }

// async getPostsByUser(discordId: string): Promise<Post[]> {
//   const user = await this.userModel.findOne({ discordId }).lean();
//   if (!user) {
//     throw new NotFoundException('User not found');
//   }

//   const posts = await this.postModel
//     .find({ author: discordId })
//     .populate('visibleToPlan')
//     .populate('media')
//     .populate(
//       'likes',
//       'username profileImage discordId role discordAvatar displayName',
//     )
//     .lean();

//   return posts.map((post) => ({
//     ...post,
//     author: user,
//   }));
// }

// async getAllPosts(visibility?: Visibility): Promise<Post[]> {
//   const query = visibility ? { visibility } : {};

//   const posts = await this.postModel
//     .find(query)
//     .populate('visibleToPlan')
//     .populate('media')
//     .lean()
//     .sort({ createdAt: -1 });

//   const discordIds = [...new Set(posts.map((p) => p.author))];
//   const authors = await this.userModel
//     .find({ discordId: { $in: discordIds } })
//     .select('username profileImage discordId role discordAvatar displayName')
//     .lean();

//   const authorMap = Object.fromEntries(authors.map((a) => [a.discordId, a]));

//   return posts.map((post) => ({
//     ...post,
//     author: authorMap[post.author as string],
//   }));
// }

// async getPostById(id: string): Promise<Post> {
//   const post = await this.postModel
//     .findById(id)
//     .populate('visibleToPlan')
//     .populate('media')
//     .populate({
//       path: 'author',
//       select: 'id discordId username displayName discordAvatar role',
//     })
//     .lean();

//   if (!post) {
//     throw new NotFoundException('Post not found');
//   }

//   const likes = await this.likeModel.find({
//     targetId: post._id,
//     targetType: 'Post',
//   });
//   const userIds = likes.map((like) => like.user); // assumes `user` is a Discord ID string

//   const likedBy = await this.userModel.find(
//     { discordId: { $in: userIds } },
//     'username displayName  discordAvatar discordId', // projection
//   );

//   post['likedBy'] = likedBy;

//   return post;
// }

// async getPostsLikedByUser(userId: string): Promise<any[]> {
//   return await this.likeModel
//     .find({ user: userId, targetType: 'Post' })
//     .sort({ createdAt: -1 })
//     .populate({
//       path: 'targetId',
//       model: 'Post',
//     })
//     .populate('media')
//     .populate({
//       path: 'author',
//       select: 'id discordId username displayName discordAvatar role',
//     });
// }

// async getVisiblePostsForUser(discordId: string): Promise<Post[]> {
//   const conditions: any[] = [{ visibility: Visibility.GENERAL }];

//   const user = await this.userModel.findOne({ discordId });
//   if (!user) throw new NotFoundException('User not found');

//   // Get all user's active subscriptions
//   const allUserActiveSubscription = await this.subscriptionModel.find({
//     user: user._id,
//     isActive: true,
//   });

//   // Subscribed to creators (for "SUBSCRIBERS" posts)
//   const creatorsSubscribedTo =
//     await this.subscriptionService.getCreatorsSubscribedTo(user.discordId);
//   if (creatorsSubscribedTo.length > 0) {
//     conditions.push({
//       visibility: Visibility.SUBSCRIBERS,
//       author: { $in: creatorsSubscribedTo },
//     });
//   }

//   // Custom Plan access
//   const userPlanIds = allUserActiveSubscription.map((sub) => sub.plan); // ← ✅ fixed
//   if (userPlanIds.length > 0) {
//     conditions.push({
//       visibility: Visibility.CUSTOM_PLAN,
//       visibleToPlan: { $in: userPlanIds },
//     });
//   }

//   return this.postModel
//     .find({ $or: conditions })
//     .sort({ createdAt: -1 })
//     .populate('author', 'id username displayName discordAvatar')
//     .populate('media')
//     .populate('visibleToPlan');
// }
