import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlan } from 'src/database/schemas/subscription-plan.schema';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { SubscribeUserDto } from 'src/payment/dto/subscribe.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ─────────────────────────────────────────────────────────────
  // 🟩 SUBSCRIBE USERS
  // ─────────────────────────────────────────────────────────────

  // //TODO:this will be called internally later after payment
  // @Post()
  // @ApiOperation({
  //   summary: 'Subscribe a user to a plan using discordId and planId',
  // })
  // async subscribeUser(@Body() dto: SubscribeUserDto) {
  //   return this.subscriptionService.subscribeUserToPlan(dto);
  // }

  @Post('cancel-subscriptions')
  @ApiOperation({
    summary: 'cancel a user from a plan',
  })
  async unsubscribeUser(@Body() dto: SubscribeUserDto) {
    return this.subscriptionService.cancelUserSubscription(dto);
  }

  @Get('user/:discordId')
  @ApiOperation({ summary: 'Get a user’s subscriptions' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'If true, only active subscriptions are returned',
  })
  async getUserSubscriptions(
    @Param('discordId') discordId: string,
    @Query('active') active?: string, // comes in as string from query
  ) {
    const getActive = active === 'true'; // convert to boolean
    return this.subscriptionService.getUserSubscriptions(discordId, getActive);
  }

  @Get('user/:discordId/creators')
  @ApiOperation({
    summary: 'Get all creators a user has subscribed to',
  })
  @ApiParam({
    name: 'discordId',
    description: 'Discord ID of the user',
    required: true,
    type: String,
  })
  async getCreatorsUserIsSubscribedTo(@Param('discordId') discordId: string) {
    return this.subscriptionService.getCreatorsSubscribedTo(discordId);
  }

  // ─────────────────────────────────────────────────────────────
  // 🟩 SUBSCRIPTION PLANS
  // ─────────────────────────────────────────────────────────────

  @Post('plan/:creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Create a new subscription plan for a creator (type : onetime or tier)',
  })
  @ApiParam({
    name: 'creatorId',
    type: String,
    description: 'Creator Discord ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created',
  })
  async createSubscriptionPlan(
    @Param('creatorId') creatorId: string,
    @Body() dto: CreateSubscriptionPlanDto,
  ) {
    //TODO:check if is a creators
    return this.subscriptionService.createSubscriptionPlan(creatorId, dto);
  }

  @Patch('plan/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a subscription plan by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Subscription Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan updated',
    type: SubscriptionPlan,
  })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @Req() req: any,
  ) {
    const creatorId = req.user.userId;
    return this.subscriptionService.updateSubscriptionPlan(id, creatorId, dto);
  }

  @Get('plan/:id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Subscription Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan found',
    type: SubscriptionPlan,
  })
  async getSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionPlan(id);
  }

  @Delete('plan/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Subscription Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription plan deleted',
  })
  @HttpCode(HttpStatus.OK)
  async deleteSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionService.deleteSubscriptionPlan(id);
  }

  @Get('plan/:planId/subscribers')
  @ApiOperation({ summary: 'Get subscribers for a specific plan' })
  async getSubscribersForPlan(@Param('planId') planId: string) {
    return this.subscriptionService.getSubscribersForPlan(planId);
  }

  @Get('plan/:planId/count')
  @ApiOperation({ summary: 'Get subscriber count for a specific plan' })
  async getPlanSubscribersCount(@Param('planId') planId: string) {
    return this.subscriptionService.getPlanSubscribersCount(planId);
  }

  @Get('plans/:creatorId')
  @ApiOperation({ summary: 'Get all subscription plans by creator' })
  @ApiParam({
    name: 'creatorId',
    type: String,
    description: 'Creator Discord ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscription plans',
    type: [SubscriptionPlan],
  })
  async getAllSubscriptionPlansByUser(@Param('creatorId') creatorId: string) {
    return this.subscriptionService.getAllSubscriptionPlansByCreator(creatorId);
  }
}
