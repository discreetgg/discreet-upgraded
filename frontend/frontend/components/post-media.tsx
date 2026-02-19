import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getBlurredImage } from '@/lib/utils';
import type { CommentType, MediaType, PostType } from '@/types/global';
import Image from 'next/image';
import { AuthPromptDialog } from './auth-prompt-dialog';
import { PostMediaDialog } from './post-media-dialog';
import { useEffect, useState, type CSSProperties } from 'react';
import { FALLBACK_IMAGE } from '@/constants/constants';
import { Icon } from './ui/icons';
import { VideoPlayer } from './shared/video-player';

type UnlockOverlay = {
  priceLabel: string;
  lockedCount: number;
  compositionLabel?: string;
  isUnlocked?: boolean;
  onUnlock?: () => void;
};

export const PostMedia = ({
  media,
  content,
  unlockOverlay,
  embeddedInPostBody = false,
}: {
  media: MediaType[];
  content: PostType | CommentType;
  unlockOverlay?: UnlockOverlay;
  embeddedInPostBody?: boolean;
}) => {
  const FEED_VIDEO_ASPECT_RATIO = 9 / 16;
  const LOCKED_HERO_ASPECT_RATIO = 3 / 4;
  const { isAuthenticated } = useAuth();
  const { showExplicitContent } = useGlobal();

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [previewAspects, setPreviewAspects] = useState<Record<string, number>>(
    {}
  );
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const previewCount = media?.length ?? 0;
  const lockedCount = Math.max(0, unlockOverlay?.lockedCount ?? 0);
  const isBundleUnlocked = Boolean(unlockOverlay?.isUnlocked);
  // Canonical bundle mode for both locked and unlocked buyers.
  // Keeps one layout path and prevents old "legacy locked panel" regressions.
  const hasUnlockableBundle = Boolean(unlockOverlay && lockedCount > 0);
  const shouldShowLockedOverlay = Boolean(
    hasUnlockableBundle && !isBundleUnlocked && previewCount > 0
  );
  const effectiveLockedCount = shouldShowLockedOverlay ? 0 : lockedCount;
  const totalCount = previewCount + effectiveLockedCount;
  const displayCount = Math.min(totalCount, 4);
  const overflowCount = Math.max(0, totalCount - 4);

  useEffect(() => {
    if (previewCount <= 1) {
      setActivePreviewIndex(0);
      return;
    }
    setActivePreviewIndex((prev) => Math.min(prev, previewCount - 1));
  }, [previewCount]);

  if (totalCount === 0) {
    return null;
  }

  const MediaDialog = isAuthenticated ? PostMediaDialog : AuthPromptDialog;

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

    if (media[index]?.type === 'video') {
      return previewAspects[mediaUrl] || FEED_VIDEO_ASPECT_RATIO;
    }

    return previewAspects[mediaUrl] || 1;
  };

  const setPreviewAspect = (
    url: string,
    width: number,
    height: number,
    type: MediaType['type']
  ) => {
    if (!width || !height) return;
    const rawAspect = width / height;
    const normalizedVideoAspect =
      rawAspect > 1.2 ? height / width : rawAspect;
    const clampedAspect =
      type === 'video'
        ? Math.max(FEED_VIDEO_ASPECT_RATIO, Math.min(normalizedVideoAspect, 0.9))
        : Math.max(0.55, Math.min(rawAspect, 2.2));
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
      className={`relative overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,#190D1A_0%,#0C0A12_100%)] ${className}`}
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
                event.currentTarget.naturalHeight,
                item.type
              )
            }
          />
        </MediaDialog>
      ) : item.type === 'video' ? (
        <VideoPlayer
          src={item.url}
          fit="cover"
          className="h-full w-full rounded-none"
          caption={item.caption}
          onError={() =>
            setFailedImages((prev) => new Set([...prev, item.url]))
          }
        />
      ) : null}

      {item.type === 'video' && previewAspects[item.url] === undefined && (
        <video
          src={item.url}
          className="hidden"
          preload="metadata"
          onLoadedMetadata={(event) =>
            setPreviewAspect(
              item.url,
              event.currentTarget.videoWidth,
              event.currentTarget.videoHeight,
              item.type
            )
          }
        />
      )}

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
        <>
          {unlockOverlay?.compositionLabel && (
            <div className="absolute inset-x-2 bottom-9 rounded-md border border-[#2F3440] bg-[#0F1420]/90 px-2 py-1 text-center text-[10px] font-medium text-[#BFC8D9]">
              {unlockOverlay.compositionLabel}
            </div>
          )}
          <div className="absolute inset-x-2 bottom-2 rounded-md border border-[#2F3440] bg-[#141925]/95 px-2 py-1 text-center text-[11px] font-medium text-[#E6EAF2]">
            {unlockOverlay?.isUnlocked
              ? 'Open in DMs'
              : `Unlock ${unlockOverlay.priceLabel}`}
          </div>
        </>
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
      const slotType = media[slot]?.type;
      const minAspect =
        slotType === 'video'
          ? FEED_VIDEO_ASPECT_RATIO
          : displayCount <= 2
            ? 0.56
            : 0.85;
      const maxAspect = slotType === 'video' ? 0.9 : 1.85;
      return Math.max(minAspect, Math.min(getPreviewAspect(slot), maxAspect));
    }
    return fallback;
  };

  const primaryWideAspect = getSlotAspect(0, 1.45);
  const secondaryWideAspect = Math.max(1.15, Math.min(primaryWideAspect, 1.45));
  const singleLockedAspect =
    displayCount <= 2
      ? Math.max(0.75, Math.min(primaryWideAspect, 1.25))
      : Math.max(1.1, Math.min(primaryWideAspect, 1.55));

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

  const safeActivePreviewIndex =
    previewCount > 0 ? Math.min(activePreviewIndex, previewCount - 1) : -1;
  const activePreview =
    safeActivePreviewIndex >= 0 ? media[safeActivePreviewIndex] : null;
  const visiblePreviewPieces = Math.min(previewCount, 4);
  const visibleLockedPieces = Math.min(lockedCount, 4);
  const hiddenLockedPieces = Math.max(0, lockedCount - visibleLockedPieces);

  const renderFocusedPreview = () => {
    if (!activePreview) {
      return (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1A1221_0%,#0B111B_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_45%)]" />
        </div>
      );
    }

    if (activePreview.type === 'image') {
      return (
        <MediaDialog
          content={content}
          media={media}
          activeMediaIndex={safeActivePreviewIndex}
          activeMedia={activePreview}
        >
          <Image
            src={
              showExplicitContent
                ? getImageSrc(activePreview.url)
                : getBlurredImage(getImageSrc(activePreview.url))
            }
            alt={
              activePreview.caption ||
              `Post media ${safeActivePreviewIndex + 1}`
            }
            fill
            data-error={failedImages.has(activePreview.url)}
            className="object-cover duration-150 data-[error=true]:opacity-50"
            sizes="(max-width: 768px) 100vw, 680px"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            onError={() =>
              setFailedImages((prev) => new Set([...prev, activePreview.url]))
            }
            onLoad={(event) =>
              setPreviewAspect(
                activePreview.url,
                event.currentTarget.naturalWidth,
                event.currentTarget.naturalHeight,
                activePreview.type
              )
            }
          />
        </MediaDialog>
      );
    }

    return (
      <VideoPlayer
        src={activePreview.url}
        fit="cover"
        className="h-full w-full rounded-none"
        caption={activePreview.caption}
        onError={() =>
          setFailedImages((prev) => new Set([...prev, activePreview.url]))
        }
      />
    );
  };

  const renderPreviewPieceChip = (index: number) => {
    const item = media[index];
    if (!item) {
      return null;
    }
    const isActive = index === safeActivePreviewIndex;

    return (
      <button
        type="button"
        key={`preview-piece-${item._id ?? index}`}
        onClick={(event) => {
          event.stopPropagation();
          setActivePreviewIndex(index);
        }}
        className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border transition-colors ${
          isActive
            ? 'border-[#FF4DA6] bg-[#1A1223]'
            : 'border-white/20 bg-[#111926]/75'
        }`}
      >
        {item.type === 'image' ? (
          <Image
            src={
              showExplicitContent
                ? getImageSrc(item.url)
                : getBlurredImage(getImageSrc(item.url))
            }
            alt={item.caption || `Preview ${index + 1}`}
            fill
            className="object-cover"
            sizes="40px"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setFailedImages((prev) => new Set([...prev, item.url]))}
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#20152B_0%,#111926_100%)]" />
        )}

        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
            <Icon.videoIcon className="h-3.5 w-3.5" />
          </div>
        )}
      </button>
    );
  };

  if (hasUnlockableBundle) {
    return (
      <div
        className={`relative overflow-hidden bg-[linear-gradient(180deg,#140916_0%,#080A12_100%)] ${
          embeddedInPostBody ? '' : 'rounded-2xl border border-[#2A2233]'
        }`}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="relative aspect-[4/5] md:aspect-[3/4]"
          style={{
            aspectRatio: activePreview
              ? Math.max(
                  LOCKED_HERO_ASPECT_RATIO,
                  Math.min(getPreviewAspect(safeActivePreviewIndex), 0.92)
                )
              : LOCKED_HERO_ASPECT_RATIO,
          }}
        >
          {renderFocusedPreview()}

          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
              isBundleUnlocked
                ? 'from-[#04050A]/46 via-[#070912]/22 to-transparent'
                : 'from-[#04050A]/88 via-[#070912]/52 to-transparent'
            }`}
          />
        </div>
        <div className="space-y-2 border-t border-white/10 bg-[linear-gradient(180deg,rgba(12,15,24,0.9)_0%,rgba(9,12,19,0.95)_100%)] px-3 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {Array.from({ length: visiblePreviewPieces }, (_, index) =>
              renderPreviewPieceChip(index)
            )}
            {Array.from({ length: visibleLockedPieces }, (_, index) => (
              <button
                type="button"
                key={`locked-piece-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  unlockOverlay?.onUnlock?.();
                }}
                disabled={!unlockOverlay?.onUnlock}
                className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border text-white ${
                  isBundleUnlocked
                    ? 'border-[#3A4B69] bg-[linear-gradient(160deg,rgba(120,176,255,0.2),rgba(81,119,183,0.12))]'
                    : 'border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]'
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-[10px] ${
                    isBundleUnlocked ? 'bg-[#071426]/10' : 'bg-black/25'
                  }`}
                />
                {isBundleUnlocked ? (
                  <Icon.unlock className="relative h-3.5 w-3.5" />
                ) : (
                  <Icon.lock className="relative h-3.5 w-3.5" />
                )}
              </button>
            ))}
            {hiddenLockedPieces > 0 && (
              <div className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-[#111926]/80 px-2 text-xs font-semibold text-[#F1F5FF]">
                +{hiddenLockedPieces}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!unlockOverlay?.onUnlock}
            onClick={(event) => {
              event.stopPropagation();
              unlockOverlay?.onUnlock?.();
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm font-semibold transition-[filter] disabled:cursor-not-allowed disabled:opacity-70 ${
              isBundleUnlocked
                ? 'border-[#3A4B69] bg-[linear-gradient(90deg,rgba(21,34,57,0.95)_0%,rgba(29,45,72,0.95)_100%)] text-[#D8E8FF]'
                : 'border-[#FF4DA6]/70 bg-[linear-gradient(90deg,rgba(68,10,43,0.96)_0%,rgba(132,22,89,0.96)_100%)] text-[#FFE3F2] hover:brightness-110'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {isBundleUnlocked ? (
                <Icon.unlock className="h-3.5 w-3.5" />
              ) : (
                <Icon.lock className="h-3.5 w-3.5" />
              )}
              {isBundleUnlocked
                ? 'Open in messages'
                : `Unlock ${unlockOverlay?.priceLabel}`}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${embeddedInPostBody ? '' : 'rounded-2xl'}`}
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

      {shouldShowLockedOverlay && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#04050A]/80 via-[#070A14]/45 to-transparent" />

          <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-[#F4F7FF]">
            <span className="inline-flex items-center gap-1.5">
              <Icon.lock className="h-3.5 w-3.5 text-[#FF5AB3]" />
              {unlockOverlay?.compositionLabel || 'Locked content'}
            </span>
          </div>

          <div className="pointer-events-auto absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-[#0B1220]/88 px-3 py-2 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[#D6DEEF]">
              <span className="truncate">
                Unlock full drop
              </span>
              <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F3F6FF]">
                {unlockOverlay?.compositionLabel || `${lockedCount} items`}
              </span>
            </div>
            <button
              type="button"
              disabled={!unlockOverlay?.onUnlock}
              onClick={(event) => {
                event.stopPropagation();
                unlockOverlay?.onUnlock?.();
              }}
              className="w-full rounded-md border border-[#FF4DA6]/60 bg-[#FF007F]/18 px-3 py-1.5 text-sm font-semibold text-[#FFD5EA] transition-colors hover:bg-[#FF007F]/28 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Unlock {unlockOverlay?.priceLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
