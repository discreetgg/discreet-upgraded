import mongoose from 'mongoose';
import { ChatService } from './chat.service';
import { MessageType } from 'src/database/schemas/message.schema';

describe('ChatService - media entitlement projection', () => {
  const messageModel = {};
  const conversationModel = {};
  const mediaModel = {};
  const inMessageMediaModel = {};
  const userModel = {};
  const chatNoteModel = {};
  const fileUploaderService = {};
  const walletService = {};
  const paymentService = {
    getCompletedMediaPurchaseAssetIdsForBuyer: jest.fn(),
  };

  let service: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService(
      messageModel as any,
      conversationModel as any,
      mediaModel as any,
      inMessageMediaModel as any,
      userModel as any,
      chatNoteModel as any,
      fileUploaderService as any,
      walletService as any,
      paymentService as any,
    );
  });

  it('forces locked state for receiver without entitlement even if legacy paid=true', async () => {
    const requesterUserId = new mongoose.Types.ObjectId().toString();
    const messageId = new mongoose.Types.ObjectId().toString();
    const senderId = new mongoose.Types.ObjectId().toString();

    const messages = [
      {
        _id: messageId,
        type: MessageType.IN_MESSAGE_MEDIA,
        isPayable: true,
        paid: true,
        sender: { _id: senderId },
        reciever: { _id: requesterUserId },
        media: [{ _id: 'media-1', paid: true }],
      },
    ];

    paymentService.getCompletedMediaPurchaseAssetIdsForBuyer.mockResolvedValue(
      new Set<string>(),
    );

    await (service as any).applyMediaPurchaseEntitlements(
      messages,
      requesterUserId,
    );

    expect(messages[0].paid).toBe(false);
    expect(messages[0].media[0].paid).toBe(false);
  });

  it('marks receiver entitlement for top-level message and reply target', async () => {
    const requesterUserId = new mongoose.Types.ObjectId().toString();
    const messageId = new mongoose.Types.ObjectId().toString();
    const replyId = new mongoose.Types.ObjectId().toString();
    const senderId = new mongoose.Types.ObjectId().toString();

    const messages = [
      {
        _id: messageId,
        type: MessageType.IN_MESSAGE_MEDIA,
        isPayable: true,
        paid: false,
        sender: { _id: senderId },
        reciever: { _id: requesterUserId },
        media: [{ _id: 'media-1', paid: false }],
        replyTo: {
          _id: replyId,
          type: MessageType.IN_MESSAGE_MEDIA,
          isPayable: true,
          paid: false,
          sender: { _id: senderId },
          reciever: { _id: requesterUserId },
          media: [{ _id: 'media-2', paid: false }],
        },
      },
    ];

    paymentService.getCompletedMediaPurchaseAssetIdsForBuyer.mockResolvedValue(
      new Set<string>([messageId, replyId]),
    );

    await (service as any).applyMediaPurchaseEntitlements(
      messages,
      requesterUserId,
    );

    expect(messages[0].paid).toBe(true);
    expect(messages[0].media[0].paid).toBe(true);
    expect(messages[0].replyTo.paid).toBe(true);
    expect(messages[0].replyTo.media[0].paid).toBe(true);
  });
});
