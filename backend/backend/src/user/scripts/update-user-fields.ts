import mongoose, { Model } from 'mongoose';
import { User, UserSchema } from '../../database/schemas/user.schema';
import * as dotenv from 'dotenv';
import {
  Message,
  MessageSchema,
  MessageType,
} from '../../database/schemas/message.schema';
import { MenuMediaSchema } from '../../database/schemas/menu-media.schema';
// import { Wallet, WalletSchema } from '../../database/schemas/wallet.schema';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateAuthPinField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!); // Replace with your MongoDB URI
    console.log('Connected to MongoDB.');

    const userModel: Model<User> = mongoose.model('User', UserSchema);
    // const walletModel: Model<Wallet> = mongoose.model('Wallet', WalletSchema);
    console.log('User Model retrieved:', userModel.modelName);

    const messageModel: Model<Message> = mongoose.model(
      'Message',
      MessageSchema,
    );

    console.log('message Model retrieved:', messageModel.modelName);

    await messageModel.updateMany(
      { type: MessageType.MENU },
      { $set: { mediaModel: 'MenuMedia' } },
    );

    await messageModel.updateMany(
      { type: { $ne: MessageType.MENU } },
      { $set: { mediaModel: 'Media' } },
    );

    // Update users with non-null hashedPin to hasAuthPin: true
    // const updatedTrue = await userModel.updateMany(
    //   { hashedPin: { $exists: true, $ne: null } },
    //   { $set: { hasAuthPin: true } },
    // );

    // Update users without hashedPin and without hasAuthPin to hasAuthPin: false
    // const updatedFalse = await userModel.updateMany(
    //   { hasAuthPin: { $exists: false }, hashedPin: { $exists: false } },
    //   { $set: { hasAuthPin: false } },
    // );

    // const updateAge = await userModel.updateMany(
    //   {},
    //   { $set: { isAgeVerified: false } },
    // );

    // await userModel.updateMany(
    //   { $or: [{ bio: { $exists: false } }, { bio: null }] }, // users without bio
    //   { $set: { bio: '' } }, // set empty string
    // );

    // await userModel.updateMany(
    //   {}, // match all users
    //   { $set: { followerCount: 0, followingCount: 0 } }, // reset both counts
    // );

    // const users = await userModel.find();

    // for (const user of users) {
    //   const wallet = await walletModel.findOne({ user: user._id });
    //   if (wallet) continue;

    //   const newWallet = await walletModel.create({ user: user._id });

    //   await newWallet.save();

    //   console.log(`Created wallet for user ${user._id}`);
    // }

    // console.log(
    //   `✅ Updated ${updatedTrue.modifiedCount} users with hasAuthPin: true`,
    // );
    // console.log(
    //   `✅ Updated ${updatedFalse.modifiedCount} users with hasAuthPin: false`,
    // );
  } catch (err) {
    console.error('❌ Migration failed:', err.message, err.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 MongoDB connection closed.');
  }
}

// async function migrateMenuMessages() {
//   try {
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(process.env.MONGO_URI!); // Replace with your MongoDB URI

//     const messageModel: Model<Message> = mongoose.model(
//       'Message',
//       MessageSchema,
//     );

//     const menuMediaModel: Model<MenuMedia> = mongoose.model(
//       'MenuMedia',
//       MenuMediaSchema,
//     );

//     const messages = await messageModel.find({ mediaModel: 'MenuMedia' });
//     console.log(messages);
//     let count = 0;
//     for (const msg of messages) {
//       console.log('working on :', count);

//       const menuMediaDocs = await menuMediaModel.find({
//         _id: { $in: msg.media },
//       });
//       console.log(menuMediaDocs);
//       if (!menuMediaDocs.length) continue;

//       const realMediaIds = menuMediaDocs.map((m) => m.media);

//       await messageModel.updateOne(
//         { _id: msg._id },
//         {
//           media: realMediaIds,
//           mediaModel: 'Media', // or remove after schema update
//         },
//       );
//       count += 1;
//     }

//     await messageModel.updateMany(
//       { mediaModel: { $exists: true } },
//       { $unset: { mediaModel: '' } },
//     );

//     return `✅ Migration complete. Converted ${messages.length} menu messages.`;
//   } catch (error) {
//     console.log(error);
//   }
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function migrateMenuMessages() {
  await mongoose.connect(process.env.MONGO_URI!, {});

  // Ensure model uses the correct collection name if necessary:
  // const messageModel = mongoose.model('Message', MessageSchema, 'messages');
  // const menuMediaModel = mongoose.model('MenuMedia', MenuMediaSchema, 'menumedias');

  const messageModel: Model<any> =
    mongoose.models.Message || mongoose.model('Message', MessageSchema);
  const menuMediaModel: Model<any> =
    mongoose.models.MenuMedia || mongoose.model('MenuMedia', MenuMediaSchema);

  console.log('Finding messages referencing MenuMedia...');
  const messages = await messageModel.find({ mediaModel: 'MenuMedia' }).lean();

  console.log(`Found ${messages.length} messages to inspect.`);
  let updated = 0;
  let skipped = 0;

  for (const msg of messages) {
    // Normalize ids to ObjectId array
    const rawMediaArray: any[] = Array.isArray(msg.media) ? msg.media : [];
    if (!rawMediaArray.length) {
      skipped++;
      continue;
    }

    const mediaIds = rawMediaArray.map((id) =>
      mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : id,
    );

    // First try: msg.media are MenuMedia._id values
    let menuMediaDocs = await menuMediaModel
      .find({ _id: { $in: mediaIds } })
      .lean();

    // If none found, maybe msg.media already holds Media._id values.
    // In that case, find MenuMedia docs whose `media` field matches those Media ids,
    // then we'll map back to the same Media ids (idempotent).
    if (!menuMediaDocs.length) {
      menuMediaDocs = await menuMediaModel
        .find({ media: { $in: mediaIds } })
        .lean();
    }

    // If still empty, nothing we can do for this message; skip.
    if (!menuMediaDocs.length) {
      console.warn(`No MenuMedia found for message ${msg._id}. Skipping.`);
      skipped++;
      // Still unset mediaModel if you want to remove it even when no mapping found:
      // await messageModel.updateOne({ _id: msg._id }, { $unset: { mediaModel: "" } });
      continue;
    }

    // Extract real Media IDs (inner `.media` field) and dedupe
    const realMediaIds = [
      ...new Set(
        menuMediaDocs.map((m: any) => String(m.media)).filter(Boolean),
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    // Update the message: replace media with realMediaIds and unset mediaModel
    await messageModel.updateOne(
      { _id: msg._id },
      { $set: { media: realMediaIds }, $unset: { mediaModel: '' } },
    );

    updated++;
    if (updated % 50 === 0)
      console.log(`Updated ${updated} messages so far...`);
  }

  console.log(`Migration finished. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

// async function deleteMediaModel() {
//   try {
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(process.env.MONGO_URI!);

//     // ✅ Explicitly set the collection name
//     // const messageModel = mongoose.model('Message', MessageSchema, 'messages');

//     const messageModel: Model<Message> = mongoose.model(
//       'Message',
//       MessageSchema,
//     );

//     console.log('🔄 Removing mediaModel field from all messages...');
//     const result = await messageModel.updateMany(
//       { mediaModel: { $exists: true } },
//       { $unset: { mediaModel: '' } },
//     );

//     console.log(`✅ Removed mediaModel from ${result.modifiedCount} messages.`);
//   } catch (error) {
//     console.log(error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('🔒 MongoDB connection closed.');
//   }
// }

// migrateMenuMessages()
//   .then(() => console.log('Done'))
//   .catch((err) => {
//     console.error('Migration failed', err);
//     process.exit(1);
//   });

// async function updateMessageStatus() {
//   try {
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(process.env.MONGO_URI!); // Replace with your MongoDB URI
//     console.log('Connected to MongoDB.');

//     const userModel: Model<User> = mongoose.model('User', UserSchema);
//     // const walletModel: Model<Wallet> = mongoose.model('Wallet', WalletSchema);
//     console.log('User Model retrieved:', userModel.modelName);

//     const messageModel: Model<Message> = mongoose.model(
//       'Message',
//       MessageSchema,
//     );

//     console.log('message Model retrieved:', messageModel.modelName);

//     await messageModel.updateMany(
//       { status: { $ne: MessageStatus.READ } },
//       { $set: { status: MessageStatus.READ } },
//     );

//     // Update users with non-null hashedPin to hasAuthPin: true
//     // const updatedTrue = await userModel.updateMany(
//     //   { hashedPin: { $exists: true, $ne: null } },
//     //   { $set: { hasAuthPin: true } },
//     // );

//     // Update users without hashedPin and without hasAuthPin to hasAuthPin: false
//     // const updatedFalse = await userModel.updateMany(
//     //   { hasAuthPin: { $exists: false }, hashedPin: { $exists: false } },
//     //   { $set: { hasAuthPin: false } },
//     // );

//     // const updateAge = await userModel.updateMany(
//     //   {},
//     //   { $set: { isAgeVerified: false } },
//     // );

//     // await userModel.updateMany(
//     //   { $or: [{ bio: { $exists: false } }, { bio: null }] }, // users without bio
//     //   { $set: { bio: '' } }, // set empty string
//     // );

//     // await userModel.updateMany(
//     //   {}, // match all users
//     //   { $set: { followerCount: 0, followingCount: 0 } }, // reset both counts
//     // );

//     // const users = await userModel.find();

//     // for (const user of users) {
//     //   const wallet = await walletModel.findOne({ user: user._id });
//     //   if (wallet) continue;

//     //   const newWallet = await walletModel.create({ user: user._id });

//     //   await newWallet.save();

//     //   console.log(`Created wallet for user ${user._id}`);
//     // }

//     // console.log(
//     //   `✅ Updated ${updatedTrue.modifiedCount} users with hasAuthPin: true`,
//     // );
//     // console.log(
//     //   `✅ Updated ${updatedFalse.modifiedCount} users with hasAuthPin: false`,
//     // );
//   } catch (err) {
//     console.error('❌ Migration failed:', err.message, err.stack);
//     process.exit(1);
//   } finally {
//     await mongoose.disconnect();
//     console.log('🔒 MongoDB connection closed.');
//   }
// }

// deleteMediaModel();
// updateMessageStatus();

// migrateMenuMessages();
// updateAuthPinField();
