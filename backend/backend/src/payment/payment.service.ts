import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Menu } from 'src/database/schemas/menu.schema';
// import { TransactionType } from 'src/database/schemas/transaction.schema';
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
import { Message } from 'src/database/schemas/message.schema';
import { ChatService } from 'src/chat/chat.service';
import { CreateMessageMenuDto } from 'src/chat/dto/create-message.dto';
import { ChatGateway } from 'src/chat/chat.gateway';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/database/schemas/transaction.schema';
import { PayCallDto } from './dto/pay-call.dto';
import { Wallet } from 'src/database/schemas/wallet.schema';
import { MenuMedia } from 'src/database/schemas/menu-media.schema';
import {
  CreateNotificationDto,
  NotificationEntityType,
} from 'src/notification/dto/in-app-notification.dto';
// import { PayCallDto } from './dto/pay-call.dto';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);

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
    @InjectModel(SubscriptionPlan.name)
    private readonly subscriptionPlanModel: Model<SubscriptionPlan>,
    @InjectModel(UserSubscription.name)
    private readonly userSubscriptionModel: Model<UserSubscription>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  // private calcFee(amount: number) {
  //   const fee = Number((amount * PLATFORM_FEE_PERCENT).toFixed(2));
  //   const net = Number((amount - fee).toFixed(2));
  //   return { fee, net };
  // }

  async reservePayment(
    payerId: string,
    amount: number,
    meta: any,
    session?: ClientSession,
  ) {
    // Reserve funds from the payer’s wallet
    const resTx = await this.walletService.reserve(
      payerId,
      amount,
      meta,
      session,
    );

    // Safely derive receiver
    const receiverId = meta.toUser || meta.receiverId;
    if (!receiverId) throw new BadRequestException('Missing receiver in meta');

    // Prepare payment data
    const paymentData = {
      payer: payerId,
      receiver: receiverId,
      amount: this.walletService.toCent(amount),
      type: meta.type,
      meta: meta ?? null,
      debitTx: resTx.tx._id,
      status: PaymentStatus.RESERVED,
    };

    // Create payment record (within same session)
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
    let resTx = null;
    if (paymentTxId) {
      const newResTx = await this.walletService.reserve(
        payerId,
        amount,
        meta,
        session,
      );
      const payment = await this.paymentModel.findOneAndUpdate(
        {
          _id: paymentTxId,
        },
        {
          $push: { batchDebitTx: newResTx.tx._id.toString() },
          $inc: { amount: this.walletService.toCent(amount) },
        },
      );

      return payment;
    } else {
      // Reserve funds from the caller’s wallet
      resTx = await this.walletService.reserve(payerId, amount, meta, session);

      // Safely derive receiver
      const receiverId = meta.toUser || meta.receiverId;
      if (!receiverId)
        throw new BadRequestException('Missing receiver in meta');

      // Prepare payment data
      const paymentData = {
        payer: payerId,
        receiver: receiverId,
        amount: this.walletService.toCent(amount),
        type: meta.type,
        meta: meta ?? null,
        debitTx: resTx.tx._id,
        status: PaymentStatus.RESERVED,
      };

      // Create payment record (within same session)
      const [payment] = await this.paymentModel.create([paymentData], {
        session,
      });

      return payment;
    }
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

      // --- Step 1: Commit the reserved funds (payer debit)
      const { commitTx } = await this.walletService.commitReservation(
        payment.debitTx.toString(),
        session,
      );

      // --- Step 2: Credit the receiver
      // const creditTx = await this.walletService.credit(
      //   payment.receiver.toString(),
      //   this.walletService.toDollar(payment.amount),
      //   {
      //     type: payment.type,
      //     fromUser: payment.payer.toString(),
      //     referencePaymentId: payment._id,
      //   },
      //   session,
      // );
      const meta = { ...payment.meta, referencePaymentId: payment._id };
      const creditTx = await this.walletService.credit(
        payment.receiver.toString(),
        this.walletService.toDollar(payment.amount),
        meta,
        session,
      );

      // --- Step 3: Update payment record
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

      // update status to FAILED outside session
      try {
        await this.paymentModel.findByIdAndUpdate(paymentId, {
          status: PaymentStatus.FAILED,
        });
      } catch {
        // ignore
      }

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

      // ✅ Only send notifications if payment succeeded
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

      // return result;
      result.amount = this.walletService.toDollar(result.amount);
      return { success: true, message: 'Tip sent successfully', tx: result };
    } catch (err) {
      // You can optionally send a “failed tip” email here if desired
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async buyMenu(dto: BuyMenuDto) {
    // const buyerWallet = await this.walletService.getWallet(dto.buyerId);
    // const sellerWallet = await this.walletService.getWallet(dto.sellerId);
    // const menu = await this.menuModel.findById(dto.menuId);

    // const buyer = await this.userModel.findOne({
    //   discordId: dto.buyerId,
    // });
    // const seller = await this.userModel.findOne({
    //   discordId: dto.sellerId,
    // });

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

    if (menu.itemCount === menu.itemSold) {
      throw new BadRequestException('This menu has been sold out');
    }

    if (menu.itemCount === menu.itemSold) {
      throw new BadRequestException('This menu has been sold out');
    }
    if (buyer._id.equals(seller._id)) {
      throw new BadRequestException('You cannot buy your own menu');
    }

    // fetch random unsold media
    const unSoldMedia = await this.getRandomUnsoldMedia(
      menu._id.toString(),
      dto.itemCount ?? null,
    );
    // console.log(unSoldMedia);
    if (unSoldMedia.length == 0) {
      if (dto.itemCount && dto.itemCount > 1) {
        throw new BadRequestException(
          ` Unsold media available, less than requested count of ${dto.itemCount}`,
        );
      } else {
        throw new NotFoundException('No unsold media found for this menu');
      }
    }

    const itemPrice = +menu.priceToView * (dto.itemCount ?? 1);

    let unSoldMediaId;
    if (unSoldMedia.length > 0) {
      unSoldMediaId = unSoldMedia.map((m) => m._id);
    } else {
      unSoldMediaId = unSoldMedia._id.toString();
    }

    const meta = {
      type: PaymentType.MENU_PURCHASE,
      fromUser: buyer._id.toString(),
      toUser: seller._id.toString(),
      menuId: menu._id.toString(),
      itemId: unSoldMediaId,
      itemCount: dto.itemCount ?? 1,
      price: `${itemPrice}`,
    };

    const session = await this.connection.startSession();

    try {
      const payment = await this.reservePayment(
        buyer._id.toString(),
        itemPrice,
        meta,
        session,
      );

      const result = await this.commitPayment(payment._id.toString(), session);
      let purchasedMenuMedia = null;
      if (result.status === PaymentStatus.COMPLETED) {
        // Ensure unSoldMedia is always an array

        const mediaList = Array.isArray(unSoldMedia)
          ? unSoldMedia
          : [unSoldMedia];

        purchasedMenuMedia = await Promise.all(
          mediaList.map((media) => {
            return this.menuMediaModel.findByIdAndUpdate(
              media._id,
              {
                buyer: buyer._id.toString(),
                sold: true,
                payment: result._id.toString(),
                meta,
              },
              { new: true },
            );
          }),
        );

        await this.menuModel.updateOne(
          { _id: menu._id },
          { $inc: { itemSold: mediaList.length }, canBeUpdated: false },
          { session },
        );

        const purchasedMedia = purchasedMenuMedia.map((m) => m.media);

        const menuMessagePayload: CreateMessageMenuDto = {
          sender: seller._id.toString(),
          reciever: buyer._id.toString(),
          media: purchasedMedia,
          text:
            menu.noteToBuyer ?? `Thank you ${buyer.username} for the purchase`,
          price: result.amount.toString(),
          paymentTx: result._id.toString(),
        };

        const sendBuyerMessage =
          await this.chatService.sendMenu(menuMessagePayload);

        try {
          await this.chatGateway.handleSendMenuMessage({
            messageId: sendBuyerMessage._id.toString(),
          });
        } catch (error) {
          this.logger.error(error);
          console.log('error sending buy message ');
        }

        // ✅ Only send notifications if payment succeeded
        const sellerMailPayload: SendEmailDto = {
          recipients: [seller.email],
          subject: 'Sales Notification',
          html: `<h1>Hello ${seller.username}!</h1>
             <p>${buyer.username} bought your menu item ${menu.title}.</p>`,
        };

        const buyerMailPayload: SendEmailDto = {
          recipients: [buyer.email],
          subject: 'Debit',
          html: `<h1>Hello ${buyer.username}!</h1>
             <p>You bought ${seller.username}'s menu item  ${menu.title}.</p>`,
        };

        const inAppNotficationPayload: CreateNotificationDto = {
          user: seller._id.toString(),
          sender: buyer._id.toString(),
          entityType: NotificationEntityType.MenuPurchase,
          entityId: purchasedMedia[0],
          metadata: {
            amount: result.amount.toString(),
            currency: 'USD',
            menu: purchasedMedia,
          },
        };

        await Promise.allSettled([
          this.notificationService.sendEmail(sellerMailPayload),
          this.notificationService.sendEmail(buyerMailPayload),
          this.notificationService.createInAppNotication(
            inAppNotficationPayload,
          ),
        ]);

        // return result;
        result.amount = this.walletService.toDollar(result.amount);
        return {
          success: true,
          message: 'Menu item bought successfully',
          tx: result,
          purchasedMenuMedia,
        };
      }
      return { success: false };
    } catch (err) {
      // await session.abortTransaction();
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

        // ✅ Only send notifications if payment succeeded
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

        // return result;
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
      // await session.abortTransaction();
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

    if (!messageAsset.price || +messageAsset.price == 0) {
      throw new BadRequestException('this message Asset has no price');
    }
    if (!messageAsset.isPayable) {
      throw new BadRequestException('This message asset is not payable');
    }
    if (messageAsset.paid) {
      throw new BadRequestException('This message asset has been paid for');
    }
    if (buyer._id.equals(seller._id)) {
      throw new BadRequestException('You cannot pay for your own asset');
    }

    const meta = {
      type: PaymentType.MEDIA_PURCHASE,
      fromUser: buyer._id.toString(),
      toUser: seller._id.toString(),
      MessageAsset: messageAsset._id.toString(),
      amount: messageAsset.price,
    };

    const session = await this.connection.startSession();

    try {
      const payment = await this.reservePayment(
        buyer._id.toString(),
        +messageAsset.price,
        meta,
        session,
      );

      const result = await this.commitPayment(payment._id.toString(), session);
      let paidMessageAsset = null;
      if (result.status === PaymentStatus.COMPLETED) {
        paidMessageAsset = await this.messageModel.findByIdAndUpdate(
          messageAsset._id,
          { paid: true, paymentTx: result._id },
          { new: true, session },
        );

        // ✅ Only send notifications if payment succeeded
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
            amount: result.amount.toString(),
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

        // return result;
        result.amount = this.walletService.toDollar(result.amount);
        return {
          success: true,
          message: 'Plan subscription successful',
          tx: result,
          paidMessageAsset,
        };
      }
      return { success: false };
    } catch (err) {
      // await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async payForCall(dto: PayCallDto) {
    const [callerWallet, calleeWallet, call, caller, callee] =
      await Promise.all([
        this.walletService.getWallet(dto.callerId),
        this.walletService.getWallet(dto.calleeId),
        this.messageModel.findById(dto.callId),
        this.userModel.findOne({ discordId: dto.callerId }),
        this.userModel.findOne({ discordId: dto.calleeId }),
      ]);

    if (!callerWallet)
      throw new BadRequestException('Caller does not have an active wallet');
    if (!calleeWallet)
      throw new BadRequestException('Callee does not have an active wallet');
    if (!call) throw new NotFoundException('Call session does not exist');

    if (call.paid && call.paymentTx) {
      throw new BadRequestException('call session has been paid for');
    }

    const payment = await this.paymentModel.findOne({
      'meta.callId': call._id.toString(),
    });

    if (!payment)
      throw new BadRequestException('No payment found for this call');

    const duration = dto.duration;
    const totalMinutes = Math.ceil(duration / 60);
    const expectedAmount = this.walletService.toCent(
      callee.callRate * totalMinutes,
    );

    const excess = payment.amount - expectedAmount;

    const session = await this.connection.startSession();
    //update payment with the right amount to debit
    await this.paymentModel.findByIdAndUpdate(payment._id, {
      amount: expectedAmount,
    });

    try {
      const result = await this.commitPayment(payment._id.toString(), session);
      let paidCall = null;
      if (result.status === PaymentStatus.COMPLETED) {
        paidCall = await this.messageModel.findByIdAndUpdate(
          call._id,
          { paid: true, paymentTx: result._id },
          { new: true, session },
        );

        if (excess) {
          const meta = {
            type: PaymentType.CALL_SESSION,
            fromUser: caller._id.toString(),
            toUser: callee._id.toString(),
            callId: call._id.toString(),
            callRate: callee.callRate,
            callDuration: duration,
            amount: dto.amount,
            reversedAmount: excess,
          };
          const wallet = await this.walletModel.findById(caller._id.toString());
          console.log('wallet :', wallet);
          if (wallet.reservedBalance >= excess) {
            const beforeBalance = wallet.balance;
            wallet.reservedBalance -= excess;
            wallet.balance += excess;

            await (session ? wallet.save({ session }) : wallet.save());

            await this.txModel.create(
              [
                {
                  wallet: caller._id,
                  type: TransactionType.RELEASE,
                  amount: excess,
                  balanceBefore: beforeBalance,
                  balanceAfter: wallet.balance,
                  status: TransactionStatus.COMPLETED,
                  meta,
                },
              ],
              { session },
            );
          }
        }

        // ✅ Only send notifications if payment succeeded
        const sellerMailPayload: SendEmailDto = {
          recipients: [callee.email],
          subject: 'Call Payment Notification',
          html: `<h1>Hello ${callee.username}!</h1>
             <p>${caller.username} paid for for call session</p>`,
        };

        const buyerMailPayload: SendEmailDto = {
          recipients: [caller.email],
          subject: 'Debit',
          html: `<h1>Hello ${caller.username}!</h1>
             <p>${result.amount} has been debited from your wallet for call with ${callee.username}.</p>`,
        };

        await Promise.allSettled([
          this.notificationService.sendEmail(sellerMailPayload),
          this.notificationService.sendEmail(buyerMailPayload),
        ]);

        // return result;
        result.amount = this.walletService.toDollar(result.amount);
        return {
          success: true,
          message: 'Call session payment succefull',
          tx: result,
          paidCall,
        };
      }
      return { success: false };
    } catch (err) {
      // await session.abortTransaction();
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
      // Debit caller
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

      // Credit callee
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

  // async subscribeToPlan(
  //   userId: string,
  //   creatorId: string,
  //   planId: string,
  //   amount: number,
  // ) {
  //   const meta = {
  //     type: PaymentType.SUBSCRIPTION,
  //     fromUser: userId,
  //     toUser: creatorId,
  //     planId,
  //   };
  //   const payment = await this.reservePayment(userId, amount, meta);
  //   // create subscription record elsewhere - not shown here
  //   return await this.commitPayment(payment._id);
  // }

  // async payForCallSlot(
  //   callerId: string,
  //   creatorId: string,
  //   callId: string,
  //   amount: number,
  // ) {
  //   const meta = {
  //     type: PaymentType.CALL_BOOKING,
  //     fromUser: callerId,
  //     toUser: creatorId,
  //     callId,
  //   };
  //   const payment = await this.reservePayment(callerId, amount, meta);
  //   // optionally commit only after call completes
  //   return await this.commitPayment(payment._id);
  // }

  // async tipCreator(dto: TipDto) {
  //   const tipperWallet = await this.walletService.getWallet(dto.tipperId);
  //   const sellerWallet = await this.walletService.getWallet(dto.receiverId);

  //   if (!tipperWallet) throw new Error('User does not have an active wallet');
  //   if (!sellerWallet) throw new Error('Seller does not have an active wallet');

  //   if (parseFloat(tipperWallet.balance) < dto.amount) {
  //     throw new BadRequestException('Insufficient funds');
  //   }

  //   const tipper = await this.userModel.findOne({ discordId: dto.tipperId });
  //   const receiver = await this.userModel.findOne({
  //     discordId: dto.receiverId,
  //   });

  //   const debit = await this.walletService.debit(
  //     tipper._id.toString(),
  //     receiver._id.toString(),
  //     dto.amount.toString(),
  //     TransactionType.TIP,
  //   );

  //   if (debit.status !== 'success') {
  //     throw new Error('Tipping failed');
  //   }
  //   const recieverMailPayload: SendEmailDto = {
  //     recipients: [receiver.email],
  //     subject: 'TIP NOTIFICATION',
  //     html: `<h1>Hello! ${receiver.username}</h1><p>${tipper.username} tipped you $${dto.amount}</p>`,
  //   };
  //   const senderMailPayload: SendEmailDto = {
  //     recipients: [tipper.email],
  //     subject: 'TIP NOTIFICATION',
  //     html: `<h1>Hello! ${tipper.username}</h1><p>You tipped ${receiver.username} $${dto.amount}</p>`,
  //   };
  //   await Promise.allSettled([
  //     this.notificationService.sendEmail(senderMailPayload),
  //     this.notificationService.sendEmail(recieverMailPayload),
  //   ]);
  //   return { success: true, message: 'Tip sent successfully' };
  // }

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

  // async renewSubscription(subscriptionId: string) {
  //   const sub = await this.userSubscriptionModel
  //     .findById(subscriptionId)
  //     .populate('plan user');
  //   if (!sub) throw new Error('Subscription not found');

  //   if (sub.status === SubscriptionStatus.CANCELED) return;

  //   const totalAmount = +sub.plan.amount * (sub.durationInMonths ?? 1);
  //   const newEndDate = this.calculateEndDate({
  //     value: sub.durationInMonths ?? 1,
  //     unit: 'month',
  //   });

  //   const meta = {
  //     type: PaymentType.SUBSCRIPTION_RENEWAL,
  //     fromUser: sub.,
  //     toUser: seller._id.toString(),
  //     planId: plan._id.toString(),
  //     planName: plan.name,
  //     planDuration: duration,
  //     subscriptionDuration: dto.durationInMonths ?? 1,
  //     startDate: startDate.toISOString(),
  //     endDate: endDate.toDateString(),
  //     amount: totalAmount,
  //   };
  //   const session = await this.connection.startSession();
  //   // Process payment
  //   const payment = await this.reservePayment(sub.user._id, sub.plan.price, {
  //     type: 'subscription_renewal',
  //     planId: sub.plan._id,
  //     planName: sub.plan.name,
  //   });

  //   const result = await this.commitPayment(payment._id.toString(), session);

  //   sub.startDate = sub.endDate;
  //   sub.endDate = newEndDate;
  //   sub.renewCount += 1;
  //   sub.lastPayment = payment._id;
  //   sub.status = SubscriptionStatus.ACTIVE;
  //   await sub.save();

  //   return sub;
  // }

  // async getRandomUnsoldMedia(menuId: string) {
  //   const menuObjectId = new Types.ObjectId(menuId);

  //   const result = await this.menuModel.aggregate([
  //     { $match: { _id: menuObjectId } },
  //     { $unwind: '$media' },
  //     {
  //       $lookup: {
  //         from: 'menumedias', // MongoDB collection name
  //         localField: 'media',
  //         foreignField: '_id',
  //         as: 'mediaData',
  //       },
  //     },
  //     { $unwind: '$mediaData' },
  //     { $match: { 'mediaData.sold': false } },
  //     { $sample: { size: 1 } }, // pick one random unsold media
  //     {
  //       $project: {
  //         _id: 0,
  //         media: '$mediaData',
  //       },
  //     },
  //   ]);

  //   if (!result.length) {
  //     throw new NotFoundException('No unsold media found for this menu');
  //   }

  //   return result[0].media;
  // }

  // async getRandomUnsoldMedia(menuId: string, count?: number) {
  //   const menuObjectId = new Types.ObjectId(menuId);

  //   // Aggregate all unsold media for this menu
  //   const unsoldMedia = await this.menuModel.aggregate([
  //     { $match: { _id: menuObjectId } },
  //     { $unwind: '$media' },
  //     {
  //       $lookup: {
  //         from: 'menumedias', // MongoDB collection name
  //         localField: 'media',
  //         foreignField: '_id',
  //         as: 'mediaData',
  //       },
  //     },
  //     { $unwind: '$mediaData' },
  //     { $match: { 'mediaData.sold': false } },
  //     {
  //       $project: {
  //         _id: 0,
  //         media: '$mediaData',
  //       },
  //     },
  //   ]);

  //   if (!unsoldMedia.length) {
  //     // throw new NotFoundException('No unsold media found for this menu');
  //     return [];
  //   }

  //   // If no count is provided, return one random media
  //   if (!count) {
  //     const randomIndex = Math.floor(Math.random() * unsoldMedia.length);
  //     return unsoldMedia[randomIndex].media;
  //   }

  //   // If count is provided, check if enough unsold media are available
  //   if (unsoldMedia.length < count) {
  //     // throw new BadRequestException(
  //     //   `Only ${unsoldMedia.length} unsold media available, less than requested count of ${count}`,
  //     // );
  //     return [];
  //   }

  //   // Randomly sample `count` items
  //   const sampled = await this.menuModel.aggregate([
  //     { $match: { _id: menuObjectId } },
  //     { $unwind: '$media' },
  //     {
  //       $lookup: {
  //         from: 'menumedias',
  //         localField: 'media',
  //         foreignField: '_id',
  //         as: 'mediaData',
  //       },
  //     },
  //     { $unwind: '$mediaData' },
  //     { $match: { 'mediaData.sold': false } },
  //     { $sample: { size: count } },
  //     {
  //       $project: {
  //         _id: 0,
  //         media: '$mediaData',
  //       },
  //     },
  //   ]);

  //   return sampled.map((item) => item.media);
  // }

  // async getRandomUnsoldMedia(menuId: string, count?: number) {
  //   const menuObjectId = new Types.ObjectId(menuId);

  //   // 🍀 Step 1: Collect all unique unsold media for this menu
  //   const unsoldMedia = await this.menuModel.aggregate([
  //     { $match: { _id: menuObjectId } },
  //     { $unwind: '$media' },

  //     {
  //       $lookup: {
  //         from: 'menumedias', // collection name
  //         localField: 'media',
  //         foreignField: '_id',
  //         as: 'mediaData',
  //       },
  //     },

  //     { $unwind: '$mediaData' },
  //     { $match: { 'mediaData.sold': false } },

  //     // ⭐ FIX — Ensure media list is always unique
  //     {
  //       $group: {
  //         _id: '$mediaData._id',
  //         media: { $first: '$mediaData' },
  //       },
  //     },

  //     { $project: { _id: 0, media: 1 } },
  //   ]);

  //   // 🛑 If no unsold media exists
  //   if (!unsoldMedia.length) return [];

  //   // 🍀 If only 1 item requested → return a single random media object
  //   if (!count) {
  //     const randomIndex = Math.floor(Math.random() * unsoldMedia.length);
  //     return unsoldMedia[randomIndex].media;
  //   }

  //   // ❌ If request exceeds available items
  //   if (unsoldMedia.length < count) {
  //     return [];
  //   }

  //   // 🍀 Step 2: Randomly sample `count` UNIQUE media
  //   const sampled = await this.menuModel.aggregate([
  //     { $match: { _id: menuObjectId } },
  //     { $unwind: '$media' },

  //     {
  //       $lookup: {
  //         from: 'menumedias',
  //         localField: 'media',
  //         foreignField: '_id',
  //         as: 'mediaData',
  //       },
  //     },

  //     { $unwind: '$mediaData' },
  //     { $match: { 'mediaData.sold': false } },

  //     // ⭐ FIX — remove duplicates before sampling
  //     {
  //       $group: {
  //         _id: '$mediaData._id',
  //         media: { $first: '$mediaData' },
  //       },
  //     },

  //     // 🎯 Select exactly `count` unique items
  //     { $sample: { size: count } },

  //     { $project: { _id: 0, media: 1 } },
  //   ]);

  //   return sampled.map((item) => item.media);
  // }

  async getRandomUnsoldMedia(menuId: string, count?: number) {
    const menuObjectId = new Types.ObjectId(menuId);

    // 🍀 Step 1: Collect all unique unsold media
    const unsoldMedia = await this.menuModel.aggregate([
      { $match: { _id: menuObjectId } },
      { $unwind: '$media' },

      {
        $lookup: {
          from: 'menumedias',
          localField: 'media',
          foreignField: '_id',
          as: 'mediaData',
        },
      },

      { $unwind: '$mediaData' },
      { $match: { 'mediaData.sold': false } },

      // ⭐ FIX: Unique media only
      {
        $group: {
          _id: '$mediaData._id',
          media: { $first: '$mediaData' },
        },
      },

      { $project: { _id: 0, media: 1 } },
    ]);

    // console.log(
    //   '🔍 All unsold media:',
    //   unsoldMedia.map((m) => m.media._id.toString()),
    // );

    if (!unsoldMedia.length) return [];

    // 🍀 Return one random media if count not specified
    if (!count) {
      const randomIndex = Math.floor(Math.random() * unsoldMedia.length);
      const selected = unsoldMedia[randomIndex].media;

      console.log('🎯 Selected ONE random media:', selected._id.toString());

      return selected;
    }

    // ❌ Not enough media
    if (unsoldMedia.length < count) {
      console.log(
        `⚠ Only ${unsoldMedia.length} unsold available, requested ${count}`,
      );
      return [];
    }

    // 🍀 Step 2: sample count unique media
    const sampled = await this.menuModel.aggregate([
      { $match: { _id: menuObjectId } },
      { $unwind: '$media' },

      {
        $lookup: {
          from: 'menumedias',
          localField: 'media',
          foreignField: '_id',
          as: 'mediaData',
        },
      },

      { $unwind: '$mediaData' },
      { $match: { 'mediaData.sold': false } },

      // ⭐ Ensure unique before sampling
      {
        $group: {
          _id: '$mediaData._id',
          media: { $first: '$mediaData' },
        },
      },

      // Randomly pick count
      { $sample: { size: count } },

      { $project: { _id: 0, media: 1 } },
    ]);

    const finalMedia = sampled.map((item) => item.media);

    // console.log(
    //   `🎯 Selected ${count} random UNIQUE media:`,
    //   finalMedia.map((m) => m._id.toString()),
    // );

    return finalMedia;
  }

  async getUserPaidMenu(buyerDiscord: string, sellerDiscord: string) {
    const [buyer, seller] = await Promise.all([
      this.userModel.findOne({ discordId: buyerDiscord }),
      this.userModel.findOne({ discordId: sellerDiscord }),
    ]);

    return await this.menuMediaModel
      .find({
        'meta.fromUser': buyer._id.toString(),
        'meta.toUser': seller._id.toString(),
      })
      .populate('media');
  }
}
