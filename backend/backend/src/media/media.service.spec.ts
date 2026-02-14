import { ForbiddenException } from '@nestjs/common';
import mongoose from 'mongoose';
import { MediaService } from './media.service';
import { MessageType } from 'src/database/schemas/message.schema';

const makeMediaQuery = (value: any) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const makeUserQuery = (value: any) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
  }),
});

const makeMessageQuery = (value: any) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
  }),
});

const makeMessageReferenceQuery = (value: any) => ({
  sort: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(value),
    }),
  }),
});

describe('MediaService.assertCanReadMedia', () => {
  const mediaModel = {
    findById: jest.fn(),
  };
  const userModel = {
    findOne: jest.fn(),
  };
  const messageModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };
  const paymentModel = {
    exists: jest.fn(),
  };

  let service: MediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaService(
      mediaModel as any,
      userModel as any,
      messageModel as any,
      paymentModel as any,
    );
  });

  it('allows receiver access when receiver has completed entitlement', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();
    const mediaId = new mongoose.Types.ObjectId();

    const media = {
      _id: mediaId,
      chat: messageId,
      owner: sellerId,
      caption: 'content image',
    };

    mediaModel.findById.mockReturnValue(makeMediaQuery(media));
    userModel.findOne.mockReturnValue(makeUserQuery({ _id: buyerId }));
    messageModel.findById.mockReturnValue(
      makeMessageQuery({
        _id: messageId,
        sender: sellerId,
        reciever: buyerId,
        isPayable: true,
        paid: false,
        type: MessageType.IN_MESSAGE_MEDIA,
      }),
    );
    paymentModel.exists.mockResolvedValue(true);

    const result = await service.assertCanReadMedia(
      mediaId.toString(),
      'buyer-discord-id',
    );

    expect(result).toEqual(media);
    expect(paymentModel.exists).toHaveBeenCalledWith(
      expect.objectContaining({
        'meta.MessageAsset': messageId.toString(),
        payer: buyerId,
      }),
    );
    expect(messageModel.findOne).not.toHaveBeenCalled();
  });

  it('blocks receiver without entitlement even if message.paid is true globally', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();
    const mediaId = new mongoose.Types.ObjectId();

    mediaModel.findById.mockReturnValue(
      makeMediaQuery({
        _id: mediaId,
        chat: messageId,
        owner: sellerId,
        caption: 'content image',
      }),
    );
    userModel.findOne.mockReturnValue(makeUserQuery({ _id: buyerId }));
    messageModel.findById.mockReturnValue(
      makeMessageQuery({
        _id: messageId,
        sender: sellerId,
        reciever: buyerId,
        isPayable: true,
        paid: true,
        type: MessageType.IN_MESSAGE_MEDIA,
      }),
    );
    paymentModel.exists.mockResolvedValue(false);

    await expect(
      service.assertCanReadMedia(mediaId.toString(), 'buyer-discord-id'),
    ).rejects.toThrow(new ForbiddenException('This media is locked'));
    expect(messageModel.findOne).not.toHaveBeenCalled();
  });

  it('preserves buyer isolation under concurrent access checks', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const buyerOneId = new mongoose.Types.ObjectId();
    const buyerTwoId = new mongoose.Types.ObjectId();
    const messageOneId = new mongoose.Types.ObjectId();
    const messageTwoId = new mongoose.Types.ObjectId();
    const mediaOneId = new mongoose.Types.ObjectId();
    const mediaTwoId = new mongoose.Types.ObjectId();

    const buyersByDiscordId: Record<string, { _id: mongoose.Types.ObjectId }> =
      {
        'buyer-one': { _id: buyerOneId },
        'buyer-two': { _id: buyerTwoId },
      };

    const messagesById: Record<string, any> = {
      [messageOneId.toString()]: {
        _id: messageOneId,
        sender: sellerId,
        reciever: buyerOneId,
        isPayable: true,
        paid: false,
        type: MessageType.IN_MESSAGE_MEDIA,
      },
      [messageTwoId.toString()]: {
        _id: messageTwoId,
        sender: sellerId,
        reciever: buyerTwoId,
        isPayable: true,
        paid: false,
        type: MessageType.IN_MESSAGE_MEDIA,
      },
    };

    const mediaById: Record<string, any> = {
      [mediaOneId.toString()]: {
        _id: mediaOneId,
        chat: messageOneId,
        owner: sellerId,
        caption: 'content image',
      },
      [mediaTwoId.toString()]: {
        _id: mediaTwoId,
        chat: messageTwoId,
        owner: sellerId,
        caption: 'content image',
      },
    };

    mediaModel.findById.mockImplementation((id: string) => {
      return makeMediaQuery(mediaById[id]);
    });
    userModel.findOne.mockImplementation((query: { discordId: string }) => {
      return makeUserQuery(buyersByDiscordId[query.discordId]);
    });
    messageModel.findById.mockImplementation((id: mongoose.Types.ObjectId) => {
      return makeMessageQuery(messagesById[id.toString()]);
    });
    paymentModel.exists.mockImplementation((query: any) => {
      const payer = query?.payer?.toString?.();
      const targetMessageId = query?.['meta.MessageAsset'];
      return Promise.resolve(
        payer === buyerOneId.toString() &&
          targetMessageId === messageOneId.toString(),
      );
    });

    const [buyerOneResult, buyerTwoResult] = await Promise.allSettled([
      service.assertCanReadMedia(mediaOneId.toString(), 'buyer-one'),
      service.assertCanReadMedia(mediaTwoId.toString(), 'buyer-two'),
    ]);

    expect(buyerOneResult.status).toBe('fulfilled');
    expect(buyerTwoResult.status).toBe('rejected');
    if (buyerTwoResult.status === 'rejected') {
      expect(buyerTwoResult.reason).toBeInstanceOf(ForbiddenException);
      expect((buyerTwoResult.reason as ForbiddenException).message).toBe(
        'This media is locked',
      );
    }
  });

  it('allows access for menu media referenced by a buyer-visible message even when media.chat is empty', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const buyerId = new mongoose.Types.ObjectId();
    const mediaId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();

    mediaModel.findById.mockReturnValue(
      makeMediaQuery({
        _id: mediaId,
        owner: sellerId,
        chat: undefined,
        caption: 'menu item preview',
      }),
    );
    userModel.findOne.mockReturnValue(makeUserQuery({ _id: buyerId }));
    messageModel.findOne.mockReturnValue(
      makeMessageReferenceQuery({
        _id: messageId,
        sender: sellerId,
        reciever: buyerId,
        isPayable: false,
        paid: false,
        type: MessageType.MENU,
      }),
    );

    const result = await service.assertCanReadMedia(
      mediaId.toString(),
      'buyer-discord-id',
    );

    expect((result as any)._id).toEqual(mediaId);
    expect(messageModel.findById).not.toHaveBeenCalled();
    expect(paymentModel.exists).not.toHaveBeenCalled();
  });
});
