import type { MediaType, MessageType } from '@/types/global';

const PREVIEW_CAPTION_HINTS = ['free preview', 'cover image', 'preview'];

export type MessageBundleMediaSlot = {
  media: MediaType;
  index: number;
  isLocked: boolean;
  isPreview: boolean;
};

export type MessageBundleSummary = {
  allSlots: MessageBundleMediaSlot[];
  previewSlots: MessageBundleMediaSlot[];
  lockedSlots: MessageBundleMediaSlot[];
  heroSlots: MessageBundleMediaSlot[];
  imageCount: number;
  videoCount: number;
  totalCount: number;
  isPayable: boolean;
  isReceiver: boolean;
  isLockedForViewer: boolean;
  isPurchasedByReceiver: boolean;
  compositionLabel: string;
};

const isPreviewCaption = (caption?: string) => {
  const normalizedCaption = (caption ?? '').toLowerCase();
  return PREVIEW_CAPTION_HINTS.some((hint) => normalizedCaption.includes(hint));
};

const normalizeMediaType = (mediaType?: string): 'image' | 'video' | null => {
  if (mediaType === 'image' || mediaType === 'video') {
    return mediaType;
  }
  return null;
};

export const formatBundlePriceLabel = (price?: string) => {
  if (!price) {
    return '$0.00';
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) {
    return `$${price}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
};

export const getMessageBundleSummary = (
  message: MessageType,
  viewerDiscordId?: string,
  options?: {
    overridePaid?: boolean;
  },
): MessageBundleSummary => {
  const normalizedMedia = Array.isArray(message.media)
    ? message.media.flatMap((entry, index) => {
        if (!entry || typeof entry === 'string') {
          return [];
        }
        const mediaType = normalizeMediaType(entry.type);
        if (mediaType !== 'image' && mediaType !== 'video') {
          return [];
        }
        return [
          {
            entry,
            index,
          },
        ];
      })
    : [];

  const isPayable = Boolean(message.isPayable);
  const isReceiver = Boolean(
    viewerDiscordId && message.reciever?.discordId === viewerDiscordId,
  );
  const messageMarkedPaid = options?.overridePaid ?? Boolean(message.paid);

  const allSlots = normalizedMedia.map(({ entry, index }) => {
    const mediaMarkedPaid = messageMarkedPaid || Boolean(entry.paid);
    const payableForViewer = isPayable && isReceiver;
    const mediaIsLocked =
      payableForViewer && !mediaMarkedPaid && !isPreviewCaption(entry.caption);

    return {
      media: entry,
      index,
      isLocked: mediaIsLocked,
      isPreview: !mediaIsLocked,
    } satisfies MessageBundleMediaSlot;
  });

  const previewSlots = allSlots.filter((slot) => slot.isPreview);
  const lockedSlots = allSlots.filter((slot) => slot.isLocked);
  const heroSlots =
    previewSlots.length > 0 ? previewSlots : lockedSlots.slice(0, 1);

  const imageCount = allSlots.filter((slot) => slot.media.type === 'image').length;
  const videoCount = allSlots.length - imageCount;
  const totalCount = allSlots.length;

  const compositionParts = [
    imageCount > 0 ? `${imageCount} image${imageCount > 1 ? 's' : ''}` : '',
    videoCount > 0 ? `${videoCount} video${videoCount > 1 ? 's' : ''}` : '',
  ].filter(Boolean);

  const compositionLabel =
    compositionParts.length > 0
      ? compositionParts.join(' • ')
      : `${totalCount} item${totalCount === 1 ? '' : 's'}`;

  const isLockedForViewer = isReceiver && isPayable && lockedSlots.length > 0;
  const isPurchasedByReceiver =
    isReceiver && isPayable && !isLockedForViewer && totalCount > 0;

  return {
    allSlots,
    previewSlots,
    lockedSlots,
    heroSlots,
    imageCount,
    videoCount,
    totalCount,
    isPayable,
    isReceiver,
    isLockedForViewer,
    isPurchasedByReceiver,
    compositionLabel,
  };
};
