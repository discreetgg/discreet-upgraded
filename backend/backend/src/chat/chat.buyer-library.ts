import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Message, MessageType } from 'src/database/schemas/message.schema';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';
import { User } from 'src/database/schemas/user.schema';

const BUYER_LIBRARY_SELLER_SCAN_LIMIT = 250;

type ConversationMessagePage = {
  messages: any[];
  nextCursor: string | null;
  hasMore: boolean;
};

type KeysetCursor = {
  date: Date;
  id: mongoose.Types.ObjectId;
};

type BuyerLibraryDependencies = {
  messageModel: Model<Message>;
  paymentModel: Model<Payment>;
  userModel: Model<User>;
  normalizeLimit: (
    requestedLimit: number | undefined,
    defaults: { fallback: number; max: number },
  ) => number;
  decodeKeysetCursor: (cursor?: string) => KeysetCursor | null;
  encodeKeysetCursor: (
    date: Date | string,
    id: mongoose.Types.ObjectId | string,
  ) => string;
  escapeRegex: (value: string) => string;
  readObjectId: (value: any) => string | null;
  applyMediaPurchaseEntitlements: (
    messages: any[],
    requesterUserId: string,
  ) => Promise<void>;
  sanitizeMessageForClient: <T>(message: T) => T;
  defaultLimit: number;
  maxLimit: number;
};

type BuyerLibraryQuery = {
  requesterUserId: string;
  limit?: number;
  cursor?: string;
  sellerUsername?: string;
};

const readNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const fetchBuyerPurchasedMediaLibrary = async (
  deps: BuyerLibraryDependencies,
  query: BuyerLibraryQuery,
): Promise<ConversationMessagePage> => {
  const requesterObjectId = new mongoose.Types.ObjectId(query.requesterUserId);
  const safeLimit = deps.normalizeLimit(query.limit, {
    fallback: deps.defaultLimit,
    max: deps.maxLimit,
  });
  const cursorFilter = deps.decodeKeysetCursor(query.cursor);

  const paymentFilters: Record<string, any>[] = [
    { payer: requesterObjectId },
    {
      type: {
        $in: [PaymentType.MENU_PURCHASE, PaymentType.MEDIA_PURCHASE],
      },
    },
    { status: PaymentStatus.COMPLETED },
  ];

  const normalizedSellerUsername = readNonEmptyString(query.sellerUsername);
  if (normalizedSellerUsername) {
    const usernameRegex = new RegExp(
      `^${deps.escapeRegex(normalizedSellerUsername)}`,
      'i',
    );
    const matchedSellers = await deps.userModel
      .find({
        _id: { $ne: requesterObjectId },
        username: usernameRegex,
      })
      .select('_id')
      .limit(BUYER_LIBRARY_SELLER_SCAN_LIMIT)
      .lean();

    if (matchedSellers.length === 0) {
      return {
        messages: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    paymentFilters.push({
      receiver: { $in: matchedSellers.map((seller) => seller._id) },
    });
  }

  if (cursorFilter) {
    paymentFilters.push({
      $or: [
        { createdAt: { $lt: cursorFilter.date } },
        {
          createdAt: cursorFilter.date,
          _id: { $lt: cursorFilter.id },
        },
      ],
    });
  }

  const paymentQuery =
    paymentFilters.length === 1 ? paymentFilters[0] : { $and: paymentFilters };

  const paymentBatch = (await deps.paymentModel
    .find(paymentQuery)
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit + 1)
    .select('_id type receiver createdAt meta')
    .lean()
    .exec()) as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    type: PaymentType;
    receiver: mongoose.Types.ObjectId;
    createdAt: Date;
    meta?: Record<string, any>;
  }>;

  const hasMore = paymentBatch.length > safeLimit;
  const visiblePayments = hasMore
    ? paymentBatch.slice(0, safeLimit)
    : paymentBatch;

  if (visiblePayments.length === 0) {
    return {
      messages: [],
      nextCursor: null,
      hasMore,
    };
  }

  const resolvedMessageIdByPaymentId = new Map<string, string>();
  const pendingMenuFallbackByPaymentId = new Map<string, string>();
  const menuFallbackLookups = new Map<
    string,
    { sellerObjectId: mongoose.Types.ObjectId; menuId: string }
  >();

  for (const payment of visiblePayments) {
    const paymentId = payment._id.toString();
    const paymentMeta =
      payment.meta && typeof payment.meta === 'object' ? payment.meta : {};

    const deliveryMessageId = readNonEmptyString(
      (paymentMeta as Record<string, any>)?.delivery?.messageId,
    );
    if (
      deliveryMessageId &&
      mongoose.Types.ObjectId.isValid(deliveryMessageId)
    ) {
      resolvedMessageIdByPaymentId.set(paymentId, deliveryMessageId);
      continue;
    }

    if (payment.type === PaymentType.MEDIA_PURCHASE) {
      const mediaMessageId = readNonEmptyString(
        (paymentMeta as Record<string, any>)?.MessageAsset,
      );
      if (mediaMessageId && mongoose.Types.ObjectId.isValid(mediaMessageId)) {
        resolvedMessageIdByPaymentId.set(paymentId, mediaMessageId);
      }
      continue;
    }

    if (payment.type !== PaymentType.MENU_PURCHASE) {
      continue;
    }

    const menuId = readNonEmptyString(
      (paymentMeta as Record<string, any>)?.menuId,
    );
    const sellerId = deps.readObjectId(payment.receiver);
    if (
      !menuId ||
      !mongoose.Types.ObjectId.isValid(sellerId ?? '') ||
      !mongoose.Types.ObjectId.isValid(menuId)
    ) {
      continue;
    }

    const lookupKey = `${sellerId}:${menuId}`;
    pendingMenuFallbackByPaymentId.set(paymentId, lookupKey);
    if (!menuFallbackLookups.has(lookupKey)) {
      menuFallbackLookups.set(lookupKey, {
        sellerObjectId: new mongoose.Types.ObjectId(sellerId),
        menuId,
      });
    }
  }

  if (menuFallbackLookups.size > 0) {
    const menuFallbackQuery = Array.from(menuFallbackLookups.values()).map(
      (lookup) => ({
        sender: lookup.sellerObjectId,
        reciever: requesterObjectId,
        type: MessageType.MENU,
        'purchaseContext.sourceMenuId': lookup.menuId,
        media: { $exists: true, $ne: [] },
      }),
    );

    const fallbackMenuMessages =
      menuFallbackQuery.length === 0
        ? []
        : await deps.messageModel
            .find({ $or: menuFallbackQuery })
            .sort({ createdAt: -1, _id: -1 })
            .select('_id sender purchaseContext')
            .lean()
            .exec();

    const menuMessageByLookupKey = new Map<string, string>();
    for (const message of fallbackMenuMessages) {
      const senderId = deps.readObjectId(message.sender);
      const sourceMenuId = readNonEmptyString(
        message.purchaseContext?.sourceMenuId,
      );
      if (!senderId || !sourceMenuId) {
        continue;
      }
      const lookupKey = `${senderId}:${sourceMenuId}`;
      if (!menuMessageByLookupKey.has(lookupKey)) {
        menuMessageByLookupKey.set(lookupKey, message._id.toString());
      }
    }

    for (const [paymentId, lookupKey] of pendingMenuFallbackByPaymentId) {
      const fallbackMessageId = menuMessageByLookupKey.get(lookupKey);
      if (fallbackMessageId) {
        resolvedMessageIdByPaymentId.set(paymentId, fallbackMessageId);
      }
    }
  }

  const resolvedMessageObjectIds = Array.from(
    new Set(Array.from(resolvedMessageIdByPaymentId.values())),
  )
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (resolvedMessageObjectIds.length === 0) {
    const oldestVisiblePayment = visiblePayments[visiblePayments.length - 1] as
      | { createdAt?: string | Date; _id?: string | mongoose.Types.ObjectId }
      | undefined;
    const nextCursor =
      hasMore && oldestVisiblePayment?.createdAt && oldestVisiblePayment?._id
        ? deps.encodeKeysetCursor(
            oldestVisiblePayment.createdAt,
            oldestVisiblePayment._id,
          )
        : null;

    return {
      messages: [],
      nextCursor,
      hasMore,
    };
  }

  const messageDocs = await deps.messageModel
    .find({
      _id: { $in: resolvedMessageObjectIds },
      reciever: requesterObjectId,
      type: {
        $in: [
          MessageType.MEDIA,
          MessageType.MENU,
          MessageType.IN_MESSAGE_MEDIA,
        ],
      },
      media: { $exists: true, $ne: [] },
    })
    .select(
      '_id conversation sender reciever type media isPayable price paid purchaseContext title text createdAt updatedAt',
    )
    .populate({
      path: 'sender',
      select:
        'id discordId username displayName discordAvatar role profileImage',
    })
    .populate({
      path: 'reciever',
      select:
        'id discordId username displayName discordAvatar role profileImage',
    })
    .populate({
      path: 'media',
      select:
        '_id url public_id type caption price isPayable paid post owner uploadedAt createdAt updatedAt __v',
    })
    .lean()
    .exec();

  await deps.applyMediaPurchaseEntitlements(
    messageDocs as any[],
    query.requesterUserId,
  );

  const messageById = new Map(
    messageDocs.map((message) => [message._id.toString(), message]),
  );
  const seenMessageIds = new Set<string>();
  const orderedMessages = visiblePayments
    .map((payment) => {
      const paymentId = payment._id.toString();
      const messageId = resolvedMessageIdByPaymentId.get(paymentId);
      if (!messageId || seenMessageIds.has(messageId)) {
        return null;
      }
      const message = messageById.get(messageId);
      if (!message) {
        return null;
      }
      seenMessageIds.add(messageId);
      return {
        ...message,
        libraryPurchase: {
          paymentId,
          purchasedAt: payment.createdAt,
          purchaseType:
            payment.type === PaymentType.MENU_PURCHASE ? 'menu' : 'media',
        },
      };
    })
    .filter((message): message is any => Boolean(message))
    .map((message) => deps.sanitizeMessageForClient(message));

  const oldestVisiblePayment = visiblePayments[visiblePayments.length - 1] as
    | { createdAt?: string | Date; _id?: string | mongoose.Types.ObjectId }
    | undefined;
  const nextCursor =
    hasMore && oldestVisiblePayment?.createdAt && oldestVisiblePayment?._id
      ? deps.encodeKeysetCursor(
          oldestVisiblePayment.createdAt,
          oldestVisiblePayment._id,
        )
      : null;

  return {
    messages: orderedMessages,
    nextCursor,
    hasMore,
  };
};
