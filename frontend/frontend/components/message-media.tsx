import { FALLBACK_IMAGE } from '@/constants/constants';
import { useGlobal } from '@/context/global-context-provider';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import type { MediaType } from '@/types/global';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { AuthenticatedMedia } from './authenticated-media';
import { MessageMediaDialog } from './message-media-dialog';
import { ComponentLoader } from './ui/component-loader';

interface MessageMediaProps {
  media: MediaType[];
  isLoading?: boolean;
}

interface MessageMediaTileProps {
  item: MediaType;
  index: number;
  media: MediaType[];
  isLoading: boolean;
  showExplicitContent: boolean;
  mediaCacheKey: string;
  mediaAspect?: number;
  resolveImageSrc: (source: string) => string;
  onImageError: (source: string) => void;
  onVideoAspect: (cacheKey: string, width: number, height: number) => void;
}

const EAGER_MEDIA_ITEMS = 1;
const DM_VIDEO_ASPECT_RATIO = 9 / 16;

const MessageMediaTile = ({
  item,
  index,
  media,
  isLoading,
  showExplicitContent,
  mediaCacheKey,
  mediaAspect,
  resolveImageSrc,
  onImageError,
  onVideoAspect,
}: MessageMediaTileProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(index < EAGER_MEDIA_ITEMS);
  const proxiedSrc = getProxiedMediaUrl(item._id, item.url);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const node = itemRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '700px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <motion.div
      ref={itemRef}
      className={cn(
        'relative w-full aspect-[16/9] overflow-hidden',
        media.length > 1 && 'aspect-square',
      )}
      style={
        media.length === 1 && mediaAspect
          ? { aspectRatio: mediaAspect }
          : undefined
      }
    >
      {!shouldLoad ? (
        <div className="absolute inset-0 bg-[#1A1C1F] animate-pulse" />
      ) : (
        <>
          {item.type === 'image' ? (
            <>
              <MessageMediaDialog
                media={media}
                activeMediaIndex={index}
                activeMedia={item}
              >
                <AuthenticatedMedia
                  type="image"
                  src={resolveImageSrc(proxiedSrc)}
                  alt={item.caption || `Post media ${index + 1}`}
                  fill
                  loading="lazy"
                  className={cn(
                    'object-cover hover:scale-105 duration-150',
                    !showExplicitContent && 'blur-2xl scale-110 brightness-50',
                  )}
                  sizes="(max-width: 768px) 100vw, 700px"
                  onMediaError={() => onImageError(proxiedSrc)}
                  onLoad={(result) => {
                    if (result.currentTarget.width === 0) {
                      onImageError(proxiedSrc);
                    }
                  }}
                />
              </MessageMediaDialog>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <ComponentLoader />
                </div>
              )}
            </>
          ) : item.type === 'video' ? (
            <>
              <MessageMediaDialog
                media={media}
                activeMediaIndex={index}
                activeMedia={item}
              >
                <div className="relative h-full w-full cursor-zoom-in bg-[linear-gradient(180deg,#190D1A_0%,#0C0A12_100%)]">
                  <AuthenticatedMedia
                    type="video"
                    src={proxiedSrc}
                    alt={item.caption || 'Video'}
                    className="w-full h-full object-cover"
                    videoProps={{
                      muted: true,
                      playsInline: true,
                      preload: 'none',
                      onLoadedMetadata: (event) => {
                        const videoElement = event.currentTarget as HTMLVideoElement;
                        if (!videoElement.videoWidth || !videoElement.videoHeight) {
                          onImageError(proxiedSrc);
                          return;
                        }
                        onVideoAspect(
                          mediaCacheKey,
                          videoElement.videoWidth,
                          videoElement.videoHeight,
                        );
                      },
                    }}
                    onMediaError={() => onImageError(proxiedSrc)}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/60 p-3 text-white">
                      <Play className="size-6 fill-current" />
                    </div>
                  </div>
                </div>
              </MessageMediaDialog>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <ComponentLoader />
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </motion.div>
  );
};

export const MessageMedia = ({ media, isLoading = false }: MessageMediaProps) => {
  const { showExplicitContent } = useGlobal();

  if (!media || media.length === 0) {
    return null;
  }

  const gridClasses = (() => {
    if (media.length === 1) {
      return 'grid-cols-1';
    }
    if (media.length === 2) {
      return 'grid-cols-2';
    }
    return 'grid-cols-2 md:grid-cols-2';
  })();

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [mediaAspects, setMediaAspects] = useState<Record<string, number>>({});

  const handleImageError = (source: string) => {
    setFailedImages((previous) => new Set([...previous, source]));
  };

  const setAspectFor = (cacheKey: string, width: number, height: number) => {
    if (!width || !height) return;

    const rawAspect = width / height;
    const normalizedVideoAspect =
      rawAspect > 1.2 ? height / width : rawAspect;
    const clampedAspect = Math.max(
      DM_VIDEO_ASPECT_RATIO,
      Math.min(normalizedVideoAspect, 0.9)
    );
    setMediaAspects((previous) => ({ ...previous, [cacheKey]: clampedAspect }));
  };

  const resolveImageSrc = (source: string) => {
    return failedImages.has(source) ? FALLBACK_IMAGE : source;
  };

  return (
    <div className="rounded-2xl overflow-hidden">
      <div className={cn('grid gap-1', gridClasses)}>
        {media.map((item, index) => {
          const mediaCacheKey = item._id ?? item.url ?? `media-${index}`;
          const mediaKey = `${mediaCacheKey}-${index}`;
          return (
            <MessageMediaTile
              key={mediaKey}
              item={item}
              index={index}
              media={media}
              isLoading={isLoading}
              showExplicitContent={Boolean(showExplicitContent)}
              mediaCacheKey={mediaCacheKey}
              mediaAspect={
                media.length === 1
                  ? item.type === 'video'
                    ? mediaAspects[mediaCacheKey] ?? DM_VIDEO_ASPECT_RATIO
                    : mediaAspects[mediaCacheKey]
                  : undefined
              }
              resolveImageSrc={resolveImageSrc}
              onImageError={handleImageError}
              onVideoAspect={setAspectFor}
            />
          );
        })}
      </div>
    </div>
  );
};
