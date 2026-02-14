import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getBlurredImage } from '@/lib/utils';
import type { CommentType, MediaType, PostType } from '@/types/global';
import Image from 'next/image';
import { AuthPromptDialog } from './auth-prompt-dialog';
import { PostMediaDialog } from './post-media-dialog';
import { useState, type CSSProperties } from 'react';
import { FALLBACK_IMAGE } from '@/constants/constants';
import { Icon } from './ui/icons';

type UnlockOverlay = {
  priceLabel: string;
  lockedCount: number;
  onUnlock?: () => void;
};

export const PostMedia = ({
  media,
  content,
  unlockOverlay,
}: {
  media: MediaType[];
  content: PostType | CommentType;
  unlockOverlay?: UnlockOverlay;
}) => {
  const { isAuthenticated } = useAuth();
  const { showExplicitContent } = useGlobal();

  const previewCount = media?.length ?? 0;
  const lockedCount = Math.max(0, unlockOverlay?.lockedCount ?? 0);
  const totalCount = previewCount + lockedCount;
  const displayCount = Math.min(totalCount, 4);
  const overflowCount = Math.max(0, totalCount - 4);

  if (totalCount === 0) {
    return null;
  }

  const MediaDialog = isAuthenticated ? PostMediaDialog : AuthPromptDialog;
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [previewAspects, setPreviewAspects] = useState<Record<string, number>>(
    {}
  );

  const getImageSrc = (originalSrc: string) =>
    failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;

  const getPreviewAspect = (index: number) => {
    if (index < 0 || index >= previewCount) {
      return 1;
    }

    const mediaUrl = media[index]?.url;
    if (!mediaUrl) {
      return 1;
    }

    return previewAspects[mediaUrl] || 1;
  };

  const setPreviewAspect = (url: string, width: number, height: number) => {
    if (!width || !height) return;
    const clampedAspect = Math.max(0.55, Math.min(width / height, 2.2));
    setPreviewAspects((previous) => {
      if (previous[url] === clampedAspect) {
        return previous;
      }
      return { ...previous, [url]: clampedAspect };
    });
  };

  const renderPreviewTile = (
    item: MediaType,
    index: number,
    className: string,
    showOverflowOverlay = false,
    tileStyle?: CSSProperties
  ) => (
    <div
      key={item._id ?? index}
      className={`relative overflow-hidden rounded-[10px] bg-black ${className}`}
      style={tileStyle}
    >
      {item.type === 'image' ? (
        <MediaDialog
          content={content}
          media={media}
          activeMediaIndex={index}
          activeMedia={item}
        >
          <Image
            src={
              showExplicitContent
                ? getImageSrc(item.url)
                : getBlurredImage(getImageSrc(item.url))
            }
            alt={item.caption || `Post media ${index + 1}`}
            fill
            data-error={failedImages.has(item.url)}
            className="object-contain duration-150 data-[error=true]:opacity-50"
            sizes="(max-width: 768px) 100vw, 700px"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onError={() =>
              setFailedImages((prev) => new Set([...prev, item.url]))
            }
            onLoad={(event) =>
              setPreviewAspect(
                item.url,
                event.currentTarget.naturalWidth,
                event.currentTarget.naturalHeight
              )
            }
          />
        </MediaDialog>
      ) : item.type === 'video' ? (
        <MediaDialog
          content={content}
          media={media}
          activeMediaIndex={index}
          activeMedia={item}
        >
          <video
            src={item.url}
            className="h-full w-full object-contain"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) =>
              setPreviewAspect(
                item.url,
                event.currentTarget.videoWidth,
                event.currentTarget.videoHeight
              )
            }
          />
        </MediaDialog>
      ) : null}

      {failedImages.has(item.url) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-3 text-sm font-semibold uppercase text-[#B8BDC8]">
          unable to load {item.type}
        </div>
      )}

      {showOverflowOverlay && overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090C12]/70 text-xl font-semibold text-[#F8F8F8]">
          +{overflowCount}
        </div>
      )}
    </div>
  );

  const renderLockedTile = (
    slot: number,
    className: string,
    showOverflowOverlay = false,
    showUnlockAction = false,
    tileStyle?: CSSProperties
  ) => (
    <button
      type="button"
      key={`locked-slot-${slot}`}
      onClick={(event) => {
        event.stopPropagation();
        unlockOverlay?.onUnlock?.();
      }}
      disabled={!unlockOverlay?.onUnlock}
      className={`relative overflow-hidden rounded-[10px] border border-[#242934] bg-[linear-gradient(135deg,#171D28_0%,#0D121B_100%)] text-left ${className} ${
        unlockOverlay?.onUnlock ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={tileStyle}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-[#2A2F3A] bg-[#0A0E14]/80 p-2 text-[#7D8392]">
          <Icon.lock className="h-3.5 w-3.5" />
        </div>
      </div>
      {showUnlockAction && unlockOverlay?.priceLabel && (
        <div className="absolute inset-x-2 bottom-2 rounded-md border border-[#2F3440] bg-[#141925]/95 px-2 py-1 text-center text-[11px] font-medium text-[#E6EAF2]">
          Unlock {unlockOverlay.priceLabel}
        </div>
      )}
      {showOverflowOverlay && overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090C12]/70 text-xl font-semibold text-[#F8F8F8]">
          +{overflowCount}
        </div>
      )}
    </button>
  );

  const renderSlot = (
    slot: number,
    className: string,
    showOverflowOverlay = false,
    tileStyle?: CSSProperties
  ) => {
    if (slot < previewCount) {
      return renderPreviewTile(
        media[slot],
        slot,
        className,
        showOverflowOverlay,
        tileStyle
      );
    }
    const lockedSlotIndex = slot - previewCount;
    return renderLockedTile(
      slot,
      className,
      showOverflowOverlay,
      lockedSlotIndex === 0,
      tileStyle
    );
  };

  const getSlotAspect = (slot: number, fallback: number) => {
    if (slot < previewCount) {
      return Math.max(1.1, Math.min(getPreviewAspect(slot), 1.85));
    }
    return fallback;
  };

  const primaryWideAspect = getSlotAspect(0, 1.45);
  const secondaryWideAspect = Math.max(1.15, Math.min(primaryWideAspect, 1.45));
  const singleLockedAspect = Math.max(1.1, Math.min(primaryWideAspect, 1.55));

  const singlePreviewTileStyle: CSSProperties | undefined =
    previewCount === 1 && lockedCount === 0
      ? (() => {
          const aspectRatio = getPreviewAspect(0);
          return {
            aspectRatio,
            width:
              aspectRatio < 1
                ? `min(100%, calc(82vh * ${aspectRatio}))`
                : '100%',
            maxWidth: '100%',
            marginInline: 'auto',
          };
        })()
      : undefined;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {displayCount === 1 && (
        <div className="grid">
          {renderSlot(0, 'w-full', overflowCount > 0, singlePreviewTileStyle)}
        </div>
      )}

      {displayCount === 2 && (
        <div className="grid gap-1.5">
          {renderSlot(0, 'w-full', false, {
            aspectRatio: getSlotAspect(0, singleLockedAspect),
          })}
          {renderSlot(1, 'w-full', overflowCount > 0, {
            aspectRatio: getSlotAspect(1, singleLockedAspect),
          })}
        </div>
      )}

      {displayCount === 3 && (
        <div className="grid grid-cols-2 gap-1.5">
          {renderSlot(0, 'col-span-2 w-full', false, {
            aspectRatio: primaryWideAspect,
          })}
          {renderSlot(1, 'w-full', false, {
            aspectRatio: getSlotAspect(1, secondaryWideAspect),
          })}
          {renderSlot(2, 'w-full', overflowCount > 0, {
            aspectRatio: getSlotAspect(2, secondaryWideAspect),
          })}
        </div>
      )}

      {displayCount >= 4 && (
        <div className="grid grid-cols-2 gap-1.5">
          {renderSlot(0, 'col-span-2 w-full', false, {
            aspectRatio: primaryWideAspect,
          })}
          {renderSlot(1, 'w-full', false, {
            aspectRatio: getSlotAspect(1, secondaryWideAspect),
          })}
          {renderSlot(2, 'w-full', false, {
            aspectRatio: getSlotAspect(2, secondaryWideAspect),
          })}
          {renderSlot(3, 'col-span-2 w-full', overflowCount > 0, {
            aspectRatio: getSlotAspect(3, secondaryWideAspect),
          })}
        </div>
      )}
    </div>
  );
};
