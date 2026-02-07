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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import {
  CreatePostDto,
  MediaMetaDto,
  ScheduledPostDto,
} from './dto/create-post.dto';
import { Visibility } from 'src/database/schemas/post.schema';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { validate, validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateMediaMetaDto, UpdatePostDto } from './dto/update-post.dts';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostCategoryDto } from './dto/creator-post-category';
import { PostCategory } from 'src/database/schemas/post-categories.schema';
import { Role } from 'src/database/schemas/user.schema';
import { BookmarkDto } from './dto/bookmark.dto';
import { PostStatsQueryDto } from './dto/post-stats-query.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // ─────────────────────────────────────────────────────────────
  // POST STATS
  // ─────────────────────────────────────────────────────────────
  @Get('stats/:postId')
  @ApiOperation({ summary: 'Get stats for a specific post' })
  @ApiParam({
    name: 'postId',
    description: 'MongoDB Post ID',
    example: '6791e7d3fa2b6f9abc8cf21c',
  })
  async getPostStats(
    @Param('postId') postId: string,
    @Query() query: PostStatsQueryDto,
  ) {
    const { month, year } = query;

    if ((month && !year) || (!month && year)) {
      throw new BadRequestException('Month and year must be used together ');
    }

    return this.postService.getPostStats(
      postId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('stats-seller/:sellerId/posts')
  @ApiOperation({ summary: 'Get aggregated stats for all posts of a seller' })
  @ApiParam({
    name: 'sellerId',
    description: 'Seller Discord ID',
    example: '1019923882011232405',
  })
  async getCreatorPostsStats(
    @Param('sellerId') sellerId: string,
    @Query() query: PostStatsQueryDto,
  ) {
    const { month, year } = query;

    if ((month && !year) || (!month && year)) {
      throw new BadRequestException('Month and year must be used together');
    }

    return this.postService.getCreatorPostsStats(
      sellerId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CATEGORY
  // ─────────────────────────────────────────────────────────────

  // Create category
  @Post('category')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreatePostCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: PostCategory,
  })
  async createCategory(
    @Body() dto: CreatePostCategoryDto,
  ): Promise<PostCategory> {
    return this.postService.createCategory(dto);
  }

  // Get all general categories
  @Get('category/general')
  @ApiOperation({ summary: 'Fetch all general categories' })
  @ApiResponse({
    status: 200,
    description: 'List of general categories',
    type: [PostCategory],
  })
  async getGeneralCategories(): Promise<PostCategory[]> {
    console.log('ere');
    return this.postService.getGeneralCategories();
  }

  // Get categories for a particular creator
  @Get('category/:creatorId')
  @ApiOperation({ summary: 'Fetch categories for a specific creator' })
  @ApiParam({ name: 'creatorId', description: 'Creator ID' })
  @ApiResponse({
    status: 200,
    description: 'List of creator categories',
    type: [PostCategory],
  })
  async getCreatorCategories(
    @Param('creatorId') creatorId: string,
  ): Promise<PostCategory[]> {
    return this.postService.getCreatorCategories(creatorId);
  }

  // Delete category by ID
  @Delete('category/:id')
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.postService.deleteCategory(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 🟦 CREATE & UPDATE POSTS
  // ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new post with optional media' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        visibility: {
          type: 'string',
          enum: ['general', 'subscribers', 'custom_plan'],
        },
        visibleToPlan: { type: 'string' },
        tippingEnabled: { type: 'boolean' },
        priceToView: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' },
        },
        scheduledPost: {
          type: 'object',
          properties: {
            isScheduled: { type: 'boolean' },
            scheduledFor: { type: 'string', format: 'date-time' },
          },
        },
        isDraft: { type: 'boolean' },
        mediaMeta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['image', 'video'] },
              caption: { type: 'string' },
            },
          },
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  async createPost(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() postRaw: any,
    @Body('mediaMeta') mediaMetaRaw: string,
    @Req() req: any,
  ) {
    let postDto: CreatePostDto;
    try {
      // Parse and validate the incoming data using the DTO class
      postDto = new CreatePostDto();

      if (postRaw.title) postDto.title = postRaw.title;
      if (postRaw.content) postDto.content = postRaw.content;
      if (postRaw.visibility) postDto.visibility = postRaw.visibility;
      if (postRaw.visibleToPlan) postDto.visibleToPlan = postRaw.visibleToPlan;
      if (postRaw.priceToView) postDto.priceToView = postRaw.priceToView;
      if (postRaw.tippingEnabled)
        postDto.tippingEnabled = postRaw.tippingEnabled === 'true';
      if (postRaw.scheduledPost) {
        let parsedScheduledPost: ScheduledPostDto;
        try {
          parsedScheduledPost =
            typeof postRaw.scheduledPost === 'string'
              ? JSON.parse(postRaw.scheduledPost)
              : postRaw.scheduledPost;

          // Strict type check for isScheduled
          if (typeof parsedScheduledPost.isScheduled !== 'boolean') {
            throw new Error('isScheduled must be a boolean');
          }

          parsedScheduledPost = {
            isScheduled: parsedScheduledPost.isScheduled,
            scheduledFor: parsedScheduledPost.scheduledFor,
          };
        } catch {
          throw new BadRequestException(
            'scheduledPost must be a valid object or JSON string with a boolean isScheduled',
          );
        }

        postDto.scheduledPost = plainToInstance(
          ScheduledPostDto,
          parsedScheduledPost,
        );
      }
      if (postRaw.isDraft) postDto.isDraft = postRaw.isDraft === 'true';

      await validateOrReject(postDto);
    } catch (err) {
      throw new BadRequestException(
        'Invalid post data: ' + (err?.message || err),
      );
    }
    // let mediaMeta: MediaMetaDto[] = [];
    // try {
    //   const parsed = mediaMetaRaw ? JSON.parse(`[${mediaMetaRaw}]`) : [];

    //   if (!Array.isArray(parsed)) {
    //     throw new Error();
    //   }
    //   // ✅ Transform plain objects into class instances
    //   mediaMeta = plainToInstance(MediaMetaDto, parsed);

    //   // ✅ Validate each item in the array
    //   for (const item of mediaMeta) {
    //     const errors = await validate(item);
    //     if (errors.length > 0) {
    //       throw new BadRequestException(
    //         'Invalid mediaMeta item: ' + JSON.stringify(errors),
    //       );
    //     }
    //   }
    // } catch {
    //   throw new BadRequestException('mediaMeta must be a valid JSON array');
    // }
    let mediaMeta: MediaMetaDto[] = [];
    if (mediaMetaRaw) {
      try {
        let parsed: unknown;

        if (Array.isArray(mediaMetaRaw)) {
          // Already an array
          parsed = mediaMetaRaw;
        } else if (typeof mediaMetaRaw === 'string') {
          try {
            // Try parsing directly (case 2: valid JSON array string)
            // parsed = JSON.parse(mediaMetaRaw);
            parsed = JSON.parse(`[${mediaMetaRaw}]`);
          } catch {
            // Fallback: wrap with [] (case 1: comma-separated objects)
            parsed = JSON.parse(`[${mediaMetaRaw}]`);
          }
        } else {
          throw new Error();
        }

        if (!Array.isArray(parsed)) {
          throw new Error();
        }

        // ✅ Transform plain objects into class instances
        mediaMeta = plainToInstance(MediaMetaDto, parsed);

        // ✅ Validate each item in the array
        for (const item of mediaMeta) {
          const errors = await validate(item);
          if (errors.length > 0) {
            throw new BadRequestException(
              'Invalid mediaMeta item: ' + JSON.stringify(errors),
            );
          }
        }
      } catch {
        throw new BadRequestException('mediaMeta must be a valid JSON array');
      }
    }

    // Validate custom plan requirement
    if (
      postDto.visibility === Visibility.CUSTOM_PLAN &&
      !postDto.visibleToPlan
    ) {
      throw new BadRequestException(
        'visibleToPlan must be provided when using custom_plan visibility',
      );
    }
    //TODO:restict only creators to create Post
    return this.postService.createPost(req.user.sub, postDto, files, mediaMeta);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post without media by id' })
  @ApiParam({ name: 'id', type: String, description: 'post ID' })
  @ApiResponse({
    status: 200,
    description: 'post updated',
  })
  async updatePostWithoutMedia(
    @Param('id') id: string,
    @Body() updateDto: UpdatePostDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    if ((req.user.role = Role.SELLER)) {
      throw new BadRequestException('Only Sellers can make a post');
    }
    // Validate custom plan requirement
    if (
      updateDto.visibility === Visibility.CUSTOM_PLAN &&
      !updateDto.visibleToPlan
    ) {
      throw new BadRequestException(
        'visibleToPlan must be provided when using custom_plan visibility',
      );
    }

    return this.postService.updatePostWithoutMedia(userId, id, updateDto);
  }

  @Patch(':id/with-media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a post with media by id' })
  @ApiParam({ name: 'id', type: String, description: 'post ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        visibility: {
          type: 'string',
          enum: ['general', 'subscribers', 'custom_plan'],
        },
        visibleToPlan: { type: 'string' },
        tippingEnabled: { type: 'boolean' },
        priceToView: { type: 'number' },
        category: {
          type: 'string',
        },
        scheduledPost: {
          type: 'object',
          properties: {
            isScheduled: { type: 'boolean' },
            scheduledFor: { type: 'string', format: 'date-time' },
          },
        },
        isDraft: { type: 'boolean' },
        mediaMeta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['image', 'video'] },
              caption: { type: 'string' },
              updateMediaId: { type: 'string' },
            },
          },
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Post updated successfully.' })
  async updatePostWithMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('id') id: string,
    @Body() postRaw: any,
    @Body('mediaMeta') mediaMetaRaw: string,
    @Req() req: any,
  ) {
    let updateDto: UpdatePostDto;
    try {
      updateDto = new UpdatePostDto();

      if (postRaw.title) updateDto.title = postRaw.title;
      if (postRaw.content) updateDto.content = postRaw.content;
      if (postRaw.visibility) updateDto.visibility = postRaw.visibility;
      if (postRaw.visibleToPlan)
        updateDto.visibleToPlan = postRaw.visibleToPlan;
      if (postRaw.priceToView) updateDto.priceToView = postRaw.priceToView;
      if (postRaw.tippingEnabled)
        updateDto.tippingEnabled = postRaw.tippingEnabled === 'true';
      if (postRaw.scheduledPost) {
        let parsedScheduledPost: ScheduledPostDto;
        try {
          parsedScheduledPost =
            typeof postRaw.scheduledPost === 'string'
              ? JSON.parse(postRaw.scheduledPost)
              : postRaw.scheduledPost;

          // Strict type check for isScheduled
          if (typeof parsedScheduledPost.isScheduled !== 'boolean') {
            throw new Error('isScheduled must be a boolean');
          }

          parsedScheduledPost = {
            isScheduled: parsedScheduledPost.isScheduled,
            scheduledFor: parsedScheduledPost.scheduledFor,
          };
        } catch {
          throw new BadRequestException(
            'scheduledPost must be a valid object or JSON string with a boolean isScheduled',
          );
        }

        updateDto.scheduledPost = plainToInstance(
          ScheduledPostDto,
          parsedScheduledPost,
        );
      }
      if (postRaw.isDraft) updateDto.isDraft = postRaw.isDraft === 'true';

      await validateOrReject(updateDto);
    } catch (err) {
      throw new BadRequestException(
        'Invalid post data: ' + (err?.message || err),
      );
    }

    console.log(updateDto);

    let mediaMeta: UpdateMediaMetaDto[] = [];
    try {
      const parsed = mediaMetaRaw ? JSON.parse(`[${mediaMetaRaw}]`) : [];

      if (!Array.isArray(parsed)) {
        throw new Error();
      }
      // ✅ Transform plain objects into class instances
      mediaMeta = plainToInstance(UpdateMediaMetaDto, parsed);

      // ✅ Validate each item in the array
      for (const item of mediaMeta) {
        const errors = await validate(item);
        if (errors.length > 0) {
          throw new BadRequestException(
            'Invalid mediaMeta item: ' + JSON.stringify(errors),
          );
        }
      }
    } catch {
      throw new BadRequestException('mediaMeta must be a valid JSON array');
    }

    // Validate custom plan requirement
    if (
      updateDto.visibility === Visibility.CUSTOM_PLAN &&
      !updateDto.visibleToPlan
    ) {
      throw new BadRequestException(
        'visibleToPlan must be provided when using custom_plan visibility',
      );
    }

    return this.postService.updatePostWithMedia(
      req.user.sub,
      id,
      updateDto,
      files,
      mediaMeta,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Permanently delete a post with its media and comments',
  })
  @ApiQuery({ name: 'discordId', required: true, type: String })
  async deletePost(
    @Param('id') postId: string,
    @Query('discordId') discordId: string,
  ) {
    // const authorId = req.user.userId;

    return this.postService.deletePost(discordId, postId);
  }

  @Post('doc-schema')
  @ApiOperation({ summary: 'DTO schema reference (not callable)' })
  @ApiBody({ type: CreatePostDto })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createPostSchemaOnly(@Body() _dto: CreatePostDto) {
    return;
  }

  // ─────────────────────────────────────────────────────────────
  // 🟩 FETCH POSTS
  // ─────────────────────────────────────────────────────────────

  @Get('trending')
  @ApiOperation({ summary: 'Get trending posts (most liked)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Returns most liked posts' })
  async getTrendingPosts(@Query('limit') limit = 20) {
    return this.postService.getTrendingPosts(Number(limit));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent posts (latest feed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Returns latest posts' })
  async getRecentPosts(@Query('limit') limit = 20) {
    return this.postService.getRecentPosts(Number(limit));
  }

  @Get('user/feed')
  @ApiOperation({ summary: 'Get visible posts for a user' })
  @ApiQuery({ name: 'discordId', required: true, type: String })
  @ApiOkResponse({ description: 'Returns Users feed' })
  async getVisiblePostsForUser(@Query('discordId') discordId: string) {
    return this.postService.getVisiblePostsForUser(discordId);
  }

  @Get('user/recent-feed')
  @ApiOperation({ summary: 'Get recent feed for a user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'discordId', required: true, type: String })
  async getRecentFeed(
    @Query('discordId') discordId: string,
    @Query('limit') limit = 10,
  ) {
    return this.postService.getRecentFeedForUser(discordId, Number(limit));
  }

  @Get('user/filtered-feed')
  @ApiOperation({ summary: 'Get filtered visible posts for user' })
  @ApiQuery({ name: 'discordId', required: true, type: String })
  @ApiQuery({
    name: 'filter',
    required: false,
    type: String,
    enum: ['general', 'subscribers', 'custom_plan', 'personal', 'all'],
    description: 'Visibility type filter for posts',
  })
  async getFilteredUserPosts(
    @Query('discordId') discordId: string,
    @Query('filter')
    filter: 'general' | 'subscribers' | 'custom_plan' | 'all' = 'all',
  ) {
    return this.postService.getFilteredPostsForUser(discordId, filter);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get posts by category' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Returns posts filtered by category' })
  async getPostsByCategory(
    @Param('category') category: string,
    @Query('limit') limit = 20,
  ) {
    return this.postService.getPostsByCategory(category, Number(limit));
  }

  @Get('plan/:planId')
  @ApiOperation({ summary: 'Get posts by subscription plan' })
  @ApiOkResponse({ description: 'Posts found' })
  getPostsByPlan(@Param('planId') planId: string) {
    return this.postService.getPostsByPlan(planId);
  }

  @Get('creator/:discordId')
  @ApiOperation({ summary: 'Get posts by a user' })
  @ApiOkResponse({ description: 'Posts found' })
  getPostsByUser(@Param('discordId') discordId: string) {
    return this.postService.getPostsByUser(discordId);
  }

  @Get('creator-media/:discordId')
  @ApiOperation({ summary: 'Get post Medias by a user' })
  @ApiOkResponse({ description: 'Medias found' })
  getPostMediaByUser(@Param('discordId') discordId: string) {
    return this.postService.getPostMediaByUser(discordId);
  }

  @Get('liked-by-user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get posts liked by current user' })
  @ApiOkResponse({ description: 'Returns list of liked posts' })
  async getPostsLikedByUser(@Req() req: any) {
    const userId = req.user.userId;
    return this.postService.getPostsLikedByUser(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts with optional filters' })
  @ApiQuery({ name: 'visibility', required: false, enum: Visibility })
  @ApiOkResponse({ description: 'Posts found' })
  getAllPosts(@Query('visibility') visibility?: Visibility) {
    return this.postService.getAllPosts(visibility);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiOkResponse({ description: 'Post found' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async getPostById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  // ─────────────────────────────────────────────────────────────
  // ❤️ LIKES
  // ─────────────────────────────────────────────────────────────

  @Post('like/:type')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Like a Post or Comment (type = post | comment)',
  })
  @ApiOkResponse({ description: 'Item liked successfully' })
  async like(
    @Param('type') type: 'post' | 'comment',
    @Body() dto: CreateLikeDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    this.validateLikeType(type, dto);
    return this.postService.likeTarget(userId, dto);
  }

  @Post('unlike/:type')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Unlike a Post or Comment (type = post | comment)',
  })
  @ApiOkResponse({ description: 'Item unliked successfully' })
  async unlike(
    @Param('type') type: 'post' | 'comment',
    @Body() dto: CreateLikeDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    this.validateLikeType(type, dto);
    return this.postService.unlikeTarget(userId, dto);
  }

  @Get('has-liked/:targetType/:targetId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Check if user has liked a post or comment (type = post | comment)',
  })
  @ApiOkResponse({ description: 'Returns true or false' })
  async hasLiked(
    @Param('targetType') targetType: 'post' | 'comment',
    @Param('targetId') targetId: string,
    @Req() req: any,
  ) {
    const validTypes = { post: 'Post', comment: 'Comment' };
    const resolvedType = validTypes[targetType];

    if (!resolvedType) {
      throw new BadRequestException(
        'Invalid targetType. Use "post" or "comment".',
      );
    }

    const userId = req.user.userId;
    const exists = await this.postService.hasUserLiked(
      userId,
      targetId,
      resolvedType as 'Post' | 'Comment',
    );
    return { liked: !!exists };
  }

  @Get(':postId/likes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiOkResponse({ description: 'Returns list of users' })
  async getUsersWhoLikedPost(@Param('postId') postId: string) {
    return this.postService.getUsersWhoLikedPost(postId);
  }

  // ─────────────────────────────────────────────────────────────
  // ❤️ COMMENTS
  // ─────────────────────────────────────────────────────────────

  @Post('comment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Comment on a post or another comment' })
  async createComment(@Body() dto: CreateCommentDto, @Req() req: any) {
    const authorId = req.user.userId;
    return this.postService.createComment(
      authorId,
      dto.postId,
      dto.content,
      dto.parentCommentId,
    );
  }

  @Patch('comment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a comment' })
  async updateComment(
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const authorId = req.user.userId;
    return this.postService.updateComment(commentId, authorId, dto.content);
  }

  @Delete('comment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('id') commentId: string,
    @Query('authorId') authorId: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    if (authorId !== req.user.sub)
      throw new BadRequestException(
        'author is different from the connect user',
      );
    return this.postService.deleteComment(commentId, userId);
  }

  @Get('post-comments/:postId')
  @ApiOperation({ summary: 'Get top-level comments for a post' })
  async getPostComments(@Param('postId') postId: string) {
    return this.postService.getPostComments(postId);
  }

  @Get('replies/:commentId')
  @ApiOperation({ summary: 'Get replies to a specific comment' })
  async getReplies(@Param('commentId') commentId: string) {
    return this.postService.getReplies(commentId);
  }

  // view count
  @Post('post-view/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Increase post view when a user opens a post' })
  async postView(@Param('postId') postId: string) {
    return this.postService.increasePostView(postId);
  }

  // ─────────────────────────────────────────────────────────────
  // BOOKMARKS
  // ─────────────────────────────────────────────────────────────

  @Post('bookmark/:discordId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bookmark a post' })
  addBookmark(@Param('discordId') discordId: string, @Body() dto: BookmarkDto) {
    return this.postService.addBookmark(discordId, dto.postId);
  }

  @Delete('bookmark/:discordId/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove bookmark' })
  removeBookmark(
    @Param('discordId') discordId: string,
    @Param('postId') postId: string,
  ) {
    return this.postService.removeBookmark(discordId, postId);
  }

  @Get('bookmark/:discordId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all bookmarks for a user' })
  fetchBookmark(@Param('discordId') discordId: string) {
    return this.postService.getBookmarks(discordId);
  }

  @Get('bookmark/:discordId/:postId/has-bookmarked')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Check if user has bookmarked a post',
  })
  @ApiOkResponse({ description: 'Returns true or false' })
  async hasBookmarked(
    @Param('discordId') discordId: string,
    @Param('postId') postId: string,
    // @Req() req: any,
  ) {
    // const userId = req.user.userId;
    const exists = await this.postService.hasUserBookmarked(discordId, postId);
    return { bookmarked: !!exists };
  }

  // ─────────────────────────────────────────────────────────────
  // 🔒 HELPER METHOD
  // ─────────────────────────────────────────────────────────────

  private validateLikeType(type: 'post' | 'comment', dto: CreateLikeDto): void {
    const validTypes = {
      post: 'Post',
      comment: 'Comment',
      server: 'Server',
    };

    const expectedTargetType = validTypes[type];

    if (!expectedTargetType) {
      throw new BadRequestException(
        'Invalid like type. Use "post" or "comment".',
      );
    }

    if (dto.targetType !== expectedTargetType) {
      throw new BadRequestException(
        `Invalid targetType. Must be "${expectedTargetType}".`,
      );
    }
  }

  // @Get('disk-space/disk')
  // getDiskSpace() {
  //   return this.systemService.getDiskSpaceLinuxMacOs();
  // }
}
