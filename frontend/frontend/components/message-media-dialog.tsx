'use client';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import type { MediaType } from '@/types/global';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthenticatedMedia } from './authenticated-media';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Icon } from './ui/icons';
import { FullScreenModal } from './ui/full-screen-modal';

export const MessageMediaDialog = ({
  children,
  media,
  activeMediaIndex = 0,
  isMediaLocked,
}: {
  children?: React.ReactNode;
  media: MediaType[];
  activeMedia?: MediaType;
  activeMediaIndex?: number;
  isMediaLocked?: (media: MediaType, index: number) => boolean;
}) => {
  // Sort media by createdAt (newest first) to prioritize incoming media
  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.uploadedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.uploadedAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [media]);

  // Find the index of the active media in the sorted array
  const findSortedIndex = useMemo(() => {
    return (originalIndex: number) => {
      if (originalIndex < 0 || originalIndex >= media.length) return 0;
      const originalMedia = media[originalIndex];
      const sortedIndex = sortedMedia.findIndex(
        (m) => m._id === originalMedia._id
      );
      return sortedIndex >= 0 ? sortedIndex : 0;
    };
  }, [media, sortedMedia]);

  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() =>
    findSortedIndex(activeMediaIndex)
  );
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const pauseModalVideos = useCallback(() => {
    const videos = modalContentRef.current?.querySelectorAll('video');
    if (!videos?.length) {
      return;
    }

    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        pauseModalVideos();
      }
      setOpen(nextOpen);
    },
    [pauseModalVideos]
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide controls on mobile after 3 seconds
  useEffect(() => {
    if (!open || !isMobile) {
      return;
    }

    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Set new timeout if controls are shown
    if (showControls) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [open, isMobile, showControls]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        pauseModalVideos();
        setCurrentIndex((prev) => (prev + 1) % sortedMedia.length);
      } else if (e.key === 'ArrowLeft') {
        pauseModalVideos();
        setCurrentIndex(
          (prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, sortedMedia.length, pauseModalVideos]);

  // Reset controls visibility when dialog opens
  useEffect(() => {
    if (open) {
      setShowControls(true);
    }
  }, [open]);

  // Re-show controls after media changes so close/navigation remains reachable
  useEffect(() => {
    if (open) {
      setShowControls(true);
    }
  }, [open, currentIndex]);

  // Update current index when activeMediaIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(findSortedIndex(activeMediaIndex));
    }
  }, [open, activeMediaIndex, findSortedIndex]);

  const current = sortedMedia[currentIndex];
  const isLocked =
    current && isMediaLocked ? isMediaLocked(current, currentIndex) : false;

  // Safety check: if no media, don't render
  if (!current || sortedMedia.length === 0) {
    return <>{children}</>;
  }

  // Toggle controls on mobile tap
  const handleImageTap = () => {
    if (isMobile && !isLocked) {
      setShowControls((prev) => !prev);
    }
  };

  return (
    <>
      <div
        onClick={() => {
          setCurrentIndex(findSortedIndex(activeMediaIndex));
          handleOpenChange(true);
        }}
        className="cursor-pointer"
      >
        {children}
      </div>

      <FullScreenModal
        open={open}
        onOpenChange={handleOpenChange}
        showCloseButton
      >
        <div
          ref={modalContentRef}
          className="flex items-center justify-center h-full w-full"
          onClick={(e) => {
            // Close when clicking the wrapper (outside the image)
            if (e.target === e.currentTarget) {
              handleOpenChange(false);
            }
          }}
        >
          {current.type === 'image' ? (
            <div
              className="relative w-full h-full flex items-center justify-center"
              onClick={handleImageTap}
            >
              <AuthenticatedMedia
                type="image"
                src={getProxiedMediaUrl(current._id, current.url)}
                alt={current.caption || 'Post image'}
                width={1920}
                height={1080}
                className={cn(
                  'object-contain w-full h-full max-w-full max-h-full',
                  isLocked && 'blur-xl'
                )}
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex flex-col items-center gap-2">
                    <Icon.lock className="w-12 h-12 text-white/80" />
                    <span className="text-white/80 text-base font-medium">
                      Locked Content
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : current.type === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <AuthenticatedMedia
                type="video"
                src={getProxiedMediaUrl(current._id, current.url)}
                alt={current.caption || 'Post video'}
                className={cn(
                  'h-full w-full max-h-full max-w-full object-contain',
                  isLocked && 'blur-xl'
                )}
                videoProps={{
                  controls: !isLocked ? true : false,
                  autoPlay: !isLocked ? true : false,
                  playsInline: true,
                  preload: 'metadata',
                }}
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex flex-col items-center gap-2">
                    <Icon.lock className="w-12 h-12 text-white/80" />
                    <span className="text-white/80 text-base font-medium">
                      Locked Content
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Navigation arrows - hidden when showControls is false on mobile */}
        {sortedMedia.length > 1 && (!isMobile || showControls) && (
          <>
            <button
              type="button"
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl z-40 transition-opacity duration-300 bg-black/30 hover:bg-black/50 rounded-full p-2',
                isMobile && !showControls && 'opacity-0 pointer-events-none'
              )}
              onClick={() => {
                pauseModalVideos();
                setCurrentIndex(
                  (prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length
                );
              }}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl z-40 transition-opacity duration-300 bg-black/30 hover:bg-black/50 rounded-full p-2',
                isMobile && !showControls && 'opacity-0 pointer-events-none'
              )}
              onClick={() => {
                pauseModalVideos();
                setCurrentIndex((prev) => (prev + 1) % sortedMedia.length);
              }}
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* Image counter indicator - hidden when showControls is false on mobile */}
        {sortedMedia.length > 1 && (!isMobile || showControls) && (
          <div
            className={cn(
              'absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm transition-opacity duration-300',
              isMobile && !showControls && 'opacity-0'
            )}
          >
            {currentIndex + 1} / {sortedMedia.length}
          </div>
        )}
      </FullScreenModal>
    </>
  );
};
