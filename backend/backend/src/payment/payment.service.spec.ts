import mongoose from 'mongoose';
import { PaymentService } from './payment.service';
import {
  PaymentStatus,
  PaymentType,
} from 'src/database/schemas/payment.schema';
import { CollectionType } from 'src/database/schemas/menu.schema';

const makeWalletService = () => ({
  getWallet: jest.fn(),
  toDollar: jest.fn((value: number) => value / 100),
});

const makeSession = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
});

describe('PaymentService - media purchase isolation', () => {
  const walletService = makeWalletService();
  const chatService = {};
  const chatGateway = {
    handleSendMenuMessage: jest.fn().mockResolvedValue(undefined),
  };
  const notificationService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    createInAppNotication: jest.fn().mockResolvedValue(undefined),
  };
  const paymentModel = {
    findOne: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  };
  const userModel = {
    findOne: jest.fn(),
  };
  const menuModel = {};
  const menuMediaModel = {};
  const mediaModel = {
    find: jest.fn(),
  };
  const postModel = {};
  const subscriptionPlanModel = {};
  const userSubscriptionModel = {};
  const messageModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest
      .fn()
      .mockResolvedValue({ _id: new mongoose.Types.ObjectId().toString() }),
  };
  const connection = {
    startSession: jest.fn(),
  };
  const txModel = {};

  let service: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PaymentService(
      walletService as any,
      chatService as any,
      chatGateway as any,
      notificationService as any,
      paymentModel as any,
      userModel as any,
      menuModel as any,
      menuMediaModel as any,
      mediaModel as any,
      postModel as any,
      subscriptionPlanModel as any,
      userSubscriptionModel as any,
      messageModel as any,
      connection as any,
      txModel as any,
    );
  });

  it('returns existing completed payment for the same buyer and asset', async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const sellerId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();

    const messageAsset = {
      _id: messageId,
      price: '12.50',
      isPayable: true,
      toObject: jest.fn(() => ({ _id: messageId.toString(), paid: false })),
    };
    const existingPayment = {
      _id: new mongoose.Types.ObjectId(),
      amount: 1250,
      status: PaymentStatus.COMPLETED,
      toObject: jest.fn(() => ({
        _id: 'existing-payment-id',
        amount: 1250,
        status: PaymentStatus.COMPLETED,
      })),
    };

    walletService.getWallet
      .mockResolvedValueOnce({ balance: 5000 })
      .mockResolvedValueOnce({ balance: 5000 });
    messageModel.findOne.mockResolvedValue(messageAsset);
    userModel.findOne
      .mockResolvedValueOnce({
        _id: buyerId,
        username: 'buyer',
        email: 'buyer@example.com',
      })
      .mockResolvedValueOnce({
        _id: sellerId,
        username: 'seller',
        email: 'seller@example.com',
      });
    paymentModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(existingPayment),
    });

    const reserveSpy = jest.spyOn(service, 'reservePayment');
    const commitSpy = jest.spyOn(service, 'commitPayment');

    const result = await service.payForInMessageMediaAsset({
      buyerId: 'buyer-discord',
      sellerId: 'seller-discord',
      conversationId: 'conversation-id',
      messageId: messageId.toString(),
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Message asset already unlocked');
    expect(result.tx.amount).toBe(12.5);
    expect(result.paidMessageAsset.paid).toBe(true);
    expect(connection.startSession).not.toHaveBeenCalled();
    expect(reserveSpy).not.toHaveBeenCalled();
    expect(commitSpy).not.toHaveBeenCalled();
  });

  it('does not set global message.paid when completing a media purchase', async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const sellerId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();
    const session = makeSession();

    const messageAsset = {
      _id: messageId,
      price: '15',
      isPayable: true,
      toObject: jest.fn(() => ({ _id: messageId.toString(), paid: false })),
    };

    walletService.getWallet
      .mockResolvedValueOnce({ balance: 5000 })
      .mockResolvedValueOnce({ balance: 5000 });
    messageModel.findOne.mockResolvedValue(messageAsset);
    userModel.findOne
      .mockResolvedValueOnce({
        _id: buyerId,
        username: 'buyer',
        email: 'buyer@example.com',
      })
      .mockResolvedValueOnce({
        _id: sellerId,
        username: 'seller',
        email: 'seller@example.com',
      });
    paymentModel.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    connection.startSession.mockResolvedValue(session);

    jest.spyOn(service, 'reservePayment').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
    } as any);
    jest.spyOn(service, 'commitPayment').mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      amount: 1500,
      status: PaymentStatus.COMPLETED,
      type: PaymentType.MEDIA_PURCHASE,
    } as any);

    const result = await service.payForInMessageMediaAsset({
      buyerId: 'buyer-discord',
      sellerId: 'seller-discord',
      conversationId: 'conversation-id',
      messageId: messageId.toString(),
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Message asset unlocked');
    expect(result.tx.amount).toBe(15);
    expect(session.startTransaction).toHaveBeenCalledTimes(1);
    expect(session.commitTransaction).toHaveBeenCalledTimes(1);
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(messageModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('PaymentService - menu purchase plan', () => {
  const walletService = makeWalletService();
  const chatService = {};
  const chatGateway = {};
  const notificationService = {};
  const paymentModel = {};
  const userModel = {};
  const menuModel = {};
  const menuMediaModel = {};
  const mediaModel = {};
  const postModel = {};
  const subscriptionPlanModel = {};
  const userSubscriptionModel = {};
  const messageModel = {};
  const connection = {};
  const txModel = {};

  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService(
      walletService as any,
      chatService as any,
      chatGateway as any,
      notificationService as any,
      paymentModel as any,
      userModel as any,
      menuModel as any,
      menuMediaModel as any,
      mediaModel as any,
      postModel as any,
      subscriptionPlanModel as any,
      userSubscriptionModel as any,
      messageModel as any,
      connection as any,
      txModel as any,
    );
  });

  it('forces single-item menus to quantity 1', () => {
    const plan = (service as any).getMenuPurchasePlan({
      collectionType: CollectionType.SINGLE,
      itemCount: 1,
      priceToView: '15',
    });

    expect(plan.mode).toBe('single');
    expect(plan.quantity).toBe(1);
    expect(plan.totalPrice).toBe(15);
  });

  it('charges the full bundle for multi-item menus', () => {
    const plan = (service as any).getMenuPurchasePlan({
      collectionType: CollectionType.BUNDLES,
      itemCount: 4,
      priceToView: '12.5',
    });

    expect(plan).toEqual({
      mode: 'bundle',
      quantity: 4,
      itemCount: 4,
      baseUnitPrice: 12.5,
      unitPrice: 12.5,
      discountPerItem: 0,
      promoApplied: false,
      promoMetadata: null,
      totalPrice: 12.5,
    });
  });

  it('applies active percentage promo to bundle totals', () => {
    const startsAt = new Date(Date.now() - 60_000);
    const endsAt = new Date(Date.now() + 60_000);

    const plan = (service as any).getMenuPurchasePlan({
      collectionType: CollectionType.BUNDLES,
      itemCount: 5,
      priceToView: '20',
      promo: {
        isEnabled: true,
        type: 'percentage',
        value: '25',
        startsAt,
        endsAt,
        message: 'Weekend',
      },
    });

    expect(plan.unitPrice).toBe(15);
    expect(plan.baseUnitPrice).toBe(20);
    expect(plan.discountPerItem).toBe(5);
    expect(plan.totalPrice).toBe(15);
    expect(plan.promoApplied).toBe(true);
    expect(plan.promoMetadata).toEqual(
      expect.objectContaining({
        type: 'percentage',
        value: '25',
        message: 'Weekend',
      }),
    );
  });

  it('ignores expired promo and uses base unit price', () => {
    const plan = (service as any).getMenuPurchasePlan({
      collectionType: CollectionType.BUNDLES,
      itemCount: 5,
      priceToView: '18',
      promo: {
        isEnabled: true,
        type: 'fixed',
        value: '4',
        startsAt: new Date(Date.now() - 120_000),
        endsAt: new Date(Date.now() - 60_000),
        message: 'Expired',
      },
    });

    expect(plan.unitPrice).toBe(18);
    expect(plan.discountPerItem).toBe(0);
    expect(plan.totalPrice).toBe(18);
    expect(plan.promoApplied).toBe(false);
  });
});
