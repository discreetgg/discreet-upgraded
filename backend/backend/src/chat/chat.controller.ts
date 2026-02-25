import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { ChatService } from './chat.service';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  CreateInMessageMediaDto,
  CreateMessageWithMediaDto,
} from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatGateway } from './chat.gateway';
import { AcceptCallDto, EndCallDto, StartCallDto } from './dto/call.dto';
import { NoteDto } from './dto/note.dto';
import { GetConversationDto } from './dto/get-conversation.dto';
import { GetConversationListDto } from './dto/get-conversation-list.dto';
import { GetConversationMessagesDto } from './dto/get-conversation-messages.dto';
import { GetBuyerLibraryDto } from './dto/get-buyer-library.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  // ----------------- Conversations ------------------

  @Get('conversations-between')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get conversation between two Discord users',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation returned successfully.',
  })
  @ApiQuery({
    name: 'discordIds',
  })
  async getUsersConversation(
    @Req() req: any,
    @Query() query: GetConversationDto,
  ) {
    const { discordIds } = query;
    const requesterDiscordId: string | undefined = req?.user?.sub;

    if (
      !requesterDiscordId ||
      !Array.isArray(discordIds) ||
      !discordIds.includes(requesterDiscordId)
    ) {
      throw new ForbiddenException(
        'You can only request conversations that include your account',
      );
    }

    return this.chatService.getUsersConversationsUsingIds(discordIds);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all conversations for the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 30 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getConversationList(
    @Req() req: any,
    @Query() query: GetConversationListDto,
  ) {
    return this.chatService.getUserConversations(req.user.userId, {
      limit: query.limit,
      cursor: query.cursor,
      search: query.search,
    });
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single conversation with messages' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2025-02-01T00:00:00Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation details with messages',
  })
  async getConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query() query: GetConversationMessagesDto,
  ): Promise<any> {
    return this.chatService.fetchConversation(
      conversationId,
      req.user.userId,
      query.limit,
      query.cursor,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  @Get('conversations/:id/shared-media')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated media-only messages for shared media vault',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 40 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Conversation shared media payload',
  })
  async getConversationSharedMedia(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Query() query: GetConversationMessagesDto,
  ): Promise<any> {
    return this.chatService.fetchConversationSharedMedia(
      conversationId,
      req.user.userId,
      query.limit,
      query.cursor,
    );
  }

  @Get('library/purchased-media')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get buyer purchased media library across all conversations',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 40 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'sellerUsername', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Buyer purchased media library payload',
  })
  async getBuyerPurchasedMediaLibrary(
    @Req() req: { user: { userId: string } },
    @Query() query: GetBuyerLibraryDto,
  ): Promise<any> {
    return this.chatService.fetchBuyerPurchasedMediaLibrary(
      req.user.userId,
      query.limit,
      query.cursor,
      query.sellerUsername,
    );
  }

  @Patch('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Mark all unread messages in conversation as read for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread messages marked as read',
  })
  async markConversationAsRead(
    @Req() req: any,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.markConversationAsRead(
      conversationId,
      req.user.userId,
    );
  }

  // ----------------- Messages ------------------

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Send a message with media (text, image, or video)',
  })
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Req() req: any,
    @Body() dto: CreateMessageWithMediaDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.sendMessageWithMedia(
      req.user.sub,
      dto,
      files,
      dto.mediaMeta,
    );
  }

  @Post('media-assets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Send an in-message media assets',
  })
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(CreateInMessageMediaDto)
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateInMessageMediaDto) },
        {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendInMessageMedia(
    @Req() req: any,
    @Body() dto: CreateInMessageMediaDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.sendMessageWithMedia_likeMenu(
      req.user.sub,
      dto,
      files,
      dto.mediaMeta ?? [],
    );
  }

  // ----------------- Online presence ------------------
  @Get('online-users')
  @ApiOperation({ summary: 'Get all online users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getOnlineUsers() {
    return this.chatGateway.getOnlineUsers();
  }

  // ----------------- calls ------------------

  @Post('call')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'start a call session',
  })
  async startCallSession(@Req() req: any, @Body() dto: StartCallDto) {
    if (dto.callerId !== req.user.sub) {
      throw new ForbiddenException('Caller mismatch');
    }
    return this.chatService.createCallSession(dto);
  }

  @Patch('call')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'set Ongoing call session ',
  })
  async setOngoinCall(@Req() req: any, @Body() dto: AcceptCallDto) {
    return this.chatService.markCallOngoingForParticipant(
      dto.callId,
      req.user.sub,
    );
  }

  @Patch('call-end')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'end call session ',
  })
  async endCallSession(@Req() req: any, @Body() dto: EndCallDto) {
    if (dto.callerId !== req.user.sub && dto.calleeId !== req.user.sub) {
      throw new ForbiddenException('Not authorized to end this call');
    }
    return this.chatService.endCall(dto, req.user.sub);
  }

  // ----------------- notes ------------------

  @Post('note')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create/update a chat note between seller and buyer',
  })
  @ApiResponse({ status: 201, description: 'Note created' })
  note(@Body() dto: NoteDto, @Req() req: any) {
    if (dto.seller !== req.user.sub && dto.buyer !== req.user.sub) {
      throw new ForbiddenException('Not authorized to update this note');
    }
    return this.chatService.upsertNote(dto);
  }

  @Get('note')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get  note between seller and buyer' })
  @ApiQuery({ name: 'seller', required: true })
  @ApiQuery({ name: 'buyer', required: true })
  @ApiResponse({ status: 200, description: 'note returned' })
  fetchNote(
    @Query('seller') seller: string,
    @Query('buyer') buyer: string,
    @Req() req: any,
  ) {
    if (seller !== req.user.sub && buyer !== req.user.sub) {
      throw new ForbiddenException('Not authorized to access this note');
    }
    return this.chatService.getNotes(seller, buyer);
  }

  @Delete('note/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a chat note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note deleted' })
  removeNote(@Param('id') id: string, @Req() req: any) {
    return this.chatService.deleteNote(id, req.user.sub);
  }

  //   @Post('messages')
  //   @ApiOperation({ summary: 'Send a message (text, image, or video)' })
  //   @UseInterceptors(FilesInterceptor('files'))
  //   @ApiConsumes('multipart/form-data')
  //   @ApiBody({
  //     schema: {
  //       type: 'object',
  //       properties: {
  //         conversationId: { type: 'string' },
  //         sender: { type: 'string' },
  //         reciever: { type: 'string' },
  //         type: {
  //           type: 'string',
  //           enum: ['text', 'image', 'video', 'system'],
  //         },
  //         text: { type: 'string' },
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
  //         status: {
  //           type: 'string',
  //           enum: ['sent', 'delivered', 'read'],
  //         },
  //         replyTo: { type: 'string' },
  //       },
  //     },
  //   })
  //   @ApiResponse({ status: 201, description: 'Message sent successfully' })
  //   async sendMessage(
  //     @Req() req: any,
  //     @Body() dto: CreateMessageDto,
  //     @Body('mediaMeta') mediaMetaRaw: string,
  //     @UploadedFiles() files: Express.Multer.File[],
  //   ) {
  //     let messageDto: CreateMessageDto;

  //     try {
  //       // Parse and validate the incoming data using the DTO class
  //       messageDto = new CreateMessageDto();

  //       if (dto.conversationId) messageDto.conversationId = dto.conversationId;
  //       if (dto.sender) messageDto.sender = dto.sender;
  //       if (dto.reciever) messageDto.reciever = dto.reciever;
  //       if (dto.type) {
  //         let parsedType: MessageType;
  //       }
  //       if (dto.status) messageDto.status = dto.status;
  //       if (dto.replyTo) messageDto.replyTo = dto.replyTo;

  //       await validateOrReject(messageDto);
  //     } catch (error) {
  //       throw new BadRequestException(
  //         'Invalid post data: ' + (error?.message || error),
  //       );
  //     }

  //     let mediaMeta: MessageMediaMetaDto[] = [];
  //     try {
  //       const parsed = mediaMetaRaw ? JSON.parse(`[${mediaMetaRaw}]`) : [];

  //       if (!Array.isArray(parsed)) {
  //         throw new Error();
  //       }
  //       // ✅ Transform plain objects into class instances
  //       mediaMeta = plainToInstance(MessageMediaMetaDto, parsed);

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
  //     return this.chatService.sendMessage(req.user.userId, dto, files, mediaMeta);
  //   }
}
