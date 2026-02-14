import mongoose from 'mongoose';
import { BadRequestException } from '@nestjs/common';
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
  const chatGateway = {};
  const notificationService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    createInAppNotication: jest.fn().mockResolvedValue(undefined),
  };
  const paymentModel = {
    findOne: jest.fn(),
  };
  const userModel = {
    findOne: jest.fn(),
  };
  const menuModel = {};
  const menuMediaModel = {};
  const subscriptionPlanModel = {};
  const userSubscriptionModel = {};
  const messageModel = {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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
      subscriptionPlanModel as any,
      userSubscriptionModel as any,
      messageModel as any,
      connection as any,
      txModel as any,
    );
  });

  it('rejects quantity > 1 for single-item menu purchases', () => {
    expect(() =>
      (service as any).getMenuPurchasePlan(
        {
          collectionType: CollectionType.SINGLE,
          itemCount: 1,
          itemSold: 0,
          priceToView: '15',
        },
        2,
      ),
    ).toThrow(
      new BadRequestException(
        'Single-item menu purchases require quantity 1. Remove bundle quantity and try again.',
      ),
    );
  });

  it('computes deterministic totals for bundle purchases', () => {
    const plan = (service as any).getMenuPurchasePlan(
      {
        collectionType: CollectionType.BUNDLES,
        itemCount: 6,
        itemSold: 2,
        priceToView: '12.5',
      },
      3,
    );

    expect(plan).toEqual({
      mode: 'bundle',
      quantity: 3,
      availableCount: 4,
      baseUnitPrice: 12.5,
      unitPrice: 12.5,
      discountPerItem: 0,
      promoApplied: false,
      promoMetadata: null,
      totalPrice: 37.5,
    });
  });

  it('rejects bundle quantities above available inventory', () => {
    expect(() =>
      (service as any).getMenuPurchasePlan(
        {
          collectionType: CollectionType.BUNDLES,
          itemCount: 4,
          itemSold: 3,
          priceToView: '9',
        },
        2,
      ),
    ).toThrow(
      new BadRequestException(
        'Only 1 bundle item(s) are available, but 2 were requested.',
      ),
    );
  });

  it('applies active percentage promo to bundle totals', () => {
    const startsAt = new Date(Date.now() - 60_000);
    const endsAt = new Date(Date.now() + 60_000);

    const plan = (service as any).getMenuPurchasePlan(
      {
        collectionType: CollectionType.BUNDLES,
        itemCount: 5,
        itemSold: 0,
        priceToView: '20',
        promo: {
          isEnabled: true,
          type: 'percentage',
          value: '25',
          startsAt,
          endsAt,
          message: 'Weekend',
        },
      },
      2,
    );

    expect(plan.unitPrice).toBe(15);
    expect(plan.baseUnitPrice).toBe(20);
    expect(plan.discountPerItem).toBe(5);
    expect(plan.totalPrice).toBe(30);
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
    const plan = (service as any).getMenuPurchasePlan(
      {
        collectionType: CollectionType.BUNDLES,
        itemCount: 5,
        itemSold: 0,
        priceToView: '18',
        promo: {
          isEnabled: true,
          type: 'fixed',
          value: '4',
          startsAt: new Date(Date.now() - 120_000),
          endsAt: new Date(Date.now() - 60_000),
          message: 'Expired',
        },
      },
      2,
    );

    expect(plan.unitPrice).toBe(18);
    expect(plan.discountPerItem).toBe(0);
    expect(plan.totalPrice).toBe(36);
    expect(plan.promoApplied).toBe(false);
  });
});
