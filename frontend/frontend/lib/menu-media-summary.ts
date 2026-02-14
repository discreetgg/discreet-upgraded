type CollectionType = 'single' | 'bundles' | string | null | undefined;

export type MenuMediaSummaryInput = {
  itemCount?: number | null;
  imageCount?: number | null;
  videoCount?: number | null;
  collectionType?: CollectionType;
};

export type MenuMediaSummary = {
  totalCount: number;
  imageCount: number;
  videoCount: number;
  isBundle: boolean;
  typeBadge: string;
  compositionLabel: string;
};

const toSafeCount = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
};

const pluralize = (value: number, singular: string, plural: string) =>
  `${value} ${value === 1 ? singular : plural}`;

export const getMenuMediaSummary = (
  input: MenuMediaSummaryInput
): MenuMediaSummary => {
  const imageCount = toSafeCount(input.imageCount);
  const videoCount = toSafeCount(input.videoCount);
  const typedTotal = imageCount + videoCount;
  const fallbackTotal = Math.max(1, toSafeCount(input.itemCount) || 1);
  const totalCount = typedTotal > 0 ? typedTotal : fallbackTotal;
  const isBundle =
    input.collectionType === 'bundles' ||
    (input.collectionType !== 'single' && totalCount > 1);

  let compositionLabel = pluralize(totalCount, 'item', 'items');
  if (imageCount > 0 && videoCount > 0) {
    compositionLabel = `${pluralize(imageCount, 'image', 'images')} + ${pluralize(
      videoCount,
      'video',
      'videos'
    )}`;
  } else if (imageCount > 0) {
    compositionLabel = pluralize(imageCount, 'image', 'images');
  } else if (videoCount > 0) {
    compositionLabel = pluralize(videoCount, 'video', 'videos');
  }

  let typeBadge = isBundle ? 'Bundle' : 'Single';
  if (!isBundle) {
    if (videoCount === 1 && imageCount === 0) {
      typeBadge = 'Video';
    } else if (imageCount === 1 && videoCount === 0) {
      typeBadge = 'Image';
    }
  } else if (videoCount > 0 && imageCount === 0) {
    typeBadge = 'Video bundle';
  } else if (imageCount > 0 && videoCount === 0) {
    typeBadge = 'Image bundle';
  } else if (imageCount > 0 && videoCount > 0) {
    typeBadge = 'Mixed bundle';
  }

  return {
    totalCount,
    imageCount,
    videoCount,
    isBundle,
    typeBadge,
    compositionLabel,
  };
};
