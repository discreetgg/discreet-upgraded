'use client';

import { FALLBACK_IMAGE } from '@/constants/constants';
import { useGlobal } from '@/context/global-context-provider';
import { cn, getBlurredImage } from '@/lib/utils';
import type { CommentType, MediaType, PostType } from '@/types/global';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
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

  // Video-specific states for modern UI
  const videoRef = useRef<HTMLVideoElement>(null); // Ref to control video element
  const [isPlaying, setIsPlaying] = useState(false); // Track play/pause
  const [currentTime, setCurrentTime] = useState(0); // Current playback time
  const [duration, setDuration] = useState(0); // Total video duration
  const [volume, setVolume] = useState(1); // Volume level (0-1)
  const [isMuted, setIsMuted] = useState(false); // Mute toggle
  const [isFullscreen, setIsFullscreen] = useState(false); // Fullscreen state

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

  // Reset video states when switching media
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1);
    setIsMuted(false);
    if (videoRef.current) {
      videoRef.current.pause(); // Ensure previous video stops
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  const handleImageError = (src: string) => {
    setFailedImages((prev) => new Set([...prev, src]));
  };

  const getImageSrc = (originalSrc: string) => {
    return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
  };

  // Video control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      setVolume(newMuted ? 0 : 1); // Reset to full if unmuting
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time for display (e.g., 1:23 / 4:56)
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        className="cursor-pointer"
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
            <>
              <video
                ref={videoRef}
                src={current.url}
                // Removed native controls; we're custom now
                // autoPlay={false} // Disabled autoplay for better UX; user initiates
                onError={() => handleImageError(current.url)}
                className="max-w-full max-h-full w-auto h-auto"
                onTimeUpdate={() =>
                  setCurrentTime(videoRef.current?.currentTime || 0)
                } // Sync current time
                onLoadedMetadata={() => {
                  setDuration(videoRef.current?.duration || 0); // Set duration once loaded
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={() => setVolume(videoRef.current?.volume || 1)}
              >
                <track
                  kind="captions"
                  src=""
                  srcLang="en"
                  label="English captions"
                  default
                />
              </video>
              {/* Custom Controls Overlay - Modern, fade-in on hover */}
              {showControls && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 flex items-center justify-between transition-opacity duration-300">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="text-white hover:text-gray-300"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  {/* Seek Bar */}
                  <div className="flex-1 mx-4">
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full accent-white" // Tailwind for modern slider
                      aria-label="Seek video"
                    />
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      className="text-white hover:text-gray-300 mr-2"
                    >
                      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-white"
                      aria-label="Volume"
                    />
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    className="text-white hover:text-gray-300 ml-4"
                  >
                    {isFullscreen ? (
                      <Minimize size={24} />
                    ) : (
                      <Maximize size={24} />
                    )}
                  </button>
                </div>
              )}
            </>
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
