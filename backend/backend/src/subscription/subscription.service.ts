import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPlan } from 'src/database/schemas/subscription-plan.schema';
import {
  SubscriptionStatus,
  UserSubscription,
} from 'src/database/schemas/user-subscription.schema';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { SubscribeUserDto } from 'src/payment/dto/subscribe.dto';

@Injectable()
export class SubscriptionService {
  private logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlan>,
    @InjectModel(UserSubscription.name)
    private readonly userSubscriptionModel: Model<UserSubscription>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIPTION PLANS
  // ─────────────────────────────────────────────────────────────

  async createSubscriptionPlan(
    creatorId: string,
    dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    try {
      const creator = await this.userModel.findOne({ discordId: creatorId });
      if (!creator) {
        throw new BadRequestException('User not found');
      }

      console.log(dto);

      // if (dto.type === PlanType.ONETIME) {
      //   console.log('here');
      //   const existingOnetime = await this.subscriptionPlanModel.findOne({
      //     creator: creator._id,
      //     type: PlanType.ONETIME,
      //   });

      //   console.log(existingOnetime);
      //   if (existingOnetime) {
      //     throw new BadRequestException(
      //       'You have already created a one-time membership plan. You can only update it.',
      //     );
      //   }
      // }

      const newSubscriptionPlan = new this.subscriptionPlanModel({
        ...dto,
        creator: creator._id,
      });

      return await newSubscriptionPlan.save();
    } catch (error) {
      // Allow previously thrown HttpExceptions to pass through
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle known DB error (e.g., duplicate key)
      if (error.code === 11000) {
        throw new BadRequestException(
          'Duplicate key error: a subscription plan with this name already exists for this creator',
        );
      }

      // Fallback for unexpected errors
      throw new BadRequestException('Failed to create subscription plan');
    }
  }

  async updateSubscriptionPlan(
    planId: string,
    creatorId: string,
    data: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    try {
      // Use findOneAndUpdate to include creatorId in the filter
      const updatedPlan = await this.subscriptionPlanModel
        .findOneAndUpdate(
          { _id: planId, creator: creatorId }, // Filter with both ID and creator
          { $set: data },
          { new: true, runValidators: true },
        )
        .exec();

      if (!updatedPlan) {
        throw new NotFoundException(
          'Subscription plan not found or unauthorized',
        );
      }

      return updatedPlan;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new BadRequestException(
          'Duplicate key error: a subscription plan with this name already exists for this creator',
        );
      }
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid subscription plan data');
      }

      throw new BadRequestException('Failed to update subscription plan');
    }
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanModel
      .findById(id)
      .populate({
        path: 'creator',
        select: 'discordId  username displayName discordAvatar profileImage',
      })
      .exec();

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async getAllSubscriptionPlansByCreator(
    creatorDiscordId: string,
  ): Promise<{ plans: SubscriptionPlan[]; creator: Partial<User> }> {
    const creator = await this.userModel
      .findOne({ discordId: creatorDiscordId })
      .select('discordId username displayName discordAvatar role profileImage')
      .lean();

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    const plans = await this.subscriptionPlanModel
      .find({ creator: creator._id, isDeleted: false })
      .select('-__v -isDeleted -isArchived')
      .lean()
      .exec();

    return {
      plans,
      creator,
    };
  }

  async deleteSubscriptionPlan(id: string): Promise<{
    deleted: boolean;
    archived?: boolean;
  }> {
    const plan = await this.subscriptionPlanModel.findById(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const activeSubscriptions = await this.userSubscriptionModel.countDocuments(
      {
        plan: id,
        isActive: true,
      },
    );

    if (activeSubscriptions > 0) {
      await this.subscriptionPlanModel.findByIdAndUpdate(id, {
        isArchived: true,
      });

      //TODO:
      // Notify creator
      // await this.notificationService.sendToUser(plan.creator._id, {
      //   title: 'Plan Archived',
      //   message: `Your plan "${plan.planName}" was archived because it still has active subscribers.`,
      // });

      //TODO:
      // Notify creator
      // await this.notificationService.sendToUser(plan.creator._id, {
      //   title: 'Plan Deleted',
      //   message: `Your plan "${plan.planName}" has been deleted subscribers.`,
      // });

      return { deleted: false, archived: true };
    }

    await this.subscriptionPlanModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    return { deleted: true, archived: false };
  }

  async getSubscribersForPlan(planId: string): Promise<any[]> {
    const subscriptions = await this.userSubscriptionModel
      .find({ plan: planId, isActive: true })
      .populate({
        path: 'user',
        select: 'discordId username displayName discordAvatar',
      })
      .lean()
      .exec();

    return subscriptions.map((sub) => sub.user);
  }

  async getPlanSubscribersCount(
    planId: string,
  ): Promise<{ planId: string; count: number }> {
    const count = await this.userSubscriptionModel.countDocuments({
      plan: planId,
      isActive: true,
    });

    return { planId, count };
  }

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────

  // async subscribeUserToPlan(dto: SubscribeUserDto): Promise<{
  //   subscription: UserSubscription;
  //   plan: SubscriptionPlan;
  //   message: string;
  // }> {
  //   const { discordId, planId } = dto;

  //   const user = await this.userModel.findOne({ discordId });
  //   if (!user) throw new NotFoundException('User not found');

  //   const plan = await this.subscriptionPlanModel.findById(planId);
  //   if (!plan) throw new NotFoundException('Plan not found');

  //   const existing = await this.userSubscriptionModel.findOne({
  //     user: user._id,
  //     plan: planId,
  //   });

  //   if (existing) {
  //     throw new BadRequestException('User is already subscribed to this plan');
  //   }

  //   const subscription = await this.subscriptionModel.create({
  //     user: user._id,
  //     plan: plan._id,
  //     startDate: new Date(),
  //     endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  //   });

  //   // Increment subscribers count
  //   await this.subscriptionPlanModel.findByIdAndUpdate(planId, {
  //     $inc: { subscribersCount: 1 },
  //   });

  //   return {
  //     subscription,
  //     plan,
  //     message: 'User subscribed successfully',
  //   };
  // }

  async cancelUserSubscription(
    dto: SubscribeUserDto,
  ): Promise<{ message: string }> {
    const { buyerId: discordId, planId } = dto;

    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');

    const userSubscription = await this.userSubscriptionModel.findOne({
      user: user._id,
      plan: planId,
      isActive: true,
    });

    if (!userSubscription) {
      throw new NotFoundException('Active subscription not found');
    }

    userSubscription.isActive = false;
    userSubscription.status = SubscriptionStatus.CANCELED;
    await userSubscription.save();

    // Decrease the subscribers count
    await this.subscriptionPlanModel.findByIdAndUpdate(planId, {
      $inc: { subscribersCount: -1 },
    });

    return { message: 'User unsubscribed successfully' };
  }

  async getUserSubscriptions(
    discordId: string,
    getActive = false,
  ): Promise<{
    subscriptions: any[];
    user: Partial<User>;
  }> {
    const user = await this.userModel
      .findOne({ discordId })
      .select('discordId username displayName discordAvatar role')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const filter: any = { user: user._id };
    if (getActive) {
      filter.isActive = true;
    }

    const subscriptions = await this.userSubscriptionModel
      .find(filter)
      .select('-__v')
      .populate({
        path: 'plan',
        select: 'name amount description icon creator type',
        populate: {
          path: 'creator',
          select: 'username displayName discordId discordAvatar',
        },
      })
      .lean()
      .exec();

    return {
      subscriptions,
      user,
    };
  }

  async getCreatorsSubscribedTo(discordId: string): Promise<
    {
      creator: UserDocument;
      subscriptions: {
        type: 'onetime' | 'tier';
        planName: string;
        amount: string;
        description?: string;
        icon?: string;
        startDate: Date;
        endDate?: Date;
        isActive: boolean;
      }[];
    }[]
  > {
    // Step 1: Find the user by Discord ID
    const user = await this.userModel.findOne({ discordId }).exec();
    if (!user) throw new NotFoundException('User not found');

    // Step 2: Find all subscriptions by the user and populate plan and plan.creator
    const subscriptions = await this.userSubscriptionModel
      .find({ user: user._id })
      .populate({
        path: 'plan',
        populate: {
          path: 'creator',
          model: 'User',
        },
      })
      .lean()
      .exec();

    // Step 3: Group subscriptions by creator
    const creatorMap = new Map<
      string,
      {
        creator: UserDocument;
        subscriptions: {
          type: 'onetime' | 'tier';
          planName: string;
          amount: string;
          description?: string;
          icon?: string;
          startDate: Date;
          endDate?: Date;
          isActive: boolean;
        }[];
      }
    >();

    for (const sub of subscriptions) {
      const plan = sub.plan as any;
      const creator = plan?.creator as UserDocument;

      if (!creator || !plan?.type) continue;

      const key = creator._id.toString();

      if (!creatorMap.has(key)) {
        creatorMap.set(key, {
          creator,
          subscriptions: [],
        });
      }

      creatorMap.get(key)!.subscriptions.push({
        type: plan.type,
        planName: plan.name,
        amount: plan.amount,
        description: plan.description,
        icon: plan.icon,
        startDate: sub.startDate,
        endDate: sub.endDate,
        isActive: sub.isActive,
      });
    }

    // Step 4: Return grouped subscriptions
    return Array.from(creatorMap.values());
  }
}

//TODO:
// Renew Subscription
// expireSubscriptionsCronJob()
// Purpose: A scheduled task (using @Cron) to mark expired subscriptions as inactive.
// @Cron('0 0 * * *') // Every midnight

//TODO:

// @Cron('0 3 * * *') // Every day at 3 AM
// async cleanUpArchivedPlans() {
//   const archivedPlans = await this.subscriptionPlanModel.find({
//     isArchived: true,
//     isDeleted: false,
//   });

//   for (const plan of archivedPlans) {
//     const activeSubs = await this.subscriptionModel.find({
//       plan: plan._id,
//       isActive: true,
//     });

//     // Only delete if no subs or all are expired
//     const stillActive = activeSubs.some(sub => new Date(sub.endDate) > new Date());

//     if (!stillActive) {
//       await this.subscriptionPlanModel.findByIdAndUpdate(plan._id, {
//         isDeleted: true,
//       });

//       // Optional: notify creator
//       await this.notificationService.sendToUser(plan.creator, {
//         title: 'Plan Deleted Automatically',
//         message: `Your archived plan "${plan.planName}" was deleted because it has no active subscribers.`,
//       });
//     }
//   }
// }
