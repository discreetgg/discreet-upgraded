// import {
//   BadRequestException,
//   Body,
//   Controller,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Query,
//   Req,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { PostService } from './post.service';
// import { FilesInterceptor } from '@nestjs/platform-express';
// import {
//   ApiBody,
//   ApiConsumes,
//   ApiOperation,
//   ApiResponse,
//   ApiOkResponse,
//   ApiNotFoundResponse,
//   ApiQuery,
//   ApiParam,
// } from '@nestjs/swagger';
// import {
//   CreatePostDto,
//   MediaMetaDto,
//   ScheduledPostDto,
// } from './dto/create-post.dto';
// import { Visibility } from 'src/database/schemas/post.schema';
// import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
// import { validate, validateOrReject } from 'class-validator';
// import { plainToInstance } from 'class-transformer';
// import { UpdateMediaMetaDto, UpdatePostDto } from './dto/update-post.dts';
// import { CreateLikeDto } from './dto/create-like.dto';

// @Controller('post')
// export class PostController {
//   constructor(private readonly postService: PostService) {}

//   @Post()
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(FilesInterceptor('files'))
//   @ApiConsumes('multipart/form-data')
//   @ApiOperation({ summary: 'Create a new post with optional media' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         title: { type: 'string' },
//         content: { type: 'string' },
//         visibility: {
//           type: 'string',
//           enum: ['general', 'subscribers', 'custom_plan'],
//         },
//         visibleToPlan: { type: 'string' },
//         tippingEnabled: { type: 'boolean' },
//         priceToView: { type: 'number' },
//         categories: {
//           type: 'array',
//           items: { type: 'string' },
//         },
//         scheduledPost: {
//           type: 'object',
//           properties: {
//             isScheduled: { type: 'boolean' },
//             scheduledFor: { type: 'string', format: 'date-time' },
//           },
//         },
//         isDraft: { type: 'boolean' },
//         mediaMeta: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               type: { type: 'string', enum: ['image', 'video'] },
//               caption: { type: 'string' },
//             },
//           },
//         },
//         files: {
//           type: 'array',
//           items: {
//             type: 'string',
//             format: 'binary',
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 201, description: 'Post created successfully.' })
//   async createPost(
//     @UploadedFiles() files: Express.Multer.File[],
//     @Body() postRaw: any,
//     @Body('mediaMeta') mediaMetaRaw: string,
//     @Req() req: any,
//   ) {
//     let postDto: CreatePostDto;
//     try {
//       // Parse and validate the incoming data using the DTO class
//       postDto = new CreatePostDto();

//       if (postRaw.title) postDto.title = postRaw.title;
//       if (postRaw.content) postDto.content = postRaw.content;
//       if (postRaw.visibility) postDto.visibility = postRaw.visibility;
//       if (postRaw.visibleToPlan) postDto.visibleToPlan = postRaw.visibleToPlan;
//       if (postRaw.priceToView) postDto.priceToView = postRaw.priceToView;
//       if (postRaw.tippingEnabled)
//         postDto.tippingEnabled = postRaw.tippingEnabled === 'true';
//       if (postRaw.categories) {
//         postDto.categories =
//           typeof postRaw.categories === 'string'
//             ? postRaw.categories.split(',')
//             : postRaw.categories;
//       }
//       if (postRaw.scheduledPost) {
//         let parsedScheduledPost: ScheduledPostDto;
//         try {
//           parsedScheduledPost =
//             typeof postRaw.scheduledPost === 'string'
//               ? JSON.parse(postRaw.scheduledPost)
//               : postRaw.scheduledPost;

//           // Strict type check for isScheduled
//           if (typeof parsedScheduledPost.isScheduled !== 'boolean') {
//             throw new Error('isScheduled must be a boolean');
//           }

//           parsedScheduledPost = {
//             isScheduled: parsedScheduledPost.isScheduled,
//             scheduledFor: parsedScheduledPost.scheduledFor,
//           };
//         } catch {
//           throw new BadRequestException(
//             'scheduledPost must be a valid object or JSON string with a boolean isScheduled',
//           );
//         }

//         postDto.scheduledPost = plainToInstance(
//           ScheduledPostDto,
//           parsedScheduledPost,
//         );
//       }
//       if (postRaw.isDraft) postDto.isDraft = postRaw.isDraft === 'true';

//       await validateOrReject(postDto);
//     } catch (err) {
//       throw new BadRequestException(
//         'Invalid post data: ' + (err?.message || err),
//       );
//     }
//     let mediaMeta: MediaMetaDto[] = [];
//     try {
//       const parsed = mediaMetaRaw ? JSON.parse(`[${mediaMetaRaw}]`) : [];

//       if (!Array.isArray(parsed)) {
//         throw new Error();
//       }
//       // ✅ Transform plain objects into class instances
//       mediaMeta = plainToInstance(MediaMetaDto, parsed);

//       // ✅ Validate each item in the array
//       for (const item of mediaMeta) {
//         const errors = await validate(item);
//         if (errors.length > 0) {
//           throw new BadRequestException(
//             'Invalid mediaMeta item: ' + JSON.stringify(errors),
//           );
//         }
//       }
//     } catch {
//       throw new BadRequestException('mediaMeta must be a valid JSON array');
//     }

//     // Validate custom plan requirement
//     if (
//       postDto.visibility === Visibility.CUSTOM_PLAN &&
//       !postDto.visibleToPlan
//     ) {
//       throw new BadRequestException(
//         'visibleToPlan must be provided when using custom_plan visibility',
//       );
//     }

//     return this.postService.createPost(req.user.sub, postDto, files, mediaMeta);
//   }

//   @ApiOperation({ summary: 'DTO schema reference(this is not collable)' })
//   @Post('doc-schema')
//   @ApiBody({ type: CreatePostDto })
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   createPostSchemaOnly(@Body() _dto: CreatePostDto) {
//     return;
//   }

//   @Get('trending')
//   @ApiOperation({ summary: 'Get trending posts (most liked)' })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   @ApiOkResponse({ description: 'Returns most liked posts' })
//   async getTrendingPosts(@Query('limit') limit = 20) {
//     return this.postService.getTrendingPosts(Number(limit));
//   }

//   @Get('recent')
//   @ApiOperation({ summary: 'Get recent posts (latest feed)' })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   @ApiOkResponse({ description: 'Returns latest posts' })
//   async getRecentPosts(@Query('limit') limit = 20) {
//     return this.postService.getRecentPosts(Number(limit));
//   }

//   @Get('category/:category')
//   @ApiOperation({ summary: 'Get posts by category' })
//   @ApiQuery({ name: 'limit', required: false, type: Number })
//   @ApiOkResponse({ description: 'Returns posts filtered by category' })
//   async getPostsByCategory(
//     @Param('category') category: string,
//     @Query('limit') limit = 20,
//   ) {
//     return this.postService.getPostsByCategory(category, Number(limit));
//   }

//   // @Get('paginate')
//   // @ApiOperation({ summary: 'Get paginated posts' })
//   // @ApiQuery({ name: 'page', required: false, type: Number })
//   // @ApiQuery({ name: 'limit', required: false, type: Number })
//   // @ApiOkResponse({ description: 'Returns paginated posts' })
//   // async getPaginatedPosts(@Query('page') page = 1, @Query('limit') limit = 20) {
//   //   return this.postService.getPaginatedPosts(Number(page), Number(limit));
//   // }

//   @Patch(':id')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Update a post without media by id' })
//   @ApiParam({ name: 'id', type: String, description: 'post ID' })
//   @ApiResponse({
//     status: 200,
//     description: 'post updated',
//   })
//   async updatePostWithoutMedia(
//     @Param('id') id: string,
//     @Body() updateDto: UpdatePostDto,
//     @Req() req: any,
//   ) {
//     const userId = req.user.sub;
//     // Validate custom plan requirement
//     if (
//       updateDto.visibility === Visibility.CUSTOM_PLAN &&
//       !updateDto.visibleToPlan
//     ) {
//       throw new BadRequestException(
//         'visibleToPlan must be provided when using custom_plan visibility',
//       );
//     }

//     return this.postService.updatePostWithoutMedia(userId, id, updateDto);
//   }

//   @Patch(':id/with-media')
//   @UseGuards(JwtAuthGuard)
//   @UseInterceptors(FilesInterceptor('files'))
//   @ApiConsumes('multipart/form-data')
//   @ApiOperation({ summary: 'Update a post with media by id' })
//   @ApiParam({ name: 'id', type: String, description: 'post ID' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         title: { type: 'string' },
//         content: { type: 'string' },
//         visibility: {
//           type: 'string',
//           enum: ['general', 'subscribers', 'custom_plan'],
//         },
//         visibleToPlan: { type: 'string' },
//         tippingEnabled: { type: 'boolean' },
//         priceToView: { type: 'number' },
//         categories: {
//           type: 'array',
//           items: { type: 'string' },
//         },
//         scheduledPost: {
//           type: 'object',
//           properties: {
//             isScheduled: { type: 'boolean' },
//             scheduledFor: { type: 'string', format: 'date-time' },
//           },
//         },
//         isDraft: { type: 'boolean' },
//         mediaMeta: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               type: { type: 'string', enum: ['image', 'video'] },
//               caption: { type: 'string' },
//               updateMediaId: { type: 'string' },
//             },
//           },
//         },
//         files: {
//           type: 'array',
//           items: {
//             type: 'string',
//             format: 'binary',
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 201, description: 'Post updated successfully.' })
//   async updatePostWithMedia(
//     @UploadedFiles() files: Express.Multer.File[],
//     @Param('id') id: string,
//     @Body() postRaw: any,
//     @Body('mediaMeta') mediaMetaRaw: string,
//     @Req() req: any,
//   ) {
//     let updateDto: UpdatePostDto;
//     try {
//       updateDto = new UpdatePostDto();

//       if (postRaw.title) updateDto.title = postRaw.title;
//       if (postRaw.content) updateDto.content = postRaw.content;
//       if (postRaw.visibility) updateDto.visibility = postRaw.visibility;
//       if (postRaw.visibleToPlan)
//         updateDto.visibleToPlan = postRaw.visibleToPlan;
//       if (postRaw.priceToView) updateDto.priceToView = postRaw.priceToView;
//       if (postRaw.tippingEnabled)
//         updateDto.tippingEnabled = postRaw.tippingEnabled === 'true';
//       if (postRaw.categories) {
//         updateDto.categories =
//           typeof postRaw.categories === 'string'
//             ? postRaw.categories.split(',')
//             : postRaw.categories;
//       }
//       if (postRaw.scheduledPost) {
//         let parsedScheduledPost: ScheduledPostDto;
//         try {
//           parsedScheduledPost =
//             typeof postRaw.scheduledPost === 'string'
//               ? JSON.parse(postRaw.scheduledPost)
//               : postRaw.scheduledPost;

//           // Strict type check for isScheduled
//           if (typeof parsedScheduledPost.isScheduled !== 'boolean') {
//             throw new Error('isScheduled must be a boolean');
//           }

//           parsedScheduledPost = {
//             isScheduled: parsedScheduledPost.isScheduled,
//             scheduledFor: parsedScheduledPost.scheduledFor,
//           };
//         } catch {
//           throw new BadRequestException(
//             'scheduledPost must be a valid object or JSON string with a boolean isScheduled',
//           );
//         }

//         updateDto.scheduledPost = plainToInstance(
//           ScheduledPostDto,
//           parsedScheduledPost,
//         );
//       }
//       if (postRaw.isDraft) updateDto.isDraft = postRaw.isDraft === 'true';

//       await validateOrReject(updateDto);
//     } catch (err) {
//       throw new BadRequestException(
//         'Invalid post data: ' + (err?.message || err),
//       );
//     }

//     console.log(updateDto);

//     let mediaMeta: UpdateMediaMetaDto[] = [];
//     try {
//       const parsed = mediaMetaRaw ? JSON.parse(`[${mediaMetaRaw}]`) : [];

//       if (!Array.isArray(parsed)) {
//         throw new Error();
//       }
//       // ✅ Transform plain objects into class instances
//       mediaMeta = plainToInstance(UpdateMediaMetaDto, parsed);

//       // ✅ Validate each item in the array
//       for (const item of mediaMeta) {
//         const errors = await validate(item);
//         if (errors.length > 0) {
//           throw new BadRequestException(
//             'Invalid mediaMeta item: ' + JSON.stringify(errors),
//           );
//         }
//       }
//     } catch {
//       throw new BadRequestException('mediaMeta must be a valid JSON array');
//     }

//     // Validate custom plan requirement
//     if (
//       updateDto.visibility === Visibility.CUSTOM_PLAN &&
//       !updateDto.visibleToPlan
//     ) {
//       throw new BadRequestException(
//         'visibleToPlan must be provided when using custom_plan visibility',
//       );
//     }

//     return this.postService.updatePostWithMedia(
//       req.user.sub,
//       id,
//       updateDto,
//       files,
//       mediaMeta,
//     );
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Get post by Id' })
//   @ApiOkResponse({ description: 'Post found' })
//   @ApiNotFoundResponse({ description: 'Post not found' })
//   async getPostById(@Param('id') id: string) {
//     console.log('hereee');
//     return this.postService.getPostById(id);
//   }

//   @Get('user/liked-posts')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Get all posts the logged-in user liked' })
//   @ApiOkResponse({ description: 'Returns list of posts' })
//   async getPostsLikedByUser(@Req() req: any) {
//     const userId = req.user.sub;
//     console.log('hereeee');
//     return await this.postService.getPostsLikedByUser(userId);
//   }

//   @Get('user/:discordId')
//   @ApiOperation({ summary: 'Get posts by a user' })
//   @ApiOkResponse({ description: 'Post found' })
//   getPostsByUser(@Param('discordId') discordId: string) {
//     return this.postService.getPostsByUser(discordId);
//   }

//   @Get('plan/:planId')
//   @ApiOperation({ summary: 'Get posts by subscription plans' })
//   @ApiOkResponse({ description: 'Post found' })
//   getPostsByPlan(@Param('planId') planId: string) {
//     return this.postService.getPostsByPlan(planId);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Get all posts with optional filters' })
//   @ApiQuery({ name: 'visibility', required: false, enum: Visibility })
//   @ApiOkResponse({ description: 'Post found' })
//   getAllPosts(@Query('visibility') visibility?: Visibility) {
//     return this.postService.getAllPosts(visibility);
//   }

//   @Post('like/:type')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({
//     summary: 'Like a Post or Comment (type is either post or comment)',
//   })
//   @ApiOkResponse({ description: 'Item liked successfully' })
//   async like(
//     @Param('type') type: 'post' | 'comment',
//     @Body() dto: CreateLikeDto,
//     @Req() req: any,
//   ) {
//     const userId = req.user.sub;
//     this.validateLikeType(type, dto);
//     return this.postService.likeTarget(userId, dto);
//   }

//   @Post('unlike/:type')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({
//     summary: 'Unlike a Post or Comment (type is either post or comment)',
//   })
//   @ApiOkResponse({ description: 'Item unliked successfully' })
//   async unlike(
//     @Param('type') type: 'post' | 'comment',
//     @Body() dto: CreateLikeDto,
//     @Req() req: any,
//   ) {
//     const userId = req.user.sub;
//     this.validateLikeType(type, dto);
//     return this.postService.unlikeTarget(userId, dto);
//   }

//   @Get('has-liked/:targetType/:targetId')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Check if user has liked a post or comment' })
//   @ApiOkResponse({ description: 'Returns true or false' })
//   async hasLiked(
//     @Param('targetType') targetType: 'post' | 'comment',
//     @Param('targetId') targetId: string,
//     @Req() req: any,
//   ) {
//     const validTypes = { post: 'Post', comment: 'Comment' };
//     const resolvedType = validTypes[targetType];

//     if (!resolvedType) {
//       throw new BadRequestException(
//         'Invalid targetType. Use "post" or "comment".',
//       );
//     }

//     const userId = req.user.sub;
//     const exists = await this.postService.hasUserLiked(
//       userId,
//       targetId,
//       resolvedType as 'Post' | 'Comment',
//     );
//     return { liked: !!exists };
//   }

//   @Get(':postId/likes')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Get all users who liked a post' })
//   @ApiOkResponse({ description: 'Returns list of users' })
//   async getUsersWhoLikedPost(@Param('postId') postId: string) {
//     return await this.postService.getUsersWhoLikedPost(postId);
//   }

//   // ✅ Extracted validation logic into reusable method
//   private validateLikeType(type: 'post' | 'comment', dto: CreateLikeDto): void {
//     const validTypes = {
//       post: 'Post',
//       comment: 'Comment',
//     };

//     const expectedTargetType = validTypes[type];

//     if (!expectedTargetType) {
//       throw new BadRequestException(
//         'Invalid like type. Use "post" or "comment".',
//       );
//     }

//     if (dto.targetType !== expectedTargetType) {
//       throw new BadRequestException(
//         `Invalid targetType. Must be "${expectedTargetType}".`,
//       );
//     }
//   }
// }
