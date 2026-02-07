import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { Menu } from 'src/database/schemas/menu.schema';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/database/schemas/transaction.schema';
import { User } from 'src/database/schemas/user.schema';
import { Wallet } from 'src/database/schemas/wallet.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    private eventEmitter: EventEmitter2,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createWallet(userId: string, session?: ClientSession) {
    // Check if wallet exists, attach session if available
    const query = this.walletModel.findOne({ user: userId });
    if (session) query.session(session);

    const exists = await query;
    if (exists) {
      throw new BadRequestException('Wallet already exists');
    }
    const wallet = new this.walletModel({
      user: userId,
    });

    return session ? wallet.save({ session }) : wallet.save();
  }

  async getWallet(
    discordId: string,
    session?: ClientSession,
  ): Promise<{ wallet: Wallet; balance: number }> {
    // Build user query and attach session only if provided
    const userQuery = this.userModel.findOne({ discordId }).lean();
    if (session) userQuery.session(session);

    const user = await userQuery;
    if (!user)
      throw new NotFoundException(`User with discordId ${discordId} not found`);

    // Build wallet query and attach session only if provided
    const walletQuery = this.walletModel
      .findOne({ user: user._id })
      .populate(
        'user',
        '_id discordId username displayName discordAvatar profileImage',
      )
      .lean();
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet)
      throw new NotFoundException(`Wallet for user ${discordId} not found`);

    return {
      wallet,
      balance: this.toDollar(wallet.balance ?? 0),
    };
  }

  async getWalletBalance(discordId: string) {
    const user = await this.userModel.findOne({ discordId });
    if (!user) throw new NotFoundException('User not found');

    const wallet = await this.walletModel.findOne({ user: user._id });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return {
      balance: this.toDollar(wallet.balance),
      currency: wallet.currency,
    };
  }

  /** 🔹 Top-up wallet (called after payment gateway webhook confirms payment) */
  /**
   * Top-up wallet (call from payment webhook).
   * If reference is provided and a tx with the same reference exists -> idempotent return.
   * amount is a string (dollars), converted to cents.
   */
  async topUp(userId: string, amount: string, reference?: string) {
    const formattedAmount = this.toCent(amount);
    const txReference = reference || uuidv4();

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // idempotency check (only meaningful if reference provided by gateway)
      const existing = await this.txModel
        .findOne({ reference: txReference })
        .session(session);
      if (existing) {
        // If it exists and already completed, return duplicate indicator
        if (existing.status === TransactionStatus.COMPLETED) {
          await session.abortTransaction();
          return {
            status: 'duplicate',
            reference: txReference,
            newBalance: this.toDollar(
              (await this.walletModel.findById(existing.wallet)).balance,
            ),
          };
        }
        // If pending/failed you might choose to continue or throw; here we throw conflict
        throw new ConflictException(
          'Transaction with this reference already exists',
        );
      }

      const wallet = await this.walletModel
        .findOne({ user: userId })
        .session(session);
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balanceBefore = wallet.balance;
      wallet.balance += formattedAmount;
      await wallet.save({ session });

      await this.txModel.create(
        [
          {
            wallet: wallet._id,
            type: TransactionType.CREDIT,
            status: TransactionStatus.COMPLETED,
            amount: formattedAmount,
            balanceBefore,
            balanceAfter: wallet.balance,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return {
        status: 'success',
        reference: txReference,
        amount: this.toDollar(formattedAmount),
        newBalance: this.toDollar(wallet.balance),
        currency: wallet.currency,
      };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * CREDIT: Add funds to wallet
   */
  async credit(
    userId: string,
    amount: number,
    meta?: Record<string, any>,
    session?: ClientSession,
  ) {
    const formattedAmount = this.toCent(amount);

    if (formattedAmount <= 0) {
      throw new BadRequestException('Invalid credit amount');
    }

    // Find wallet (attach session only if provided)
    const walletQuery = this.walletModel.findOne({ user: userId });
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet)
      throw new NotFoundException(`Wallet for user ${userId} not found`);

    const beforeBalance = wallet.balance;
    wallet.balance += formattedAmount;

    // Save wallet with session if provided
    await (session ? wallet.save({ session }) : wallet.save());

    // Create transaction safely (Mongoose requires array for session support)
    const [tx] = await this.txModel.create(
      [
        {
          wallet: wallet._id,
          type: TransactionType.CREDIT,
          amount: formattedAmount,
          balanceBefore: beforeBalance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          meta: meta ?? null,
        },
      ],
      { session },
    );

    return { success: true, tx };
  }

  /**
   * DEBIT: Deduct funds from wallet safely
   */
  async debit(
    userId: string,
    amount: string,
    meta?: Record<string, any>,
    session?: ClientSession,
  ) {
    const formattedAmount = this.toCent(amount);

    if (formattedAmount <= 0) {
      throw new BadRequestException('Invalid debit amount');
    }

    // --- Find wallet
    const walletQuery = this.walletModel.findOne({ user: userId });
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet)
      throw new NotFoundException(`Wallet for user ${userId} not found`);

    // --- Check balance
    if (wallet.balance < formattedAmount) {
      throw new BadRequestException('Insufficient funds');
    }

    const beforeBalance = wallet.balance;
    wallet.balance -= formattedAmount;

    // --- Save wallet update
    await (session ? wallet.save({ session }) : wallet.save());

    // --- Create transaction record
    const [tx] = await this.txModel.create(
      [
        {
          wallet: wallet._id,
          type: TransactionType.DEBIT,
          amount: formattedAmount,
          balanceBefore: beforeBalance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          meta: meta ?? null, // safe default
        },
      ],
      { session },
    );

    return { success: true, tx };
  }

  /** 🔹 Debit a User */
  // async debit(
  //   senderId: string,
  //   receiverId: string,
  //   amount: string,
  //   type: TransactionType,
  // ) {
  //   const formattedAmount = this.toCent(amount);

  //   if (senderId === receiverId) {
  //     throw new BadRequestException('Cannot transfer to self');
  //   }

  //   const session = await this.connection.startSession();
  //   session.startTransaction();

  //   try {
  //     const senderWallet = await this.walletModel
  //       .findOne({ user: senderId })
  //       .session(session);
  //     const receiverWallet = await this.walletModel
  //       .findOne({ user: receiverId })
  //       .session(session);

  //     if (!senderWallet || !receiverWallet) {
  //       throw new NotFoundException('Sender or receiver wallet not found');
  //     }

  //     if (senderWallet.balance < formattedAmount) {
  //       throw new BadRequestException('Insufficient balance');
  //     }

  //     const senderBefore = senderWallet.balance;
  //     const receiverBefore = receiverWallet.balance;

  //     senderWallet.balance -= formattedAmount;
  //     receiverWallet.balance += formattedAmount;

  //     await senderWallet.save({ session });
  //     await receiverWallet.save({ session });

  //     const reference = uuidv4();

  //     //   console.log(reference, type, senderWallet, receiverWallet);

  //     // create both txs in one call
  //     await this.txModel.create(
  //       [
  //         {
  //           wallet: senderWallet._id,
  //           type,
  //           action: Action.DEBIT,
  //           status: TransactionStatus.COMPLETED,
  //           amount: formattedAmount,
  //           balanceBefore: senderBefore,
  //           balanceAfter: senderWallet.balance,
  //           sender: senderId,
  //           receiver: receiverId,
  //           reference: `${reference}-D`,
  //         },
  //         {
  //           wallet: receiverWallet._id,
  //           type,
  //           action: Action.CREDIT,
  //           status: TransactionStatus.COMPLETED,
  //           amount: formattedAmount,
  //           balanceBefore: receiverBefore,
  //           balanceAfter: receiverWallet.balance,
  //           sender: senderId,
  //           receiver: receiverId,
  //           reference: `${reference}-C`,
  //         },
  //       ],
  //       { session, ordered: true },
  //     );

  //     await session.commitTransaction();

  //     return {
  //       status: 'success',
  //       reference,
  //       senderBalance: this.toDollar(senderWallet.balance),
  //       receiverBalance: this.toDollar(receiverWallet.balance),
  //     };
  //   } catch (e) {
  //     await session.abortTransaction();
  //     throw e;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  /**
   * RESERVE: Move funds from balance to reservedBalance
   */
  async reserve(
    userId: string,
    amount: number,
    meta?: Record<string, any>,
    session?: ClientSession,
  ) {
    const formattedAmount = this.toCent(amount);

    if (formattedAmount <= 0) {
      throw new BadRequestException('Invalid reserve amount');
    }

    // --- Find wallet
    const walletQuery = this.walletModel.findOne({ user: userId });
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet)
      throw new NotFoundException(`Wallet for user ${userId} not found`);

    // --- Validate funds
    if (wallet.balance < formattedAmount) {
      throw new BadRequestException('Insufficient funds');
    }

    // --- Update balances
    const beforeBalance = wallet.balance;
    wallet.balance -= formattedAmount;
    wallet.reservedBalance = (wallet.reservedBalance ?? 0) + formattedAmount;

    await (session ? wallet.save({ session }) : wallet.save());

    // --- Create transaction record
    const [tx] = await this.txModel.create(
      [
        {
          wallet: wallet._id,
          type: TransactionType.RESERVE,
          amount: formattedAmount,
          balanceBefore: beforeBalance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.PENDING,
          meta: meta ?? null,
        },
      ],
      { session },
    );

    return { success: true, tx };
  }

  async commitReservation(reserveTxId: string, session?: ClientSession) {
    // --- Fetch the reserve transaction
    const resTxQuery = this.txModel.findById(reserveTxId);
    if (session) resTxQuery.session(session);

    const resTx = await resTxQuery;
    if (!resTx || resTx.type !== TransactionType.RESERVE)
      throw new BadRequestException('Invalid reserve transaction');
    if (resTx.status !== TransactionStatus.PENDING)
      throw new BadRequestException('Reserve transaction not pending');

    // --- Get wallet
    const walletQuery = this.walletModel.findById(resTx.wallet.toString());
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet) throw new NotFoundException('Wallet not found');

    // --- Adjust reserved balance (confirming the debit)
    const beforeBalance = wallet.balance;
    wallet.reservedBalance -= resTx.amount;
    // balance stays the same because reserve() already deducted it

    await (session ? wallet.save({ session }) : wallet.save());

    // --- Mark the reserve tx as completed
    resTx.status = TransactionStatus.COMPLETED;
    await (session ? resTx.save({ session }) : resTx.save());

    // --- Record final debit confirmation
    const [commitTx] = await this.txModel.create(
      [
        {
          wallet: wallet._id,
          type: TransactionType.DEBIT,
          amount: resTx.amount,
          balanceBefore: beforeBalance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          meta: resTx.meta,
        },
      ],
      { session },
    );

    return { success: true, reservationTx: resTx, commitTx };
  }

  async releaseReservation(reserveTxId: string, session?: ClientSession) {
    // --- Fetch the reserved transaction
    const resTxQuery = this.txModel.findById(reserveTxId);
    if (session) resTxQuery.session(session);

    const resTx = await resTxQuery;
    if (!resTx || resTx.type !== TransactionType.RESERVE)
      throw new BadRequestException('Invalid reserve transaction');
    if (resTx.status !== TransactionStatus.PENDING)
      throw new BadRequestException('Reserve transaction not pending');

    // --- Fetch wallet
    const walletQuery = this.walletModel.findById(resTx.wallet.toString());
    if (session) walletQuery.session(session);

    const wallet = await walletQuery;
    if (!wallet) throw new NotFoundException('Wallet not found');

    // --- Update balances
    const beforeBalance = wallet.balance;
    wallet.reservedBalance -= resTx.amount;
    wallet.balance += resTx.amount; // refund reserved funds back to wallet

    await (session ? wallet.save({ session }) : wallet.save());

    // --- Mark reserve transaction as released
    resTx.status = TransactionStatus.REVERSED; // or REVERSED, depending on your enum
    await (session ? resTx.save({ session }) : resTx.save());

    // --- Log release transaction
    const [releaseTx] = await this.txModel.create(
      [
        {
          wallet: wallet._id,
          type: TransactionType.RELEASE,
          amount: resTx.amount,
          balanceBefore: beforeBalance,
          balanceAfter: wallet.balance,
          status: TransactionStatus.COMPLETED,
          meta: resTx.meta,
        },
      ],
      { session },
    );

    return { success: true, reservationTx: resTx, releaseTx };
  }

  // async getWalletTransaction(
  //   discordId: string,
  //   limit = 100, // default fetch latest 100
  // ): Promise<Transaction[]> {
  //   const wallet = await this.getWallet(discordId);

  //   // console.log(wallet);
  //   const filter: any = {
  //     wallet: wallet.wallet,
  //     type: { $in: [TransactionType.CREDIT, TransactionType.DEBIT] }, // only money in/out
  //   };

  //   // return this.txModel
  //   //   .find(filter)
  //   //   .sort({ createdAt: -1 }) // latest first
  //   //   .limit(limit)
  //   //   .lean(); // meta included automatically

  //   const tx = await this.txModel
  //     .find(filter)
  //     .sort({ createdAt: -1 })
  //     .limit(limit)
  //     .lean();

  //   return tx.map((t) => ({
  //     ...t,
  //     amount: this.toDollar(t.amount),
  //   }));
  // }

  // async getWalletTransaction(discordId: string, limit = 100): Promise<any[]> {
  //   const wallet = await this.getWallet(discordId);

  //   const tx = await this.txModel
  //     .find({
  //       wallet: wallet.wallet,
  //       type: { $in: [TransactionType.CREDIT, TransactionType.DEBIT] },
  //     })
  //     .sort({ createdAt: -1 })
  //     .limit(limit)
  //     .lean();

  //   // 1️⃣ Collect user IDs from meta
  //   const userIds = new Set<string>();

  //   tx.forEach((t) => {
  //     if (t.meta?.fromUser) userIds.add(t.meta.fromUser.toString());
  //     if (t.meta?.toUser) userIds.add(t.meta.toUser.toString());
  //   });

  //   // 2️⃣ Fetch ONLY required user fields
  //   const users = await this.userModel
  //     .find(
  //       { _id: { $in: [...userIds] } },
  //       {
  //         _id: 1,
  //         username: 1,
  //         discordId: 1,
  //         displayName: 1,
  //         discordAvatar: 1,
  //         role: 1,
  //         profileImage: 1,
  //         discordDisplayName: 1,
  //       },
  //     )
  //     .lean();

  //   // 3️⃣ Create lookup map
  //   const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  //   // 4️⃣ Replace meta user IDs with user objects
  //   return tx.map((t) => ({
  //     ...t,
  //     amount: this.toDollar(t.amount),
  //     meta: {
  //       ...t.meta,
  //       fromUser: t.meta?.fromUser
  //         ? (userMap.get(t.meta.fromUser.toString()) ?? null)
  //         : null,
  //       toUser: t.meta?.toUser
  //         ? (userMap.get(t.meta.toUser.toString()) ?? null)
  //         : null,
  //     },
  //   }));
  // }

  async getWalletTransaction(discordId: string, limit = 100): Promise<any[]> {
    const wallet = await this.getWallet(discordId);

    const transactions = await this.txModel
      .find({
        wallet: wallet.wallet,
        type: { $in: [TransactionType.CREDIT, TransactionType.DEBIT] },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Collect IDs
    const userIds = new Set<string>();
    const menuIds = new Set<string>();

    for (const tx of transactions) {
      if (tx.meta?.fromUser) userIds.add(tx.meta.fromUser.toString());
      if (tx.meta?.toUser) userIds.add(tx.meta.toUser.toString());
      if (tx.meta?.menuId) menuIds.add(tx.meta.menuId.toString());
    }

    // Fetch users
    const users = userIds.size
      ? await this.userModel
          .find(
            { _id: { $in: [...userIds] } },
            {
              _id: 1,
              username: 1,
              discordId: 1,
              displayName: 1,
              discordAvatar: 1,
              role: 1,
              profileImage: 1,
              discordDisplayName: 1,
            },
          )
          .lean()
      : [];

    // Fetch menus
    const menus = menuIds.size
      ? await this.menuModel
          .find(
            { _id: { $in: [...menuIds] } },
            {
              _id: 1,
              title: 1,
              description: 1,
            },
          )
          .lean()
      : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    // Enrich
    return transactions.map((tx) => {
      if (!tx.meta) {
        return {
          ...tx,
          amount: this.toDollar(tx.amount),
        };
      }

      const meta: any = { ...tx.meta };

      if (meta.fromUser) {
        meta.fromUser = userMap.get(meta.fromUser.toString()) ?? null;
      }

      if (meta.toUser) {
        meta.toUser = userMap.get(meta.toUser.toString()) ?? null;
      }

      // 🔥 KEY RULE: menu only exists if menuId exists
      if (meta.menuId) {
        meta.menu = menuMap.get(meta.menuId.toString()) ?? null;
        delete meta.menuId;
      }

      return {
        ...tx,
        amount: this.toDollar(tx.amount),
        meta,
      };
    });
  }

  /** 🔹 Helper to convert cents -> dollars */
  toDollar(amountInCents: number): number {
    return amountInCents / 100;
  }

  // toCent(amountInDollars: string): number {
  //   const parsed = parseFloat(amountInDollars);
  //   if (isNaN(parsed)) {
  //     throw new BadRequestException(
  //       `Invalid dollar amount: ${amountInDollars}`,
  //     );
  //   }
  //   return Math.round(parsed * 100); // Round to nearest cent
  // }
  toCent(amountInDollars: string | number): number {
    const parsed =
      typeof amountInDollars === 'string'
        ? parseFloat(amountInDollars)
        : amountInDollars;
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Invalid dollar amount: ${amountInDollars}`,
      );
    }
    return Math.round(parsed * 100); // Round to nearest cent
  }
}
