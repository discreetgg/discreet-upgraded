'use client';

import { useGlobal } from '@/context/global-context-provider';
import {
  formatBundlePriceLabel,
  getMessageBundleSummary,
} from '@/lib/message-media-bundle';
import { cn, getBlurredImage, getProxiedMediaUrl } from '@/lib/utils';
import type { MessageType } from '@/types/global';
import { Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthenticatedMedia } from './authenticated-media';
import { MessageMediaDialog } from './message-media-dialog';
import { Icon } from './ui/icons';

const MAX_VISIBLE_CHIPS = 6;
const ORIGIN_SURFACE_LABELS = {
  feed: 'Feed',
  profile: 'Profile',
  menu: 'Menu',
  dm: 'DM',
  unknown: 'Unknown',
} as const;

const getVideoChipPosterUrl = (rawUrl?: string) => {
  const normalizedUrl = (rawUrl ?? '').trim();
  if (!normalizedUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (
      !parsedUrl.hostname.includes('res.cloudinary.com') ||
      !parsedUrl.pathname.includes('/video/upload/')
    ) {
      return '';
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = pathSegments.findIndex((segment) => segment === 'upload');
    if (uploadIndex === -1) {
      return '';
    }

    const versionIndex = pathSegments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
    );
    const publicIdSegments =
      versionIndex >= 0
        ? pathSegments.slice(versionIndex + 1)
        : pathSegments.slice(uploadIndex + 1);

    if (publicIdSegments.length === 0) {
      return '';
    }

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(
      /\.[^/.]+$/,
      '',
    );

    const basePrefix = pathSegments.slice(0, uploadIndex + 1).join('/');
    const versionPath = versionIndex >= 0 ? `/${pathSegments[versionIndex]}` : '';

    parsedUrl.pathname = `/${basePrefix}/so_0,w_120,h_120,c_fill,f_jpg,q_auto${versionPath}/${publicIdSegments.join('/')}.jpg`;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

interface MessageMediaBundleCardProps {
  message: MessageType;
  viewerDiscordId?: string;
  onUnlock?: () => void;
  isUnlocking?: boolean;
  onOpenInChat?: () => void;
  compact?: boolean;
  className?: string;
  overridePaid?: boolean;
}

export const MessageMediaBundleCard = ({
  message,
  viewerDiscordId,
  onUnlock,
  isUnlocking = false,
  onOpenInChat,
  compact = false,
  className,
  overridePaid,
}: MessageMediaBundleCardProps) => {
  const { showExplicitContent } = useGlobal();
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const summary = useMemo(
    () =>
      getMessageBundleSummary(message, viewerDiscordId, {
        overridePaid,
      }),
    [message, overridePaid, viewerDiscordId],
  );

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [message._id, summary.heroSlots.length, summary.lockedSlots.length]);

  if (summary.totalCount === 0 || summary.heroSlots.length === 0) {
    return null;
  }

  const maxHeroIndex = Math.max(0, summary.heroSlots.length - 1);
  const resolvedHeroIndex = Math.min(activeHeroIndex, maxHeroIndex);
  const activeHeroSlot = summary.heroSlots[resolvedHeroIndex];
  const activeHeroKey = activeHeroSlot.media._id || activeHeroSlot.media.url;

  const lockedMediaKeys = new Set(
    summary.lockedSlots.map((slot) => slot.media._id || slot.media.url),
  );
  const isActiveHeroLocked = lockedMediaKeys.has(activeHeroKey);
  const priceLabel = formatBundlePriceLabel(message.price);
  const titleText = (message.title || '').trim();
  const bodyText = (message.description || message.text || '').trim();

  const visiblePreviewCount = summary.isLockedForViewer
    ? Math.min(summary.previewSlots.length, 4)
    : Math.min(summary.previewSlots.length, MAX_VISIBLE_CHIPS);
  const visibleLockedCount = summary.isLockedForViewer
    ? Math.min(
        summary.lockedSlots.length,
        Math.max(0, MAX_VISIBLE_CHIPS - visiblePreviewCount),
      )
    : 0;
  const hiddenCount =
    summary.totalCount - visiblePreviewCount - visibleLockedCount;

  const canUnlock = summary.isLockedForViewer && Boolean(onUnlock);
  const compactStatusLabel = summary.isLockedForViewer
    ? 'Locked'
    : summary.isPayable && summary.isReceiver
      ? 'Unlocked'
      : 'Visible';
  const compactCompositionLabel = [
    summary.imageCount > 0 ? `${summary.imageCount} img` : '',
    summary.videoCount > 0 ? `${summary.videoCount} vid` : '',
  ]
    .filter(Boolean)
    .join(' • ');
  const originSurfaceLabel =
    ORIGIN_SURFACE_LABELS[summary.originSurface] ??
    ORIGIN_SURFACE_LABELS.unknown;
  const hasProvenance = Boolean(
    summary.originSurface !== 'unknown' ||
      summary.sourceLabel ||
      summary.sourcePostId,
  );
  const provenanceBadgeLabel = `From ${originSurfaceLabel}`;

  if (compact) {
    const compactPrimaryCta = summary.isLockedForViewer
      ? onUnlock
        ? {
            label: isUnlocking ? 'Unlocking...' : `Unlock ${priceLabel}`,
            onClick: onUnlock,
            disabled: !canUnlock || isUnlocking,
            className:
              'border-[#FF4DA6]/70 bg-[linear-gradient(90deg,rgba(68,10,43,0.96)_0%,rgba(132,22,89,0.96)_100%)] text-[#FFE3F2]',
          }
        : onOpenInChat
          ? {
              label: 'Open to unlock',
              onClick: onOpenInChat,
              disabled: false,
              className:
                'border-white/20 bg-black/35 text-white hover:bg-black/50',
            }
          : null
      : onOpenInChat
        ? {
            label: 'Open in chat',
            onClick: onOpenInChat,
            disabled: false,
            className:
              'border-white/20 bg-black/35 text-white hover:bg-black/50',
          }
        : null;

    return (
      <article
        className={cn(
          'overflow-hidden rounded-xl border border-[#252A38] bg-[linear-gradient(180deg,#140916_0%,#080A12_100%)]',
          className,
        )}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="relative aspect-square overflow-hidden">
          <MessageMediaDialog
            media={message.media || []}
            activeMediaIndex={activeHeroSlot.index}
            isMediaLocked={(mediaItem) =>
              lockedMediaKeys.has(mediaItem._id || mediaItem.url)
            }
          >
            <div className="relative h-full w-full bg-[linear-gradient(180deg,#1A1224_0%,#0C111A_100%)]">
              {isActiveHeroLocked ? (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#1B2436_0%,#0E1321_62%,#090C15_100%)]" />
              ) : activeHeroSlot.media.type === 'image' ? (
                <AuthenticatedMedia
                  type="image"
                  src={
                    showExplicitContent
                      ? getProxiedMediaUrl(
                          activeHeroSlot.media._id,
                          activeHeroSlot.media.url,
                        )
                      : getBlurredImage(
                          getProxiedMediaUrl(
                            activeHeroSlot.media._id,
                            activeHeroSlot.media.url,
                          ),
                        )
                  }
                  alt={activeHeroSlot.media.caption || 'Bundle preview'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 80vw, 260px"
                />
              ) : (
                <AuthenticatedMedia
                  type="video"
                  src={getProxiedMediaUrl(
                    activeHeroSlot.media._id,
                    activeHeroSlot.media.url,
                  )}
                  alt={activeHeroSlot.media.caption || 'Bundle video'}
                  className="h-full w-full object-cover"
                  videoProps={{
                    muted: true,
                    playsInline: true,
                    preload: 'metadata',
                  }}
                />
              )}
              {activeHeroSlot.media.type === 'video' && !isActiveHeroLocked && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/55 p-2 text-white">
                    <Play className="size-5 fill-current" />
                  </div>
                </div>
              )}
              {isActiveHeroLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded-full border border-white/25 bg-black/45 p-2 text-white">
                    <Icon.lock className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </MessageMediaDialog>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04050A]/85 via-[#070912]/35 to-transparent" />
          <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] text-white">
            {summary.isLockedForViewer ? (
              <Icon.lock className="h-3 w-3" />
            ) : (
              <Icon.unlock className="h-3 w-3" />
            )}
            <span>{compactCompositionLabel || summary.compositionLabel}</span>
          </div>
          <div
            className={cn(
              'pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px]',
              summary.isLockedForViewer
                ? 'border-white/20 bg-black/55 text-white'
                : 'border-[#3A4B69] bg-[#132038]/90 text-[#D8E8FF]',
            )}
          >
            {compactStatusLabel}
          </div>
          {hasProvenance && (
            <div className="pointer-events-none absolute left-2 top-9 inline-flex items-center gap-1 rounded-full border border-[#2C3B58] bg-[#0A1222]/80 px-2 py-1 text-[10px] text-[#C9DAFF]">
              <Icon.unlock className="h-3 w-3" />
              <span>{provenanceBadgeLabel}</span>
            </div>
          )}
          {(titleText || bodyText) && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md border border-white/15 bg-black/45 px-2 py-1.5 backdrop-blur-sm">
              <p
                className="truncate text-[12px] font-semibold text-[#F4F7FF]"
                title={titleText || bodyText}
              >
                {titleText || bodyText}
              </p>
            </div>
          )}
        </div>

        {compactPrimaryCta && (
          <div className="border-t border-white/10 px-2.5 py-2">
            <button
              type="button"
              onClick={compactPrimaryCta.onClick}
              disabled={compactPrimaryCta.disabled}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70',
                compactPrimaryCta.className,
              )}
            >
              {compactPrimaryCta.label}
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[#2A2233] bg-[linear-gradient(180deg,#140916_0%,#080A12_100%)]',
        compact && 'rounded-xl border-[#252A38]',
        className,
      )}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className={cn('relative overflow-hidden', compact ? 'aspect-[4/5]' : 'aspect-[4/5] md:aspect-[3/4]')}>
        <MessageMediaDialog
          media={message.media || []}
          activeMediaIndex={activeHeroSlot.index}
          isMediaLocked={(mediaItem) =>
            lockedMediaKeys.has(mediaItem._id || mediaItem.url)
          }
        >
          <div className="relative h-full w-full bg-[linear-gradient(180deg,#1A1224_0%,#0C111A_100%)]">
            {isActiveHeroLocked ? (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#1B2436_0%,#0E1321_62%,#090C15_100%)]" />
            ) : activeHeroSlot.media.type === 'image' ? (
              <AuthenticatedMedia
                type="image"
                src={
                  showExplicitContent
                    ? getProxiedMediaUrl(
                        activeHeroSlot.media._id,
                        activeHeroSlot.media.url,
                      )
                    : getBlurredImage(
                        getProxiedMediaUrl(
                          activeHeroSlot.media._id,
                          activeHeroSlot.media.url,
                        ),
                      )
                }
                alt={activeHeroSlot.media.caption || 'Bundle preview'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 560px"
              />
            ) : (
              <AuthenticatedMedia
                type="video"
                src={getProxiedMediaUrl(
                  activeHeroSlot.media._id,
                  activeHeroSlot.media.url,
                )}
                alt={activeHeroSlot.media.caption || 'Bundle video'}
                className="h-full w-full object-cover"
                videoProps={{
                  muted: true,
                  playsInline: true,
                  preload: 'metadata',
                }}
              />
            )}
            {activeHeroSlot.media.type === 'video' && !isActiveHeroLocked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/55 p-3 text-white">
                  <Play className="size-7 fill-current" />
                </div>
              </div>
            )}
            {isActiveHeroLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="rounded-full border border-white/25 bg-black/45 p-3 text-white">
                  <Icon.lock className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>
        </MessageMediaDialog>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04050A]/88 via-[#070912]/45 to-transparent" />
        <div className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] text-white">
          {summary.isLockedForViewer ? <Icon.lock className="h-3 w-3" /> : <Icon.unlock className="h-3 w-3" />}
          <span>{summary.compositionLabel}</span>
        </div>
        {hasProvenance && (
          <div className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-[#2C3B58] bg-[#0A1222]/85 px-2 py-1 text-[10px] text-[#C9DAFF]">
            <Icon.unlock className="h-3 w-3" />
            <span>{provenanceBadgeLabel}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-white/10 bg-[linear-gradient(180deg,rgba(12,15,24,0.9)_0%,rgba(9,12,19,0.95)_100%)] px-3 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {summary.previewSlots.slice(0, visiblePreviewCount).map((slot, index) => (
            <button
              type="button"
              key={`preview-chip-${slot.media._id || slot.media.url}-${index}`}
              onClick={() => {
                const heroIndex = summary.heroSlots.findIndex(
                  (heroSlot) =>
                    (heroSlot.media._id || heroSlot.media.url) ===
                    (slot.media._id || slot.media.url),
                );
                if (heroIndex >= 0) {
                  setActiveHeroIndex(heroIndex);
                }
              }}
              className={cn(
                'relative h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border',
                (slot.media._id || slot.media.url) === activeHeroKey
                  ? 'border-[#FF4DA6] bg-[#1A1223]'
                  : 'border-white/20 bg-[#111926]/75',
              )}
            >
              {slot.media.type === 'image' ? (
                <AuthenticatedMedia
                  type="image"
                  src={
                    showExplicitContent
                      ? getProxiedMediaUrl(slot.media._id, slot.media.url)
                      : getBlurredImage(
                          getProxiedMediaUrl(slot.media._id, slot.media.url),
                        )
                  }
                  alt={slot.media.caption || `Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <>
                  {(() => {
                    const videoSrc = getProxiedMediaUrl(
                      slot.media._id,
                      slot.media.url,
                    );
                    const posterSrc = getVideoChipPosterUrl(videoSrc);

                    if (posterSrc) {
                      return (
                        <AuthenticatedMedia
                          type="image"
                          src={posterSrc}
                          alt={slot.media.caption || `Video preview ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      );
                    }

                    return (
                      <div className="absolute inset-0 bg-[linear-gradient(160deg,#20152B_0%,#111926_100%)]" />
                    );
                  })()}
                  <div className="absolute inset-0 flex items-end justify-end p-1">
                    <span className="inline-flex items-center justify-center rounded-md bg-black/55 p-[3px] text-white">
                      <Icon.videoIcon className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </>
              )}
            </button>
          ))}

          {summary.isLockedForViewer &&
            Array.from({ length: visibleLockedCount }, (_, index) => (
              <div
                key={`locked-chip-${message._id}-${index}`}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] text-white"
              >
                <div className="absolute inset-0 rounded-[10px] bg-black/25" />
                <Icon.lock className="relative h-3.5 w-3.5" />
              </div>
            ))}

          {hiddenCount > 0 && (
            <div className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-[#111926]/80 px-2 text-xs font-semibold text-[#F1F5FF]">
              +{hiddenCount}
            </div>
          )}
        </div>

        {summary.isLockedForViewer && onUnlock ? (
          <button
            type="button"
            onClick={onUnlock}
            disabled={!canUnlock || isUnlocking}
            className={cn(
              'w-full rounded-md border border-[#FF4DA6]/70 bg-[linear-gradient(90deg,rgba(68,10,43,0.96)_0%,rgba(132,22,89,0.96)_100%)] px-3 py-2 text-sm font-semibold text-[#FFE3F2] transition-[filter] disabled:cursor-not-allowed disabled:opacity-70',
              canUnlock && !isUnlocking && 'hover:brightness-110',
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Icon.lock className="h-3.5 w-3.5" />
              {isUnlocking ? 'Unlocking...' : `Unlock ${priceLabel}`}
            </span>
          </button>
        ) : summary.isLockedForViewer ? (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-black/35 px-3 py-2 text-sm font-semibold text-[#D4DBE8]">
            <Icon.lock className="h-3.5 w-3.5" />
            Locked bundle
          </div>
        ) : (
          summary.isPayable &&
          summary.isReceiver && (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#3A4B69] bg-[linear-gradient(90deg,rgba(21,34,57,0.95)_0%,rgba(29,45,72,0.95)_100%)] px-3 py-2 text-sm font-semibold text-[#D8E8FF]">
              <Icon.unlock className="h-3.5 w-3.5" />
              Unlocked
            </div>
          )
        )}

        {onOpenInChat && (
          <button
            type="button"
            onClick={onOpenInChat}
            className="w-full rounded-md border border-white/20 bg-black/35 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-black/50"
          >
            Open in chat
          </button>
        )}

        {(titleText || bodyText) && (
          <div className="rounded-lg border border-[#2C3342] bg-[#0E1422]/75 px-3 py-2">
            {titleText && (
              <p
                className={cn(
                  'font-semibold text-[#E8EDF8]',
                  compact ? 'truncate text-[12px]' : 'text-sm',
                )}
                title={titleText}
              >
                {titleText}
              </p>
            )}
            {bodyText && (
              <p
                className={cn(
                  'text-[#C5CEDF]',
                  compact ? 'truncate text-[11px]' : 'mt-1 text-xs leading-5',
                )}
                title={compact ? bodyText : undefined}
              >
                {bodyText}
              </p>
            )}
            {hasProvenance && (
              <p className="mt-1 text-[11px] text-[#9FB4DA]">
                Source: {originSurfaceLabel}
                {summary.sourceLabel ? ` • ${summary.sourceLabel}` : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
