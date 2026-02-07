import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { FileUploaderModule } from 'src/file-uploader/file-uploader.module';
import { Post, PostSchema } from 'src/database/schemas/post.schema';
import { Comment, CommentSchema } from 'src/database/schemas/comment.schema';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from 'src/database/schemas/subscription-plan.schema';
import { Media, MediaSchema } from 'src/database/schemas/media.schema';
import { Like, LikeSchema } from 'src/database/schemas/like.schema';
import {
  UserSubscription,
  UserSubscriptionSchema,
} from 'src/database/schemas/user-subscription.schema';

import { SubscriptionModule } from 'src/subscription/subscription.module';
import {
  PostCategory,
  PostCategorySchema,
} from 'src/database/schemas/post-categories.schema';
import { Bookmark, BookmarkSchema } from 'src/database/schemas/bookmark.schema';
import { NotificationModule } from 'src/notification/notification.module';
import { UserModule } from 'src/user/user.module';
import { Category, CategorySchema } from 'src/database/schemas/category.schema';
import { Payment, PaymentSchema } from 'src/database/schemas/payment.schema';

@Module({
  imports: [
    JwtModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Media.name, schema: MediaSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
      { name: Bookmark.name, schema: BookmarkSchema },
      { name: PostCategory.name, schema: PostCategorySchema },
      { name: Category.name, schema: CategorySchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    FileUploaderModule,
    NotificationModule,
    UserModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
