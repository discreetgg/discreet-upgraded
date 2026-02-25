import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import mongoose, { Model } from 'mongoose';
import { User, UserSchema } from '../../database/schemas/user.schema';

dotenv.config();

type UsernameRecord = {
  _id: mongoose.Types.ObjectId;
  discordId: string;
  username: string;
};

const APPLY_FLAG = '--apply';
const shouldApply = process.argv.includes(APPLY_FLAG);
const logger = new Logger('NormalizeAtUsernamesScript');

async function normalizeAtUsernames() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required to run this script.');
  }

  await mongoose.connect(mongoUri);

  const userModel: Model<User> =
    mongoose.models.User || mongoose.model<User>('User', UserSchema);

  const users = (await userModel
    .find({ username: /^@+/ })
    .select('_id discordId username')
    .lean()) as UsernameRecord[];

  logger.log(`Found ${users.length} user(s) with username starting with @.`);

  let updated = 0;
  let conflicts = 0;
  let skippedEmpty = 0;

  for (const user of users) {
    const normalizedUsername = user.username.replace(/^@+/, '').trim();

    if (!normalizedUsername) {
      skippedEmpty += 1;
      logger.warn(
        `[skip-empty] ${user.discordId} (${String(user._id)}) "${user.username}"`,
      );
      continue;
    }

    const conflict = (await userModel
      .findOne({
        _id: { $ne: user._id },
        username: normalizedUsername,
      })
      .select('_id discordId username')
      .lean()) as UsernameRecord | null;

    if (conflict) {
      conflicts += 1;
      logger.warn(
        `[conflict] ${user.discordId} (${String(user._id)}) "${user.username}" -> "${normalizedUsername}" already used by ${conflict.discordId} (${String(conflict._id)})`,
      );
      continue;
    }

    if (!shouldApply) {
      logger.log(
        `[dry-run] ${user.discordId} (${String(user._id)}) "${user.username}" -> "${normalizedUsername}"`,
      );
      continue;
    }

    await userModel.updateOne(
      { _id: user._id, username: user.username },
      { $set: { username: normalizedUsername } },
    );
    updated += 1;
    logger.log(
      `[updated] ${user.discordId} (${String(user._id)}) "${user.username}" -> "${normalizedUsername}"`,
    );
  }

  if (shouldApply) {
    logger.log(
      `Done. Updated ${updated} user(s). Conflicts: ${conflicts}. Empty normalized usernames skipped: ${skippedEmpty}.`,
    );
  } else {
    logger.log(
      `Dry-run only. Re-run with ${APPLY_FLAG} to apply changes. Conflicts: ${conflicts}. Empty normalized usernames skipped: ${skippedEmpty}.`,
    );
  }
}

normalizeAtUsernames()
  .catch((error) => {
    logger.error('Username normalization failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
