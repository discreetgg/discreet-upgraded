// import {
//   BadRequestException,
//   ConflictException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { InjectConnection, InjectModel } from '@nestjs/mongoose';
// import { ClientSession, Connection, Model } from 'mongoose';
// import {
//   Action,
//   Transaction,
//   TransactionStatus,
//   TransactionType,
// } from 'src/database/schemas/transaction.schema';
// import { User } from 'src/database/schemas/user.schema';
// import { Wallet } from 'src/database/schemas/wallet.schema';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class WalletService {
//   constructor(
//     private eventEmitter: EventEmitter2,
//     @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
//     @InjectModel(Transaction.name) private txModel: Model<Transaction>,
//     @InjectModel(User.name) private readonly userModel: Model<User>,
//     @InjectConnection() private readonly connection: Connection,
//   ) {}

//   // async createWallet(userId: string) {
//   //   const exists = await this.walletModel.findOne({ user: userId });
//   //   if (exists) throw new BadRequestException('Wallet already exists');

//   //   const wallet = new this.walletModel({
//   //     user: userId,
//   //   });

//   //   return wallet.save();
//   // }

//   async createWallet(userId: string, session?: ClientSession) {
//     const exists = await this.walletModel
//       .findOne({ user: userId })
//       .session(session || null);
//     if (exists) {
//       throw new BadRequestException('Wallet already exists');
//     }

//     const wallet = new this.walletModel({
//       user: userId,
//     });

//     return wallet.save({ session });
//   }

//   async getWallet(discordId: string): Promise<any> {
//     const user = await this.userModel.findOne({ discordId });
//     if (!user) throw new NotFoundException('User not found');

//     const wallet = await this.walletModel
//       .findOne({ user: user._id })
//       .populate(
//         'user',
//         'discordId username displayName discordAvatar profileImage',
//       );
//     if (!wallet) throw new NotFoundException('Wallet not found');
//     return {
//       ...wallet.toObject(),
//       balance: this.toDollar(wallet.balance),
//     };
//   }

//   async getWalletBalance(discordId: string) {
//     const user = await this.userModel.findOne({ discordId });
//     if (!user) throw new NotFoundException('User not found');

//     const wallet = await this.walletModel.findOne({ user: user._id });
//     if (!wallet) throw new NotFoundException('Wallet not found');

//     return {
//       balance: this.toDollar(wallet.balance),
//       currency: wallet.currency,
//     };
//   }

//   /** 🔹 Top-up wallet (called after payment gateway webhook confirms payment) */
//   /**
//    * Top-up wallet (call from payment webhook).
//    * If reference is provided and a tx with the same reference exists -> idempotent return.
//    * amount is a string (dollars), converted to cents.
//    */
//   async topUp(userId: string, amount: string, reference?: string) {
//     const formattedAmount = this.toCent(amount);
//     const txReference = reference || uuidv4();

//     const session = await this.connection.startSession();
//     session.startTransaction();

//     try {
//       // idempotency check (only meaningful if reference provided by gateway)
//       const existing = await this.txModel
//         .findOne({ reference: txReference })
//         .session(session);
//       if (existing) {
//         // If it exists and already completed, return duplicate indicator
//         if (existing.status === TransactionStatus.COMPLETED) {
//           await session.abortTransaction();
//           return {
//             status: 'duplicate',
//             reference: txReference,
//             newBalance: this.toDollar(
//               (await this.walletModel.findById(existing.wallet)).balance,
//             ),
//           };
//         }
//         // If pending/failed you might choose to continue or throw; here we throw conflict
//         throw new ConflictException(
//           'Transaction with this reference already exists',
//         );
//       }

//       const wallet = await this.walletModel
//         .findOne({ user: userId })
//         .session(session);
//       if (!wallet) throw new NotFoundException('Wallet not found');

//       const balanceBefore = wallet.balance;
//       wallet.balance += formattedAmount;
//       await wallet.save({ session });

//       await this.txModel.create(
//         [
//           {
//             wallet: wallet._id,
//             type: TransactionType.FUND,
//             status: TransactionStatus.COMPLETED,
//             amount: formattedAmount,
//             balanceBefore,
//             balanceAfter: wallet.balance,
//             reference: txReference,
//           },
//         ],
//         { session },
//       );

//       await session.commitTransaction();
//       return {
//         status: 'success',
//         reference: txReference,
//         amount: this.toDollar(formattedAmount),
//         newBalance: this.toDollar(wallet.balance),
//         currency: wallet.currency,
//       };
//     } catch (e) {
//       await session.abortTransaction();
//       throw e;
//     } finally {
//       session.endSession();
//     }
//   }

//   /** 🔹 Transfer money between users */
//   async transfer(senderId: string, receiverId: string, amount: string) {
//     const formattedAmount = this.toCent(amount);

//     if (senderId === receiverId) {
//       throw new BadRequestException('Cannot transfer to self');
//     }

//     const session = await this.connection.startSession();
//     session.startTransaction();

//     try {
//       const senderWallet = await this.walletModel
//         .findOne({ user: senderId })
//         .session(session);
//       const receiverWallet = await this.walletModel
//         .findOne({ user: receiverId })
//         .session(session);

//       if (!senderWallet || !receiverWallet) {
//         throw new NotFoundException('Sender or receiver wallet not found');
//       }

//       if (senderWallet.balance < formattedAmount) {
//         throw new BadRequestException('Insufficient balance');
//       }

//       const senderBefore = senderWallet.balance;
//       const receiverBefore = receiverWallet.balance;

//       senderWallet.balance -= formattedAmount;
//       receiverWallet.balance += formattedAmount;

//       await senderWallet.save({ session });
//       await receiverWallet.save({ session });

//       const reference = uuidv4();

//       // create both txs in one call
//       await this.txModel.create(
//         [
//           {
//             wallet: senderWallet._id,
//             type: TransactionType.TRANSFER,
//             status: TransactionStatus.COMPLETED,
//             amount: formattedAmount,
//             balanceBefore: senderBefore,
//             balanceAfter: senderWallet.balance,
//             sender: senderId,
//             receiver: receiverId,
//             reference,
//           },
//           {
//             wallet: receiverWallet._id,
//             type: TransactionType.TRANSFER,
//             status: TransactionStatus.COMPLETED,
//             amount: formattedAmount,
//             balanceBefore: receiverBefore,
//             balanceAfter: receiverWallet.balance,
//             sender: senderId,
//             receiver: receiverId,
//             reference,
//           },
//         ],
//         { session },
//       );

//       await session.commitTransaction();

//       return {
//         status: 'success',
//         reference,
//         senderBalance: this.toDollar(senderWallet.balance),
//         receiverBalance: this.toDollar(receiverWallet.balance),
//       };
//     } catch (e) {
//       await session.abortTransaction();
//       throw e;
//     } finally {
//       session.endSession();
//     }
//   }

//   /** 🔹 Debit a User */
//   async debit(
//     senderId: string,
//     receiverId: string,
//     amount: string,
//     type: TransactionType,
//   ) {
//     const formattedAmount = this.toCent(amount);

//     if (senderId === receiverId) {
//       throw new BadRequestException('Cannot transfer to self');
//     }

//     const session = await this.connection.startSession();
//     session.startTransaction();

//     try {
//       const senderWallet = await this.walletModel
//         .findOne({ user: senderId })
//         .session(session);
//       const receiverWallet = await this.walletModel
//         .findOne({ user: receiverId })
//         .session(session);

//       if (!senderWallet || !receiverWallet) {
//         throw new NotFoundException('Sender or receiver wallet not found');
//       }

//       if (senderWallet.balance < formattedAmount) {
//         throw new BadRequestException('Insufficient balance');
//       }

//       const senderBefore = senderWallet.balance;
//       const receiverBefore = receiverWallet.balance;

//       senderWallet.balance -= formattedAmount;
//       receiverWallet.balance += formattedAmount;

//       await senderWallet.save({ session });
//       await receiverWallet.save({ session });

//       const reference = uuidv4();

//       // create both txs in one call
//       await this.txModel.create(
//         [
//           {
//             wallet: senderWallet._id,
//             type,
//             action: Action.DEBIT,
//             status: TransactionStatus.COMPLETED,
//             amount: formattedAmount,
//             balanceBefore: senderBefore,
//             balanceAfter: senderWallet.balance,
//             sender: senderId,
//             receiver: receiverId,
//             reference,
//           },
//           {
//             wallet: receiverWallet._id,
//             type,
//             action: Action.CREDIT,
//             status: TransactionStatus.COMPLETED,
//             amount: formattedAmount,
//             balanceBefore: receiverBefore,
//             balanceAfter: receiverWallet.balance,
//             sender: senderId,
//             receiver: receiverId,
//             reference,
//           },
//         ],
//         { session },
//       );

//       await session.commitTransaction();

//       return {
//         status: 'success',
//         reference,
//         senderBalance: this.toDollar(senderWallet.balance),
//         receiverBalance: this.toDollar(receiverWallet.balance),
//       };
//     } catch (e) {
//       await session.abortTransaction();
//       throw e;
//     } finally {
//       session.endSession();
//     }
//   }

//   /** 🔹 Transaction history */
//   // async getTransactions(discordId: string, limit = 50) {
//   //   const user = await this.userModel.findOne({ discordId });
//   //   if (!user) throw new NotFoundException('User not found');

//   //   const wallet = await this.walletModel.findOne({ user: user._id });
//   //   if (!wallet) throw new NotFoundException('Wallet not found');

//   //   return this.txModel
//   //     .find({ wallet: wallet._id })
//   //     .sort({ createdAt: -1 })
//   //     .limit(limit)
//   //     .populate([
//   //       {
//   //         path: 'sender',
//   //         select: 'discordId username displayName discordAvatar profileImage',
//   //       },
//   //       {
//   //         path: 'receiver',
//   //         select: 'discordId username displayName discordAvatar profileImage',
//   //       },
//   //     ]);
//   // }

//   /** 🔹 Transaction history */
//   async getTransactions(discordId: string, limit = 20) {
//     const user = await this.userModel.findOne({ discordId });
//     if (!user) throw new NotFoundException('User not found');

//     const wallet = await this.walletModel.findOne({ user: user._id });
//     if (!wallet) throw new NotFoundException('Wallet not found');

//     const transactions = await this.txModel
//       .find({ wallet: wallet._id })
//       .sort({ createdAt: -1 })
//       .limit(limit)
//       .populate([
//         {
//           path: 'sender',
//           select: 'discordId username displayName discordAvatar profileImage',
//         },
//         {
//           path: 'receiver',
//           select: 'discordId username displayName discordAvatar profileImage',
//         },
//       ])
//       .select('-__v')
//       .lean(); // return plain objects so we can map easily

//     return transactions.map((tx) => ({
//       ...tx,
//       amount: this.toDollar(tx.amount),
//       balanceBefore: this.toDollar(tx.balanceBefore),
//       balanceAfter: this.toDollar(tx.balanceAfter),
//     }));
//   }

//   /** 🔹 Helper to convert cents -> dollars */
//   toDollar(amountInCents: number): number {
//     return amountInCents / 100;
//   }

//   toCent(amountInDollars: string): number {
//     const parsed = parseFloat(amountInDollars);
//     if (isNaN(parsed)) {
//       throw new BadRequestException(
//         `Invalid dollar amount: ${amountInDollars}`,
//       );
//     }
//     return Math.round(parsed * 100); // Round to nearest cent
//   }
// }

// // async initiateTopUp(userId: string, amount: string) {
// //   const cents = this.toCent(amount);
// //   const tx = await this.txModel.create({
// //     wallet: userId,
// //     type: TransactionType.TOPUP,
// //     status: TransactionStatus.PENDING, // 👈 initial state
// //     amount: cents,
// //     reference: uuidv4(),
// //   });

// //   // Call payment gateway with tx.reference
// //   return { reference: tx.reference, status: tx.status };
// // }

// // async confirmTopUp(reference: string, success: boolean) {
// //   const tx = await this.txModel.findOne({ reference });
// //   if (!tx) throw new NotFoundException('Transaction not found');

// //   if (success) {
// //     tx.status = TransactionStatus.COMPLETED;
// //     const wallet = await this.walletModel.findById(tx.wallet);
// //     wallet.balance += tx.amount;
// //     await wallet.save();
// //   } else {
// //     tx.status = TransactionStatus.FAILED;
// //   }
// //   await tx.save();
// //   return tx;
// // }
