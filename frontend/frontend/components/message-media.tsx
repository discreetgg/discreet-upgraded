import { useGlobal } from '@/context/global-context-provider';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import type { MediaType } from '@/types/global';
import { motion } from 'motion/react';
import { AuthenticatedMedia } from './authenticated-media';
import { MessageMediaDialog } from './message-media-dialog';
import { useState } from 'react';
import { FALLBACK_IMAGE } from '@/constants/constants';
import { ComponentLoader } from './ui/component-loader';

interface MessageMediaProps {
  media: MediaType[];
  isLoading?: boolean;
}

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
    return 'grid-cols-2 md:grid-cols-2'; // Twitter uses 2x2 for 3+ images
  })();

  const getBlurredImage = (url: string, amount = 1000) => {
    return url.replace('/upload/', `/upload/e_blur:${amount}/`);
  };

  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const handleImageError = (src: string) => {
    setFailedImages((prev) => new Set([...prev, src]));
  };

  // Store aspect ratios for media (keyed by url) so we can size the container
  const [mediaAspects, setMediaAspects] = useState<Record<string, number>>({});
  const setAspectFor = (url: string, width: number, height: number) => {
    if (!width || !height) return;
    const raw = width / height;
    // Clamp to reasonable bounds to avoid extreme tall/wide containers
    const aspect = Math.max(0.25, Math.min(raw, 4));
    setMediaAspects((prev) => ({ ...prev, [url]: aspect }));
  };

  const getImageSrc = (originalSrc: string) => {
    return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
  };

  return (
    <div className="rounded-2xl overflow-hidden">
      <div className={cn('grid gap-1', gridClasses)}>
        {media.map((item, index) => (
          <motion.div
            key={item._id ?? index}
            className={cn(
              'relative w-full aspect-[16/9] !overflow-hidden ',
              media.length > 1 && 'aspect-square'
            )}
            style={
              // If we have a computed aspect for this media and it's a single item, use it
              media.length === 1 && mediaAspects[item.url]
                ? { aspectRatio: mediaAspects[item.url] }
                : undefined
            }
          >
            {item.type === 'image' ? (
              <>
                <MessageMediaDialog
                  key={item._id ?? index}
                  media={media}
                  activeMediaIndex={index}
                  activeMedia={item}
                >
                  <AuthenticatedMedia
                    type="image"
                    src={getProxiedMediaUrl(item._id, item.url)}
                    alt={item.caption || `Post media ${index + 1}`}
                    fill
                    className={cn(
                      'object-cover hover:scale-105 duration-150',
                      !showExplicitContent && 'blur-2xl scale-110 brightness-50'
                    )}
                    sizes="(max-width: 768px) 100vw, 700px"
                    onMediaError={() =>
                      handleImageError(getProxiedMediaUrl(item._id, item.url))
                    }
                    onLoad={(result) => {
                      if (result.currentTarget.width === 0) {
                        handleImageError(getProxiedMediaUrl(item._id, item.url));
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
                <AuthenticatedMedia
                  type="video"
                  src={getProxiedMediaUrl(item._id, item.url)}
                  alt={item.caption || 'Video'}
                  className="w-full h-full object-contain"
                  videoProps={{
                    controls: true,
                    style: { objectPosition: 'center' },
                    preload: "metadata",
                    onLoadedMetadata: (e) => {
                      const el = e.currentTarget as HTMLVideoElement;
                      if (!el.videoWidth || !el.videoHeight) {
                        handleImageError(getProxiedMediaUrl(item._id, item.url));
                        return;
                      }
                      setAspectFor(item.url, el.videoWidth, el.videoHeight);
                    }
                  }}
                  onMediaError={() =>
                    handleImageError(getProxiedMediaUrl(item._id, item.url))
                  }
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                    <ComponentLoader />
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
