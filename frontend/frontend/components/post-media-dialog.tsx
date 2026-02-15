'use client';

import { FALLBACK_IMAGE } from '@/constants/constants';
import { useGlobal } from '@/context/global-context-provider';
import { cn, getBlurredImage } from '@/lib/utils';
import type { CommentType, MediaType, PostType } from '@/types/global';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from './shared/video-player';
import { FullScreenModal } from './ui/full-screen-modal';

export const PostMediaDialog = ({
  children,
  media,
  activeMediaIndex = 0,
}: {
  children?: React.ReactNode;
  media: MediaType[];
  content: PostType | CommentType; // Note: This prop is defined but unused in code; keep for potential future use
  activeMedia?: MediaType; // Unused; consider removing if not needed
  activeMediaIndex?: number;
}) => {
  const { showExplicitContent } = useGlobal();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(activeMediaIndex);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Mobile detection and UI controls
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (!open) return;

    // Keyboard nav for carousel
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, media.length]);

  // Reset controls visibility when dialog opens
  useEffect(() => {
    if (open) {
      setShowControls(true);
    }
  }, [open]);

  const handleImageError = (src: string) => {
    setFailedImages((prev) => new Set([...prev, src]));
  };

  const getImageSrc = (originalSrc: string) => {
    return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
  };

  const current = media[currentIndex];

  // Toggle controls on mobile tap
  const handleImageTap = () => {
    if (isMobile) {
      setShowControls((prev) => !prev);
    }
  };

  return (
    <>
      <div
        onClick={() => {
          setCurrentIndex(activeMediaIndex);
          setOpen(true);
        }}
        className="relative block size-full cursor-pointer"
      >
        {children}
      </div>

      <FullScreenModal
        open={open}
        onOpenChange={setOpen}
        showCloseButton={!isMobile || showControls}
      >
        <div
          className="flex items-center justify-center h-full w-full relative"
          onMouseEnter={() => !isMobile && setShowControls(true)} // Show controls on hover (desktop only)
          onMouseLeave={() => !isMobile && setShowControls(false)} // Hide after hover (desktop only)
          onContextMenu={(e) => e.preventDefault()}
          onClick={(e) => {
            // Close when clicking the wrapper (outside the image)
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          {current.type === 'image' ? (
            <div
              className="relative w-full h-full flex items-center justify-center"
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleImageTap}
            >
              <Image
                src={
                  showExplicitContent
                    ? getImageSrc(current.url)
                    : getBlurredImage(getImageSrc(current.url))
                }
                alt={current.caption || 'Post image'}
                width={1200}
                height={1600}
                data-error={failedImages.has(current.url)}
                className={cn(
                  'object-contain w-full h-full max-w-full max-h-full',
                  'data-[error=true]:opacity-50'
                )}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
                onError={() => handleImageError(current.url)}
                onLoad={(result) => {
                  if (result.currentTarget.width === 0) {
                    handleImageError(current.url);
                  }
                }}
              />
            </div>
          ) : current.type === 'video' ? (
            <div className="relative h-full w-full px-2 md:px-8">
              <VideoPlayer
                src={current.url}
                fit="contain"
                className="h-full w-full max-h-[92vh] rounded-xl"
                caption="English captions"
                onError={() => handleImageError(current.url)}
              />
            </div>
          ) : null}
          {failedImages.has(current.url) && (
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full text-accent-gray px-3 py-1 text-2xl font-bold w-full uppercase text-center">
              unable to load {current.type}
            </div>
          )}
        </div>

        {/* Navigation arrows - hidden when showControls is false on mobile */}
        {media.length > 1 && (!isMobile || showControls) && (
          <>
            <button
              type="button"
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl z-40 transition-opacity duration-300 bg-black/30 hover:bg-black/50 rounded-full p-2',
                isMobile && !showControls && 'opacity-0 pointer-events-none'
              )}
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + media.length) % media.length
                )
              }
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl z-40 transition-opacity duration-300 bg-black/30 hover:bg-black/50 rounded-full p-2',
                isMobile && !showControls && 'opacity-0 pointer-events-none'
              )}
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % media.length)
              }
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* Image counter indicator - hidden when showControls is false on mobile */}
        {media.length > 1 && (!isMobile || showControls) && (
          <div
            className={cn(
              'absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm transition-opacity duration-300',
              isMobile && !showControls && 'opacity-0'
            )}
          >
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </FullScreenModal>
    </>
  );
};
