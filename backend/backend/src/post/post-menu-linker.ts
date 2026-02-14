import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientSession, Model, Types } from 'mongoose';
import { Category } from 'src/database/schemas/category.schema';
import { Media } from 'src/database/schemas/media.schema';
import { CollectionType, Menu } from 'src/database/schemas/menu.schema';
import { MenuMedia } from 'src/database/schemas/menu-media.schema';
import { PostUnlockableType } from 'src/database/schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

type CreateLinkedMenuFromPostMediaArgs = {
  user: { _id: Types.ObjectId; username?: string };
  dto: CreatePostDto;
  mediaIds: string[];
  session: ClientSession;
  categoryModel: Model<Category>;
  mediaModel: Model<Media>;
  menuModel: Model<Menu>;
  menuMediaModel: Model<MenuMedia>;
};

const normalizeMenuPrice = (rawPrice?: string) => {
  const parsed = Number(rawPrice);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(
      'Unlockable posts require a valid price greater than 0.',
    );
  }
  return parsed.toFixed(2);
};

const deriveMenuTitle = (
  menuTitle: string | undefined,
  content: string | undefined,
) => {
  const explicitTitle = menuTitle?.trim();
  if (explicitTitle) return explicitTitle;

  const firstLine = content
    ?.split('\n')
    .find((line) => line.trim().length > 0)
    ?.trim();

  if (firstLine) {
    return firstLine.slice(0, 80);
  }

  return 'Untitled Unlockable';
};

export const createLinkedMenuFromPostMedia = async ({
  user,
  dto,
  mediaIds,
  session,
  categoryModel,
  mediaModel,
  menuModel,
  menuMediaModel,
}: CreateLinkedMenuFromPostMediaArgs): Promise<Types.ObjectId> => {
  const unlockableType = dto.unlockableType ?? PostUnlockableType.NONE;
  if (unlockableType === PostUnlockableType.NONE) {
    throw new BadRequestException(
      'Cannot create linked menu for unlockableType "none".',
    );
  }

  if (mediaIds.length === 0) {
    throw new BadRequestException(
      'Unlockable posts must include media before creating a menu listing.',
    );
  }
  if (unlockableType === PostUnlockableType.SINGLE && mediaIds.length !== 1) {
    throw new BadRequestException(
      'Single unlockable posts must include exactly 1 media file.',
    );
  }
  if (unlockableType === PostUnlockableType.BUNDLE && mediaIds.length < 2) {
    throw new BadRequestException(
      'Bundle unlockable posts must include at least 2 media files.',
    );
  }

  if (!dto.category) {
    throw new BadRequestException('Unlockable posts require a menu category.');
  }

  const category = await categoryModel
    .findOne({ _id: dto.category, owner: user._id })
    .session(session);

  if (!category) {
    throw new NotFoundException(
      'Selected menu category does not exist for this seller.',
    );
  }

  const mediaDocs = await mediaModel
    .find({
      _id: { $in: mediaIds.map((id) => new Types.ObjectId(id)) },
      owner: user._id,
    })
    .session(session);

  const mediaById = new Map(mediaDocs.map((doc) => [doc._id.toString(), doc]));
  const orderedMediaDocs = mediaIds
    .map((id) => mediaById.get(id))
    .filter((doc) => doc !== undefined);

  if (orderedMediaDocs.length !== mediaIds.length) {
    throw new BadRequestException(
      'Some uploaded media could not be resolved for menu linking.',
    );
  }

  const menu = await new menuModel({
    title: deriveMenuTitle(dto.menuTitle, dto.content),
    description: dto.content?.trim() || 'Unlockable content',
    priceToView: normalizeMenuPrice(dto.priceToView),
    discount: '0',
    category: category._id,
    noteToBuyer:
      dto.noteToBuyer?.trim() ||
      `Thank you ${user.username ?? ''} buyer for your unlock.`,
    owner: user._id,
    collectionType:
      unlockableType === PostUnlockableType.BUNDLE
        ? CollectionType.BUNDLES
        : CollectionType.SINGLE,
    itemCount: orderedMediaDocs.length,
    itemSold: 0,
  }).save({ session });

  await mediaModel
    .updateMany(
      { _id: { $in: orderedMediaDocs.map((doc) => doc._id) } },
      { $set: { menu: menu._id } },
      { session },
    )
    .exec();

  const insertedMenuMedia = await menuMediaModel.insertMany(
    orderedMediaDocs.map((doc) => ({
      media: doc._id,
      sold: false,
      buyer: null,
      payment: null,
    })),
    { session },
  );

  const coverMedia = orderedMediaDocs[0];
  await menuModel.updateOne(
    { _id: menu._id },
    {
      $set: {
        media: insertedMenuMedia.map((doc) => doc._id),
        coverImage: {
          url: coverMedia.url,
          public_id: coverMedia.public_id,
        },
      },
    },
    { session },
  );

  return menu._id as Types.ObjectId;
};
