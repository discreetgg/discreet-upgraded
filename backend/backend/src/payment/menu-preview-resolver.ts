import { Model, Types } from 'mongoose';
import { Media } from 'src/database/schemas/media.schema';
import { PreviewMedia } from 'src/database/schemas/menu.schema';
import { Post } from 'src/database/schemas/post.schema';

export const getOrderedMenuPreviewMediaIds = async (args: {
  mediaModel: Model<Media>;
  ownerId: Types.ObjectId;
  previewMedia?: PreviewMedia[] | null;
  coverPublicId?: string | null;
}) => {
  const previewPublicIds = (args.previewMedia ?? [])
    .map((entry) => {
      const rawPublicId = entry?.public_id;
      if (typeof rawPublicId !== 'string') {
        return null;
      }
      const normalizedPublicId = rawPublicId.trim();
      return normalizedPublicId.length > 0 ? normalizedPublicId : null;
    })
    .filter((publicId): publicId is string => Boolean(publicId));
  if (previewPublicIds.length === 0 && !args.coverPublicId) {
    return [];
  }
  const candidatePublicIds = [...previewPublicIds];
  if (args.coverPublicId) {
    const normalizedCoverPublicId = args.coverPublicId.trim();
    if (
      normalizedCoverPublicId.length > 0 &&
      !candidatePublicIds.includes(normalizedCoverPublicId)
    ) {
      candidatePublicIds.unshift(normalizedCoverPublicId);
    }
  }
  if (candidatePublicIds.length === 0) {
    return [];
  }
  const previewMediaDocs = await args.mediaModel
    .find({
      owner: args.ownerId,
      public_id: { $in: candidatePublicIds },
    })
    .select('_id public_id')
    .lean();
  if (previewMediaDocs.length === 0) {
    return [];
  }
  const previewMediaByPublicId = new Map(
    previewMediaDocs.map((doc) => [doc.public_id, doc._id.toString()]),
  );
  const orderedPreviewMediaIds = candidatePublicIds
    .map((publicId) => previewMediaByPublicId.get(publicId))
    .filter((mediaId): mediaId is string => Boolean(mediaId));
  return Array.from(new Set(orderedPreviewMediaIds));
};

export const getSourcePostPreviewMediaIds = async (args: {
  postModel: Model<Post>;
  ownerId: Types.ObjectId;
  sourcePostId?: string | Types.ObjectId | null;
}) => {
  if (!args.sourcePostId) {
    return [];
  }
  const sourcePost = await args.postModel
    .findOne({
      _id: args.sourcePostId,
      author: args.ownerId,
    })
    .select('media')
    .lean();
  if (!sourcePost?.media || !Array.isArray(sourcePost.media)) {
    return [];
  }
  return Array.from(
    new Set(
      sourcePost.media
        .map((mediaId) => mediaId?.toString?.())
        .filter((mediaId): mediaId is string => Boolean(mediaId)),
    ),
  );
};
