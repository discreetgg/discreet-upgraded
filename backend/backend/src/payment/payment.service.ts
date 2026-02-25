import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import {
  CollectionType,
  Menu,
  PromoType,
} from 'src/database/schemas/menu.schema';
import { User } from 'src/database/schemas/user.schema';
import { WalletService } from 'src/wallet/wallet.service';
import { TipDto } from './dto/tip.dto';
import { NotificationService } from 'src/notification/notification.service';
import { SendEmailDto } from 'src/notification/dto/email.dto';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';
import { BuyMenuDto } from './dto/buy-menu.dto';
import { SubscribeUserDto } from './dto/subscribe.dto';
import { SubscriptionPlan } from 'src/database/schemas/subscription-plan.schema';
import {
  SubscriptionStatus,
  UserSubscription,
} from 'src/database/schemas/user-subscription.schema';
import { PayInMessageMediaAssetDto } from './dto/pay-in-message-asset.dto';
import {
  Message,
  MessagePurchaseContext,
  MessagePurchaseType,
  MessageStatus,
  MessageType,
  PurchaseOriginSurface,
} from 'src/database/schemas/message.schema';
import { ChatService } from 'src/chat/chat.service';
import { CreateMessageMenuDto } from 'src/chat/dto/create-message.dto';
import { ChatGateway } from 'src/chat/chat.gateway';
import {
  Transaction,
  TransactionStatus,
} from 'src/database/schemas/transaction.schema';
import { PayCallDto } from './dto/pay-call.dto';
import { MenuMedia } from 'src/database/schemas/menu-media.schema';
import {
  CreateNotificationDto,
  NotificationEntityType,
} from 'src/notification/dto/in-app-notification.dto';
import { Media } from 'src/database/schemas/media.schema';
import { Post } from 'src/database/schemas/post.schema';
import {
  getOrderedMenuPreviewMediaIds,
  getSourcePostPreviewMediaIds,
} from './menu-preview-resolver';
@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  private static readonly MENU_PURCHASE_MODE = {
    SINGLE: 'single',
    BUNDLE: 'bundle',
  } as const;
  private getMenuPurchasePlan(
    menu: Pick<Menu, 'collectionType' | 'itemCount' | 'priceToView' | 'promo'>,
  ) {
    const pricing = this.resolveMenuUnitPricing(menu);
    if (pricing.appliedUnitPrice <= 0) {
      throw new BadRequestException(
        'Menu price is invalid. Ask the seller to update this menu item.',
      );
    }
    const normalizedItemCount = Math.max(
      1,
      Number.isFinite(menu.itemCount)
        ? Math.floor(menu.itemCount as number)
        : 1,
    );
    const isBundleMenu =
      menu.collectionType === CollectionType.BUNDLES || normalizedItemCount > 1;
    const quantity = isBundleMenu ? normalizedItemCount : 1;
    const totalPrice = pricing.appliedUnitPrice;
    const mode = isBundleMenu
      ? PaymentService.MENU_PURCHASE_MODE.BUNDLE
      : PaymentService.MENU_PURCHASE_MODE.SINGLE;
    return {
      mode,
      quantity,
      itemCount: normalizedItemCount,
      unitPrice: pricing.appliedUnitPrice,
      baseUnitPrice: pricing.baseUnitPrice,
      discountPerItem: pricing.discountPerItem,
      promoApplied: pricing.promoApplied,
      promoMetadata: pricing.promoMetadata,
      totalPrice,
    };
  }
  private resolveMenuUnitPricing(
    menu: Pick<Menu, 'priceToView' | 'promo'>,
    now: Date = new Date(),
  ) {
    const baseUnitPrice = Number(menu.priceToView);
    if (!Number.isFinite(baseUnitPrice) || baseUnitPrice <= 0) {
      return {
        baseUnitPrice: 0,
        appliedUnitPrice: 0,
        discountPerItem: 0,
        promoApplied: false,
        promoMetadata: null,
      };
    }
    const promo = menu.promo;
    if (!promo?.isEnabled) {
      return {
        baseUnitPrice,
        appliedUnitPrice: baseUnitPrice,
        discountPerItem: 0,
        promoApplied: false,
        promoMetadata: null,
      };
    }
    const startsAt = promo.startsAt ? new Date(promo.startsAt) : null;
    const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;
    const isBeforePromoWindow = startsAt && now < startsAt;
    const isAfterPromoWindow = endsAt && now > endsAt;
    if (isBeforePromoWindow || isAfterPromoWindow) {
      return {
        baseUnitPrice,
        appliedUnitPrice: baseUnitPrice,
        discountPerItem: 0,
        promoApplied: false,
        promoMetadata: null,
      };
    }
    const promoValue = Number(promo.value);
    if (!Number.isFinite(promoValue) || promoValue <= 0) {
      return {
        baseUnitPrice,
        appliedUnitPrice: baseUnitPrice,
        discountPerItem: 0,
        promoApplied: false,
        promoMetadata: null,
      };
    }
    let discountPerItem =
      promo.type === PromoType.PERCENTAGE
        ? (baseUnitPrice * promoValue) / 100
        : promoValue;
    discountPerItem = Math.max(0, Math.min(discountPerItem, baseUnitPrice));
    const appliedUnitPrice = Number(
      (baseUnitPrice - discountPerItem).toFixed(2),
    );
    if (appliedUnitPrice <= 0) {
      return {
        baseUnitPrice,
        appliedUnitPrice: baseUnitPrice,
        discountPerItem: 0,
        promoApplied: false,
        promoMetadata: null,
      };
    }
    return {
      baseUnitPrice,
      appliedUnitPrice,
      discountPerItem: Number(discountPerItem.toFixed(2)),
      promoApplied: true,
      promoMetadata: {
        type: promo.type,
        value: promo.value,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        message: promo.message ?? '',
      },
    };
  }
  private async getOrderedMenuMedia(menu: {
    media?: Array<string | Types.ObjectId>;
  }) {
    const menuMediaIds = (menu.media ?? []).map((id) => id.toString());
    if (menuMediaIds.length === 0) {
      return [];
    }
    const menuMediaDocs = await this.menuMediaModel
      .find({
        _id: {
          $in: menuMediaIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .select('_id media')
      .lean();
    const menuMediaById = new Map(
      menuMediaDocs.map((doc) => [doc._id.toString(), doc]),
    );
    return menuMediaIds
      .map((id) => menuMediaById.get(id))
      .filter((doc): doc is (typeof menuMediaDocs)[number] => Boolean(doc));
  }
  private async findExistingCompletedMenuPurchase(args: {
    buyerUserId: Types.ObjectId;
    sellerUserId: Types.ObjectId;
    menuId: Types.ObjectId;
  }) {
    const { buyerUserId, sellerUserId, menuId } = args;
    return this.paymentModel
      .findOne({
        type: PaymentType.MENU_PURCHASE,
        status: PaymentStatus.COMPLETED,
        payer: buyerUserId,
        receiver: sellerUserId,
        'meta.menuId': menuId.toString(),
      })
      .sort({ createdAt: -1 });
  }
  private normalizeOriginSurface(surface?: string | PurchaseOriginSurface) {
    if (!surface) {
      return PurchaseOriginSurface.UNKNOWN;
    }
    const normalized = surface.toString().trim().toLowerCase();
    switch (normalized) {
      case PurchaseOriginSurface.FEED:
      case PurchaseOriginSurface.PROFILE:
      case PurchaseOriginSurface.MENU:
      case PurchaseOriginSurface.DM:
        return normalized as PurchaseOriginSurface;
      default:
        return PurchaseOriginSurface.UNKNOWN;
    }
  }
  private readDeliveryMeta(meta: Record<string, any> | undefined) {
    const delivery =
      meta && typeof meta.delivery === 'object' ? meta.delivery : null;
    if (!delivery) {
      return {
        conversationId: null as string | null,
        messageId: null as string | null,
        receiptMessageId: null as string | null,
      };
    }
    const readString = (value: unknown) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };
    return {
      conversationId: readString(delivery.conversationId),
      messageId: readString(delivery.messageId),
      receiptMessageId: readString(delivery.receiptMessageId),
    };
  }
  private buildMenuPurchaseContext(args: {
    menuId: string;
    menuTitle: string;
    sourcePostId?: string | null;
    originSurface?: string | PurchaseOriginSurface;
    sourceConversationId?: string;
    sourceMessageId?: string;
  }): MessagePurchaseContext {
    return {
      originSurface: this.normalizeOriginSurface(args.originSurface),
      sourcePostId: args.sourcePostId ?? undefined,
      sourceMenuId: args.menuId,
      sourceConversationId: args.sourceConversationId,
      sourceMessageId: args.sourceMessageId,
      sourceLabel: args.menuTitle,
      purchaseType: MessagePurchaseType.MENU,
    };
  }
  private async createPurchaseReceiptMessage(args: {
    conversationId: string | Types.ObjectId;
    buyerUserId: string;
    sellerUserId: string;
    replyToMessageId: string;
    priceInDollars: string;
    purchaseContext?: MessagePurchaseContext;
  }) {
    const receiptText = `Content unlocked for $${args.priceInDollars}`;
    return this.messageModel.create({
      conversation: args.conversationId,
      sender: args.buyerUserId,
      reciever: args.sellerUserId,
      type: MessageType.TEXT,
      text: receiptText,
      status: MessageStatus.SENT,
      price: args.priceInDollars,
      replyTo: args.replyToMessageId,
      purchaseContext: args.purchaseContext,
    });
  }
  constructor(
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    @InjectModel(MenuMedia.name)
    private readonly menuMediaModel: Model<MenuMedia>,
    @InjectModel(Media.name) private readonly mediaModel: Model<Media>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlan>,
    @InjectModel(UserSubscription.name)
    private readonly userSubscriptionModel: Model<UserSubscription>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
  ) {}
  async reservePayment(
    payerId: string,
    amount: number,
    meta: any,
    session?: ClientSession,
  ) {
    const resTx = await this.walletService.reserve(
      payerId,
      amount,
      meta,
      session,
    );
    const receiverId = meta.toUser || meta.receiverId;
    if (!receiverId) throw new BadRequestException('Missing receiver in meta');
    const paymentData = {
      payer: payerId,
      receiver: receiverId,
      amount: this.walletService.toCent(amount),
      type: meta.type,
      meta: meta ?? null,
      debitTx: resTx.tx._id,
      status: PaymentStatus.RESERVED,
    };
    const [payment] = await this.paymentModel.create([paymentData], {
      session,
    });
    return payment;
  }
  async reserveCallPayment(
    payerId: string,
    amount: number,
    meta: any,
    paymentTxId?: string,
    session?: ClientSession,
  ) {
    if (paymentTxId) {
      const newResTx = await this.walletService.reserve(
        payerId,
        amount,
        meta,
        session,
      );
      const paymentQuery = this.paymentModel.findByIdAndUpdate(
        paymentTxId,
        {
          $push: { batchDebitTx: newResTx.tx._id },
          $inc: { amount: this.walletService.toCent(amount) },
        },
        { new: true },
      );
      if (session) paymentQuery.session(session);
      const payment = await paymentQuery;
      if (!payment) {
        throw new NotFoundException(
          'Call payment reservation record not found',
        );
      }
      return payment;
    } else {
      const resTx = await this.walletService.reserve(
        payerId,
        amount,
        meta,
        session,
      );
      const receiverId = meta.toUser || meta.receiverId;
      if (!receiverId)
        throw new BadRequestException('Missing receiver in meta');
      const paymentData = {
        payer: payerId,
        receiver: receiverId,
        amount: this.walletService.toCent(amount),
        type: meta.type,
        meta: meta ?? null,
        debitTx: resTx.tx._id,
        batchDebitTx: [resTx.tx._id],
        status: PaymentStatus.RESERVED,
      };
      const [payment] = await this.paymentModel.create([paymentData], {
        session,
      });
      return payment;
    }
  }
  async hasCompletedMediaPurchaseForBuyer(
    messageAssetId: string,
    buyerUserId: string,
  ): Promise<boolean> {
    const existingPayment = await this.paymentModel.exists({
      type: PaymentType.MEDIA_PURCHASE,
      status: PaymentStatus.COMPLETED,
      payer: new Types.ObjectId(buyerUserId),
      'meta.MessageAsset': messageAssetId,
    });
    return Boolean(existingPayment);
  }
  async getCompletedMediaPurchaseAssetIdsForBuyer(
    buyerUserId: string,
    messageAssetIds: string[],
  ): Promise<Set<string>> {
    if (messageAssetIds.length === 0) {
      return new Set<string>();
    }
    const normalizedIds = [...new Set(messageAssetIds)];
    const payments = await this.paymentModel
      .find({
        type: PaymentType.MEDIA_PURCHASE,
        status: PaymentStatus.COMPLETED,
        payer: new Types.ObjectId(buyerUserId),
        'meta.MessageAsset': { $in: normalizedIds },
      })
      .select('meta.MessageAsset')
      .lean();
    const entitledIds = new Set<string>();
    for (const payment of payments) {
      const id = payment?.meta?.MessageAsset;
      if (typeof id === 'string' && id.length > 0) {
        entitledIds.add(id);
      }
    }
    return entitledIds;
  }
  async commitPayment(paymentId: string, session?: ClientSession) {
    let localSession = false;
    if (!session) {
      session = await this.connection.startSession();
      session.startTransaction();
      localSession = true;
    }
    try {
      const payment = await this.paymentModel
        .findById(paymentId)
        .session(session);
      if (!payment || payment.status !== PaymentStatus.RESERVED)
        throw new BadRequestException('Invalid or non-reserved payment');
      const { commitTx } = await this.walletService.commitReservation(
        payment.debitTx.toString(),
        session,
      );
      const meta = { ...payment.meta, referencePaymentId: payment._id };
      const creditTx = await this.walletService.credit(
        payment.receiver.toString(),
        this.walletService.toDollar(payment.amount),
        meta,
        session,
      );
      payment.debitTx = commitTx._id;
      payment.creditTx = creditTx.tx._id;
      payment.status = PaymentStatus.COMPLETED;
      await payment.save({ session });
      if (localSession) {
        await session.commitTransaction();
      }
      return payment;
    } catch (err) {
      if (localSession) {
        await session.abortTransaction();
      }
      try {
        await this.paymentModel.findByIdAndUpdate(paymentId, {
          status: PaymentStatus.FAILED,
        });
      } catch {}
      throw err;
    } finally {
      if (localSession) await session.endSession();
    }
  }
  async releasePayment(paymentId: string) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const payment = await this.paymentModel
        .findById(paymentId)
        .session(session);
      if (!payment || payment.status !== PaymentStatus.RESERVED)
        throw new BadRequestException('Invalid payment for release');
      await this.walletService.releaseReservation(
        payment.debitTx.toString(),
        session,
      );
      payment.status = PaymentStatus.RELEASED;
      await payment.save({ session });
      await session.commitTransaction();
      return payment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async tipCreator(dto: TipDto) {
    if (dto.receiverId === dto.tipperId) {
      throw new Error('You cant tip yourself');
    }
    const tipperWallet = await this.walletService.getWallet(dto.tipperId);
    const sellerWallet = await this.walletService.getWallet(dto.receiverId);
    if (!tipperWallet) throw new Error('User does not have an active wallet');
    if (!sellerWallet) throw new Error('Seller does not have an active wallet');
    if (tipperWallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient funds');
    }
    const tipper = await this.userModel.findOne({ discordId: dto.tipperId });
    const receiver = await this.userModel.findOne({
      discordId: dto.receiverId,
    });
    const meta = {
      type: PaymentType.TIP,
      fromUser: tipper._id.toString(),
      toUser: receiver._id.toString(),
      ...(dto.postId && { post: dto.postId }),
    };
    const session = await this.connection.startSession();
    try {
      const payment = await this.reservePayment(
        tipper._id.toString(),
        dto.amount,
        meta,
        session,
      );
      const result = await this.commitPayment(payment._id.toString());
      const receiverMailPayload: SendEmailDto = {
        recipients: [receiver.email],
        subject: 'TIP NOTIFICATION',
        html: `<h1>Hello ${receiver.username}!</h1>
             <p>${tipper.username} tipped you $${dto.amount}.</p>`,
      };
      const senderMailPayload: SendEmailDto = {
        recipients: [tipper.email],
        subject: 'TIP NOTIFICATION',
        html: `<h1>Hello ${tipper.username}!</h1>
             <p>You tipped ${receiver.username} $${dto.amount}.</p>`,
      };
      const inAppNotficationPayload: CreateNotificationDto = {
        user: receiver._id.toString(),
        sender: tipper._id.toString(),
        entityType: NotificationEntityType.Tip,
        metadata: {
          amount: dto.amount,
          currency: 'USD',
          ...(dto.postId && { post: dto.postId }),
        },
      };
      await Promise.allSettled([
        this.notificationService.sendEmail(senderMailPayload),
        this.notificationService.sendEmail(receiverMailPayload),
        this.notificationService.createInAppNotication(inAppNotficationPayload),
      ]);
      result.amount = this.walletService.toDollar(result.amount);
      return { success: true, message: 'Tip sent successfully', tx: result };
    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async buyMenu(dto: BuyMenuDto) {
    const [buyerWallet, sellerWallet, menu, buyer, seller] = await Promise.all([
      this.walletService.getWallet(dto.buyerId),
      this.walletService.getWallet(dto.sellerId),
      this.menuModel.findOne({ _id: dto.menuId, isArchived: false }),
      this.userModel.findOne({ discordId: dto.buyerId }),
      this.userModel.findOne({ discordId: dto.sellerId }),
    ]);
    if (!buyerWallet)
      throw new BadRequestException('User does not have an active wallet');
    if (!sellerWallet)
      throw new BadRequestException('Seller does not have an active wallet');
    if (!menu) throw new NotFoundException('Menu does not exist');
    if (!buyer || !seller) throw new NotFoundException('User does not exist');
    if (String(menu.owner) !== seller._id.toString()) {
      throw new BadRequestException('Menu seller mismatch');
    }
    if (buyer._id.equals(seller._id)) {
      throw new BadRequestException('You cannot buy your own menu');
    }
    const orderedMenuMedia = await this.getOrderedMenuMedia({
      media: (menu.media ?? []).map((id) => id.toString()),
    });
    if (orderedMenuMedia.length === 0) {
      throw new NotFoundException('No media found for this menu');
    }
    const purchasePlan = this.getMenuPurchasePlan({
      collectionType: menu.collectionType,
      itemCount: orderedMenuMedia.length,
      priceToView: menu.priceToView,
      promo: menu.promo,
    });
    const selectedMenuMedia =
      purchasePlan.mode === PaymentService.MENU_PURCHASE_MODE.BUNDLE
        ? orderedMenuMedia
        : orderedMenuMedia.slice(0, 1);
    const purchasedMedia = selectedMenuMedia.map((entry) => entry.media);
    const purchasedMediaIds = purchasedMedia.map((mediaId) =>
      mediaId.toString(),
    );
    const sourcePostId = menu.sourcePost ? menu.sourcePost.toString() : null;
    const sourcePostPreviewMediaIds = await getSourcePostPreviewMediaIds({
      postModel: this.postModel,
      ownerId: seller._id as Types.ObjectId,
      sourcePostId,
    });
    const previewMediaIds =
      sourcePostPreviewMediaIds.length > 0
        ? sourcePostPreviewMediaIds
        : await getOrderedMenuPreviewMediaIds({
            mediaModel: this.mediaModel,
            ownerId: seller._id as Types.ObjectId,
            previewMedia: menu.previewMedia,
            coverPublicId: menu.coverImage?.public_id ?? null,
          });
    const deliveredMediaIds = Array.from(
      new Set([...previewMediaIds, ...purchasedMediaIds]),
    );
    const purchasedCount = purchasedMedia.length;
    const purchasedLabel =
      purchasedCount === 1 ? 'menu item' : `${purchasedCount} bundle items`;
    const purchasedLabelForBuyer =
      purchasedCount === 1
        ? `menu item "${menu.title}"`
        : `${purchasedCount} items from "${menu.title}" bundle`;
    const originSurface = this.normalizeOriginSurface(dto.originSurface);
    const existingPayment = await this.findExistingCompletedMenuPurchase({
      buyerUserId: buyer._id as Types.ObjectId,
      sellerUserId: seller._id as Types.ObjectId,
      menuId: menu._id as Types.ObjectId,
    });
    if (existingPayment) {
      const totalPaid = this.walletService.toDollar(existingPayment.amount);
      const existingDelivery = this.readDeliveryMeta(
        existingPayment.meta as Record<string, any> | undefined,
      );
      return {
        success: true,
        alreadyUnlocked: true,
        message: 'Menu already unlocked',
        tx: {
          _id: existingPayment._id,
          amount: totalPaid,
          status: existingPayment.status,
        },
        purchaseSummary: {
          mode: purchasePlan.mode,
          quantity: purchasedCount,
          label: purchasedLabel,
          baseUnitPrice: purchasePlan.baseUnitPrice,
          unitPrice: purchasePlan.unitPrice,
          discountPerItem: purchasePlan.discountPerItem,
          promoApplied: purchasePlan.promoApplied,
          promo: purchasePlan.promoMetadata,
          totalPrice: totalPaid,
        },
        purchasedMediaIds,
        delivery: {
          ...existingDelivery,
          sourcePostId:
            typeof existingPayment.meta?.sourcePostId === 'string'
              ? existingPayment.meta.sourcePostId
              : sourcePostId,
          originSurface: this.normalizeOriginSurface(
            existingPayment.meta?.originSurface,
          ),
        },
      };
    }
    const menuMediaIds = selectedMenuMedia.map((entry) => entry._id.toString());
    const meta = {
      type: PaymentType.MENU_PURCHASE,
      fromUser: buyer._id.toString(),
      toUser: seller._id.toString(),
      menuId: menu._id.toString(),
      itemId: menuMediaIds,
      itemCount: purchasedCount,
      baseUnitPrice: `${purchasePlan.baseUnitPrice}`,
      unitPrice: `${purchasePlan.unitPrice}`,
      discountPerItem: `${purchasePlan.discountPerItem}`,
      price: `${purchasePlan.totalPrice}`,
      purchaseMode: purchasePlan.mode,
      promoApplied: purchasePlan.promoApplied,
      promo: purchasePlan.promoMetadata,
      originSurface,
      sourcePostId,
    };
    const session = await this.connection.startSession();
    try {
      const payment = await this.reservePayment(
        buyer._id.toString(),
        purchasePlan.totalPrice,
        meta,
        session,
      );
      const result = await this.commitPayment(payment._id.toString(), session);
      if (result.status === PaymentStatus.COMPLETED) {
        await this.menuModel.updateOne(
          { _id: menu._id },
          { $inc: { itemSold: 1 } },
          { session },
        );
        const totalPaid = this.walletService.toDollar(result.amount);
        const totalPaidLabel = totalPaid.toFixed(2);
        const basePurchaseContext = this.buildMenuPurchaseContext({
          menuId: menu._id.toString(),
          menuTitle: menu.title ?? 'Menu unlock',
          sourcePostId,
          originSurface,
        });
        const menuMessagePayload: CreateMessageMenuDto = {
          sender: seller._id.toString(),
          reciever: buyer._id.toString(),
          media: deliveredMediaIds,
          text:
            menu.noteToBuyer ?? `Thank you ${buyer.username} for the purchase`,
          price: totalPaidLabel,
          paymentTx: result._id.toString(),
          isPayable: true,
          paid: true,
          title: menu.title,
          description: menu.description,
          purchaseContext: basePurchaseContext,
        };
        const sendBuyerMessage =
          await this.chatService.sendMenu(menuMessagePayload);
        let deliveredConversationId: string | null = null;
        if (typeof sendBuyerMessage?.conversation === 'string') {
          deliveredConversationId = sendBuyerMessage.conversation;
        } else if (sendBuyerMessage?.conversation instanceof Types.ObjectId) {
          deliveredConversationId = sendBuyerMessage.conversation.toString();
        } else {
          deliveredConversationId =
            (sendBuyerMessage?.conversation as any)?._id?.toString?.() ?? null;
        }
        const deliveredMessageId = sendBuyerMessage?._id?.toString?.() ?? null;
        const purchaseContext = this.buildMenuPurchaseContext({
          menuId: menu._id.toString(),
          menuTitle: menu.title ?? 'Menu unlock',
          sourcePostId,
          originSurface,
          sourceConversationId: deliveredConversationId ?? undefined,
          sourceMessageId: deliveredMessageId ?? undefined,
        });
        let receiptMessageId: string | null = null;
        if (deliveredConversationId && deliveredMessageId) {
          try {
            const receiptMessage = await this.createPurchaseReceiptMessage({
              conversationId: deliveredConversationId,
              buyerUserId: buyer._id.toString(),
              sellerUserId: seller._id.toString(),
              replyToMessageId: deliveredMessageId,
              priceInDollars: totalPaidLabel,
              purchaseContext,
            });
            receiptMessageId = receiptMessage?._id?.toString?.() ?? null;
          } catch (error) {
            this.logger.error(error);
          }
        }
        await this.paymentModel.updateOne(
          { _id: result._id },
          {
            $set: {
              'meta.originSurface': originSurface,
              'meta.sourcePostId': sourcePostId,
              'meta.delivery': {
                conversationId: deliveredConversationId,
                messageId: deliveredMessageId,
                receiptMessageId,
              },
            },
          },
          { session },
        );
        if (deliveredMessageId) {
          void this.chatGateway
            .handleSendMenuMessage({
              messageId: deliveredMessageId,
            })
            .catch((error) => {
              this.logger.error(error);
              console.log('error sending buy message ');
            });
        }
        if (receiptMessageId) {
          void this.chatGateway
            .handleSendMenuMessage({
              messageId: receiptMessageId,
            })
            .catch((error) => {
              this.logger.error(error);
              console.log('error sending buy receipt message ');
            });
        }
        const sellerMailPayload: SendEmailDto = {
          recipients: [seller.email],
          subject: 'Sales Notification',
          html: `<h1>Hello ${seller.username}!</h1>
             <p>${buyer.username} bought ${purchasedLabelForBuyer}.</p>`,
        };
        const buyerMailPayload: SendEmailDto = {
          recipients: [buyer.email],
          subject: 'Debit',
          html: `<h1>Hello ${buyer.username}!</h1>
             <p>You bought ${purchasedLabelForBuyer} from ${seller.username}.</p>`,
        };
        const inAppNotficationPayload: CreateNotificationDto = {
          user: seller._id.toString(),
          sender: buyer._id.toString(),
          entityType: NotificationEntityType.MenuPurchase,
          entityId: purchasedMediaIds[0],
          metadata: {
            amount: totalPaidLabel,
            currency: 'USD',
            menu: purchasedMediaIds,
          },
        };
        void Promise.allSettled([
          this.notificationService.sendEmail(sellerMailPayload),
          this.notificationService.sendEmail(buyerMailPayload),
          this.notificationService.createInAppNotication(
            inAppNotficationPayload,
          ),
        ]);
        result.amount = totalPaid;
        return {
          success: true,
          message:
            purchasePlan.mode === PaymentService.MENU_PURCHASE_MODE.BUNDLE
              ? 'Bundle unlocked successfully'
              : 'Menu item unlocked successfully',
          tx: result,
          purchaseSummary: {
            mode: purchasePlan.mode,
            quantity: purchasedCount,
            label: purchasedLabel,
            baseUnitPrice: purchasePlan.baseUnitPrice,
            unitPrice: purchasePlan.unitPrice,
            discountPerItem: purchasePlan.discountPerItem,
            promoApplied: purchasePlan.promoApplied,
            promo: purchasePlan.promoMetadata,
            totalPrice: totalPaid,
          },
          purchasedMediaIds,
          delivery: {
            conversationId: deliveredConversationId,
            messageId: deliveredMessageId,
            receiptMessageId,
            sourcePostId,
            originSurface,
          },
        };
      }
      return { success: false };
    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async subscribeToPlan(dto: SubscribeUserDto) {
    const [buyerWallet, sellerWallet, plan, buyer, seller] = await Promise.all([
      this.walletService.getWallet(dto.buyerId),
      this.walletService.getWallet(dto.sellerId),
      this.subscriptionPlanModel.findById(dto.planId),
      this.userModel.findOne({ discordId: dto.buyerId }),
      this.userModel.findOne({ discordId: dto.sellerId }),
    ]);
    if (!buyerWallet)
      throw new BadRequestException('User does not have an active wallet');
    if (!sellerWallet)
      throw new BadRequestException('Seller does not have an active wallet');
    if (!plan) throw new NotFoundException('Plan does not exist');
    if (plan.isArchived) {
      throw new BadRequestException(
        'This plan has been archived by the seller',
      );
    }
    if (plan.isDeleted) {
      throw new BadRequestException('This plan has been deleted by the seller');
    }
    if (buyer._id.equals(seller._id)) {
      throw new BadRequestException('You cannot subscribed to your own plan');
    }
    const exist = await this.userSubscriptionModel.findOne({
      plan: dto.planId,
      user: buyer._id.toString(),
    });
    if (exist && exist.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('User is already subscribed to this plan');
    }
    const duration = plan.duration ?? 1;
    const endDate = this.calculateEndDate({
      value: dto.durationInMonths ?? 1,
      unit: 'month',
    });
    const startDate = new Date();
    const totalAmount = +plan.amount * (dto.durationInMonths ?? 1);
    const meta = {
      type: PaymentType.SUBSCRIPTION,
      fromUser: buyer._id.toString(),
      toUser: seller._id.toString(),
      planId: plan._id.toString(),
      planName: plan.name,
      planDuration: duration,
      subscriptionDuration: dto.durationInMonths ?? 1,
      startDate: startDate.toISOString(),
      endDate: endDate.toDateString(),
      amount: totalAmount,
    };
    const session = await this.connection.startSession();
    try {
      const payment = await this.reservePayment(
        buyer._id.toString(),
        totalAmount,
        meta,
        session,
      );
      const result = await this.commitPayment(payment._id.toString(), session);
      let subscribedPlan = null;
      if (result.status === PaymentStatus.COMPLETED) {
        subscribedPlan = await this.userSubscriptionModel.create(
          [
            {
              user: buyer._id,
              plan: plan._id,
              startDate,
              endDate,
              durationInMonths: dto.durationInMonths ?? 1,
              lastPayment: result._id,
              meta,
            },
          ],
          { session },
        );
        await this.subscriptionPlanModel.updateOne(
          { _id: plan._id },
          { $inc: { subscribersCount: 1 } },
          { session },
        );
        const sellerMailPayload: SendEmailDto = {
          recipients: [seller.email],
          subject: 'Subscriber Notification',
          html: `<h1>Hello ${seller.username}!</h1>
             <p>${buyer.username} subscribed to  your Plan ${plan.name}</p>`,
        };
        const buyerMailPayload: SendEmailDto = {
          recipients: [buyer.email],
          subject: 'Debit',
          html: `<h1>Hello ${buyer.username}!</h1>
             <p>You subscribed to ${seller.username}'s plan  ${plan.name}.</p>`,
        };
        await Promise.allSettled([
          this.notificationService.sendEmail(sellerMailPayload),
          this.notificationService.sendEmail(buyerMailPayload),
        ]);
        result.amount = this.walletService.toDollar(result.amount);
        return {
          success: true,
          message: 'Plan subscription successful',
          tx: result,
          subscribedPlan,
        };
      }
      return { success: false };
    } catch (err) {
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async payForInMessageMediaAsset(dto: PayInMessageMediaAssetDto) {
    const [buyerWallet, sellerWallet, messageAsset, buyer, seller] =
      await Promise.all([
        this.walletService.getWallet(dto.buyerId),
        this.walletService.getWallet(dto.sellerId),
        this.messageModel.findOne({
          _id: dto.messageId,
          conversation: dto.conversationId,
        }),
        this.userModel.findOne({ discordId: dto.buyerId }),
        this.userModel.findOne({ discordId: dto.sellerId }),
      ]);
    if (!buyerWallet)
      throw new BadRequestException('User does not have an active wallet');
    if (!sellerWallet)
      throw new BadRequestException('Seller does not have an active wallet');
    if (!messageAsset) throw new NotFoundException('Message does not exist');
    if (!buyer || !seller) throw new NotFoundException('User does not exist');
    if (!messageAsset.price || +messageAsset.price == 0) {
      throw new BadRequestException('this message Asset has no price');
    }
    if (!messageAsset.isPayable) {
      throw new BadRequestException('This message asset is not payable');
    }
    if (messageAsset.type !== MessageType.IN_MESSAGE_MEDIA) {
      throw new BadRequestException('Invalid message asset type');
    }
    if (
      messageAsset.sender?.toString() !== seller._id.toString() ||
      messageAsset.reciever?.toString() !== buyer._id.toString()
    ) {
      throw new ForbiddenException(
        'Message asset does not match the provided buyer/seller',
      );
    }
    if (buyer._id.equals(seller._id)) {
      throw new BadRequestException('You cannot pay for your own asset');
    }
    const existingPayment = await this.paymentModel
      .findOne({
        type: PaymentType.MEDIA_PURCHASE,
        status: PaymentStatus.COMPLETED,
        payer: buyer._id,
        'meta.MessageAsset': messageAsset._id.toString(),
      })
      .sort({ createdAt: -1 });
    const sourceConversationId =
      (messageAsset as any)?.conversation?.toString?.() ?? dto.conversationId;
    const mediaPurchaseContext: MessagePurchaseContext = {
      originSurface: PurchaseOriginSurface.DM,
      sourceConversationId,
      sourceMessageId: messageAsset._id.toString(),
      sourceLabel: messageAsset.title,
      purchaseType: MessagePurchaseType.MEDIA,
    };
    if (existingPayment) {
      const tx = existingPayment.toObject();
      tx.amount = this.walletService.toDollar(tx.amount);
      const existingDelivery = this.readDeliveryMeta(
        existingPayment.meta as Record<string, any> | undefined,
      );
      return {
        success: true,
        message: 'Message asset already unlocked',
        tx,
        paidMessageAsset: {
          ...messageAsset.toObject(),
          paid: true,
          paymentTx: existingPayment._id,
        },
        delivery: {
          ...existingDelivery,
          originSurface: this.normalizeOriginSurface(
            existingPayment.meta?.originSurface,
          ),
        },
      };
    }
    const meta = {
      type: PaymentType.MEDIA_PURCHASE,
      fromUser: buyer._id.toString(),
      toUser: seller._id.toString(),
      MessageAsset: messageAsset._id.toString(),
      amount: messageAsset.price,
      originSurface: PurchaseOriginSurface.DM,
      sourceConversationId,
    };
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const payment = await this.reservePayment(
        buyer._id.toString(),
        +messageAsset.price,
        meta,
        session,
      );
      const result = await this.commitPayment(payment._id.toString(), session);
      if (result.status === PaymentStatus.COMPLETED) {
        await session.commitTransaction();
        const totalPaid = this.walletService.toDollar(result.amount);
        const totalPaidLabel = totalPaid.toFixed(2);
        const paidMessageAsset = {
          ...messageAsset.toObject(),
          paid: true,
          paymentTx: result._id,
        };
        let receiptMessageId: string | null = null;
        try {
          const receiptMessage = await this.createPurchaseReceiptMessage({
            conversationId: sourceConversationId,
            buyerUserId: buyer._id.toString(),
            sellerUserId: seller._id.toString(),
            replyToMessageId: messageAsset._id.toString(),
            priceInDollars: totalPaidLabel,
            purchaseContext: mediaPurchaseContext,
          });
          receiptMessageId = receiptMessage?._id?.toString?.() ?? null;
        } catch (error) {
          this.logger.error(error);
        }
        await this.paymentModel.updateOne(
          { _id: result._id },
          {
            $set: {
              'meta.originSurface': PurchaseOriginSurface.DM,
              'meta.delivery': {
                conversationId: sourceConversationId,
                messageId: messageAsset._id.toString(),
                receiptMessageId,
              },
            },
          },
        );
        if (receiptMessageId) {
          void this.chatGateway
            .handleSendMenuMessage({
              messageId: receiptMessageId,
            })
            .catch((error) => {
              this.logger.error(error);
            });
        }
        const sellerMailPayload: SendEmailDto = {
          recipients: [seller.email],
          subject: 'Media Payment Notification',
          html: `<h1>Hello ${seller.username}!</h1>
             <p>${buyer.username} for your in-message media asset </p>`,
        };
        const buyerMailPayload: SendEmailDto = {
          recipients: [buyer.email],
          subject: 'Debit',
          html: `<h1>Hello ${buyer.username}!</h1>
             <p>You paid for ${seller.username}'s in-message  media asset.</p>`,
        };
        const inAppNotficationPayload: CreateNotificationDto = {
          user: seller._id.toString(),
          sender: buyer._id.toString(),
          entityType: NotificationEntityType.MediaPurchase,
          entityId: messageAsset._id.toString(),
          metadata: {
            amount: totalPaidLabel,
            currency: 'USD',
          },
        };
        await Promise.allSettled([
          this.notificationService.sendEmail(sellerMailPayload),
          this.notificationService.sendEmail(buyerMailPayload),
          this.notificationService.createInAppNotication(
            inAppNotficationPayload,
          ),
        ]);
        result.amount = totalPaid;
        return {
          success: true,
          message: 'Message asset unlocked',
          tx: result,
          paidMessageAsset,
          delivery: {
            conversationId: sourceConversationId,
            messageId: messageAsset._id.toString(),
            receiptMessageId,
            originSurface: PurchaseOriginSurface.DM,
          },
        };
      }
      await session.commitTransaction();
      return { success: false };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async payForCall(dto: PayCallDto) {
    const [call, caller, callee] = await Promise.all([
      this.messageModel.findById(dto.callId),
      this.userModel.findOne({ discordId: dto.callerId }),
      this.userModel.findOne({ discordId: dto.calleeId }),
    ]);
    if (!call) throw new NotFoundException('Call session does not exist');
    if (!caller) throw new NotFoundException('Caller does not exist');
    if (!callee) throw new NotFoundException('Callee does not exist');
    if (call.paid && call.paymentTx) {
      const existingPayment = await this.paymentModel.findById(call.paymentTx);
      if (existingPayment) {
        const existing = existingPayment.toObject();
        existing.amount = this.walletService.toDollar(existing.amount);
        return {
          success: true,
          message: 'Call session already settled',
          tx: existing,
          paidCall: call,
        };
      }
    }
    const payment = await this.paymentModel.findOne({
      'meta.callId': call._id.toString(),
    });
    if (!payment)
      throw new BadRequestException('No payment found for this call');
    if (payment.status === PaymentStatus.COMPLETED) {
      const alreadyPaid = payment.toObject();
      alreadyPaid.amount = this.walletService.toDollar(alreadyPaid.amount);
      return {
        success: true,
        message: 'Call session already settled',
        tx: alreadyPaid,
        paidCall: call,
      };
    }
    const now = Date.now();
    const startedAt = call.callStartedAt?.getTime();
    const fallbackDuration =
      typeof startedAt === 'number'
        ? Math.max(0, Math.ceil((now - startedAt) / 1000))
        : 0;
    const duration = Math.max(0, Math.ceil(dto.duration ?? fallbackDuration));
    const totalMinutes = Math.max(1, Math.ceil(duration / 60));
    const expectedAmount = this.walletService.toCent(
      callee.callRate * totalMinutes,
    );
    const reserveTxIds =
      payment.batchDebitTx?.map((txId) => txId.toString()) ??
      (payment.debitTx ? [payment.debitTx.toString()] : []);
    if (reserveTxIds.length === 0) {
      throw new BadRequestException(
        'No reserve transactions found for this call',
      );
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const reserveTransactions = await this.txModel
        .find({ _id: { $in: reserveTxIds } })
        .session(session);
      const reserveMap = new Map(
        reserveTransactions.map((tx) => [tx._id.toString(), tx]),
      );
      const committedReservationTxIds: string[] = [];
      for (const reserveTxId of reserveTxIds) {
        const reserveTx = reserveMap.get(reserveTxId);
        if (!reserveTx) {
          throw new NotFoundException(
            `Reserve transaction ${reserveTxId} does not exist`,
          );
        }
        if (reserveTx.status === TransactionStatus.PENDING) {
          const { commitTx } = await this.walletService.commitReservation(
            reserveTxId,
            session,
          );
          committedReservationTxIds.push(commitTx._id.toString());
          continue;
        }
        if (reserveTx.status === TransactionStatus.COMPLETED) {
          continue;
        }
        throw new BadRequestException(
          `Invalid reserve transaction status: ${reserveTx.status}`,
        );
      }
      if (payment.amount > expectedAmount) {
        const refundAmount = payment.amount - expectedAmount;
        await this.walletService.credit(
          caller._id.toString(),
          this.walletService.toDollar(refundAmount),
          {
            type: PaymentType.CALL_SESSION,
            callId: call._id.toString(),
            fromUser: callee._id.toString(),
            toUser: caller._id.toString(),
            description: `Refund unused reserved call amount for ${call._id.toString()}`,
            reservedAmount: payment.amount,
            billedAmount: expectedAmount,
          },
          session,
        );
      } else if (expectedAmount > payment.amount) {
        const extraAmount = expectedAmount - payment.amount;
        await this.walletService.debit(
          caller._id.toString(),
          this.walletService.toDollar(extraAmount).toString(),
          {
            type: PaymentType.CALL_SESSION,
            callId: call._id.toString(),
            fromUser: caller._id.toString(),
            toUser: callee._id.toString(),
            description: `Additional call settlement debit for ${call._id.toString()}`,
            reservedAmount: payment.amount,
            billedAmount: expectedAmount,
          },
          session,
        );
      }
      const creditTx = await this.walletService.credit(
        callee._id.toString(),
        this.walletService.toDollar(expectedAmount),
        {
          type: PaymentType.CALL_SESSION,
          callId: call._id.toString(),
          fromUser: caller._id.toString(),
          toUser: callee._id.toString(),
          callRate: callee.callRate,
          callDuration: duration,
          billedMinutes: totalMinutes,
        },
        session,
      );
      payment.amount = expectedAmount;
      payment.status = PaymentStatus.COMPLETED;
      payment.creditTx = creditTx.tx._id;
      if (committedReservationTxIds.length > 0) {
        payment.debitTx = new Types.ObjectId(
          committedReservationTxIds[committedReservationTxIds.length - 1],
        );
      }
      payment.meta = {
        ...(payment.meta ?? {}),
        callDuration: duration,
        billedMinutes: totalMinutes,
      };
      await payment.save({ session });
      const paidCall = await this.messageModel.findByIdAndUpdate(
        call._id,
        { paid: true, paymentTx: payment._id },
        { new: true, session },
      );
      await session.commitTransaction();
      const sellerMailPayload: SendEmailDto = {
        recipients: [callee.email],
        subject: 'Call Payment Notification',
        html: `<h1>Hello ${callee.username}!</h1>
             <p>${caller.username} paid for call session.</p>`,
      };
      const buyerMailPayload: SendEmailDto = {
        recipients: [caller.email],
        subject: 'Debit',
        html: `<h1>Hello ${caller.username}!</h1>
             <p>$${this.walletService.toDollar(expectedAmount)} has been debited from your wallet for call with ${callee.username}.</p>`,
      };
      await Promise.allSettled([
        this.notificationService.sendEmail(sellerMailPayload),
        this.notificationService.sendEmail(buyerMailPayload),
      ]);
      const paymentResponse = payment.toObject();
      paymentResponse.amount = this.walletService.toDollar(
        paymentResponse.amount,
      );
      return {
        success: true,
        message: 'Call session payment successful',
        tx: paymentResponse,
        paidCall,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
  async billCallMinute(callerId: string, calleeId: string, callId: string) {
    const [caller, callee] = await Promise.all([
      this.userModel.findOne({ discordId: callerId }),
      this.userModel.findOne({ discordId: calleeId }),
    ]);
    if (!caller || !callee) {
      throw new BadRequestException('Caller or callee not found');
    }
    const rate = callee.callRate;
    if (!rate || rate <= 0) return; // No charge for free calls
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.walletService.debit(
        caller._id.toString(),
        rate.toString(),
        {
          type: PaymentType.CALL_SESSION,
          callId: callId,
          toUser: callee._id.toString(),
          description: `Per-minute charge for call ${callId}`,
        },
        session,
      );
      await this.walletService.credit(
        callee._id.toString(),
        rate,
        {
          type: PaymentType.CALL_SESSION,
          callId: callId,
          fromUser: caller._id.toString(),
          description: `Per-minute earnings for call ${callId}`,
        },
        session,
      );
      await session.commitTransaction();
      console.log(`Billed $${rate} for call ${callId}`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  calculateEndDate(duration: { value: number; unit: string }) {
    const now = new Date();
    switch (duration.unit) {
      case 'day':
      case 'days':
        return new Date(now.getTime() + duration.value * 24 * 60 * 60 * 1000);
      case 'week':
      case 'weeks':
        return new Date(
          now.getTime() + duration.value * 7 * 24 * 60 * 60 * 1000,
        );
      case 'month':
      case 'months': {
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + duration.value);
        return endDate;
      }
      case 'year':
      case 'years': {
        const endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + duration.value);
        return endDate;
      }
      default:
        throw new Error(`Unsupported duration unit: ${duration.unit}`);
    }
  }
  async getUserPaidMenu(buyerDiscord: string, sellerDiscord: string) {
    const [buyer, seller] = await Promise.all([
      this.userModel.findOne({ discordId: buyerDiscord }),
      this.userModel.findOne({ discordId: sellerDiscord }),
    ]);
    if (!buyer || !seller) {
      return { menuIds: [], purchases: [] };
    }
    const payments = await this.paymentModel
      .find({
        type: PaymentType.MENU_PURCHASE,
        status: PaymentStatus.COMPLETED,
        payer: buyer._id,
        receiver: seller._id,
      })
      .select('_id amount status createdAt meta.menuId meta.itemCount')
      .sort({ createdAt: -1 })
      .lean();
    const uniqueMenuIds = new Set<string>();
    const purchases = payments
      .map((payment) => {
        const menuId = payment?.meta?.menuId ? String(payment.meta.menuId) : '';
        if (!menuId) return null;
        uniqueMenuIds.add(menuId);
        return {
          paymentId: payment._id.toString(),
          menuId,
          itemCount: Number(payment?.meta?.itemCount ?? 1),
          totalPaid: this.walletService.toDollar(payment.amount),
          purchasedAt: (payment as any).createdAt,
        };
      })
      .filter((entry) => entry !== null);
    return {
      menuIds: [...uniqueMenuIds],
      purchases,
    };
  }
}
