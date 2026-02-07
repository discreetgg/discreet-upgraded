'use client';

import { cn } from '@/lib/utils';
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion as m } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface VideoPlayProps {
  src: string;
  className?: string;
  onError?: () => void;
  caption?: string;
}

export const VideoPlayer = ({
  src,
  className = '',
  onError,
  caption,
}: VideoPlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const progressFilledRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isVertical, setIsVertical] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const rafIdRef = useRef<number | null>(null);

  // Reset states on src change (e.g., when reused with new video)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1);
    setIsMuted(false);
    setIsLoading(true); // Reset loading on src change
    setIsVertical(false); // Reset orientation

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [src]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current && duration > 0 && !isDragging) {
        const progress = (videoRef.current.currentTime / duration) * 100;
        setProgressPercent(progress); // Persist to React state
        if (progressFilledRef.current) {
          progressFilledRef.current.style.width = `${progress}%`;
        }
      }
      rafIdRef.current = requestAnimationFrame(updateProgress);
    };

    if (isPlaying && duration > 0) {
      updateProgress();
    } else if (videoRef.current && duration > 0) {
      const progress = (videoRef.current.currentTime / duration) * 100;
      setProgressPercent(progress);
      if (progressFilledRef.current) {
        progressFilledRef.current.style.width = `${progress}%`;
      }
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, duration, isDragging]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && progressContainerRef.current && videoRef.current) {
        const rect = progressContainerRef.current.getBoundingClientRect();
        const offsetX = Math.max(
          0,
          Math.min(e.clientX - rect.left, rect.width)
        ); // Clamp to bounds
        const time = (offsetX / rect.width) * duration;
        videoRef.current.currentTime = time;
        setCurrentTime(time); // Update state for time text
        if (progressFilledRef.current) {
          progressFilledRef.current.style.width = `${(time / duration) * 100}%`; // Immediate update
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  // Control functions - the "shadow techniques" of playback
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => onError?.()); // Handle play errors (e.g., user gesture required)
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressContainerRef.current && videoRef.current) {
      const rect = progressContainerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const time = (offsetX / rect.width) * duration;
      videoRef.current.currentTime = time;
      setCurrentTime(time); // Sync state for time text
      if (progressFilledRef.current) {
        progressFilledRef.current.style.width = `${(time / duration) * 100}%`; // Immediate sync
      }
    }
  };

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      setVolume(newMuted ? 0 : 1);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const computedVideoClass = useMemo(
    () =>
      cn(
        'mx-auto rounded-lg object-contain w-auto',
        isVertical ? 'max-h-[600px]' : 'max-h-[90vh]',
        className
      ),
    [isVertical, className]
  );

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        onClick={togglePlayPause}
        ref={videoRef}
        src={src}
        className={computedVideoClass}
        onError={onError}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        controlsList="nodownload"
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);

            const { videoWidth, videoHeight } = videoRef.current;
            setIsVertical(videoHeight > videoWidth);

            if (progressFilledRef.current) {
              progressFilledRef.current.style.width = '0%';
            }
          }
          setIsLoading(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={() => setVolume(videoRef.current?.volume || 1)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      >
        {caption && (
          <track kind="captions" src="" srcLang="en" label={caption} default />
        )}
      </video>

      {isLoading && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          aria-label="Loading video"
        >
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />{' '}
        </div>
      )}
      <AnimatePresence>
        {!isPlaying && !isLoading && !showControls && (
          <m.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-color  opacity-80 hover:opacity-100 transition-opacity bg-black/80 rounded-full p-4"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            aria-label="Play video"
          >
            <Play size={64} />
          </m.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showControls && !isLoading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-0 left-0 right-0 bg-black/70 px-4 py-2 flex items-center justify-between transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute right-2 bottom-16 flex flex-col gap-y-2 bg-black/70 px-2 py-2 rounded-lg items-center"
              onClick={(e) => e.stopPropagation()} // Prevent bubbling
            >
              <div
                className="relative w-2 h-24 bg-gray-800/70 rounded-full cursor-pointer select-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const track = e.currentTarget;
                  const rect = track.getBoundingClientRect();

                  const updateVolume = (clientY: number) => {
                    const offsetY = clientY - rect.top;
                    const newVolume = 1 - offsetY / rect.height;
                    const clamped = Math.max(0, Math.min(1, newVolume));

                    if (videoRef.current) {
                      videoRef.current.volume = clamped;
                      videoRef.current.muted = clamped === 0;

                      setVolume(clamped);
                    }
                  };

                  updateVolume(e.clientY); // Initial set

                  const handleMove = (moveEvent: MouseEvent) => {
                    updateVolume(moveEvent.clientY);
                  };

                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                  };

                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
              >
                {/* Filled Portion */}
                <div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-pink-300 to-accent-color rounded-full transition-all duration-75 ease-linear"
                  style={{ height: `${volume * 100}%` }}
                />
              </div>

              <span className="text-white text-xs select-none hidden">
                {Math.round(volume * 100)}%
              </span>
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="text-white hover:text-gray-300 mr-2"
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="text-white hover:text-gray-300"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <div className="flex-1 mx-4 flex flex-col">
              <div
                ref={progressContainerRef}
                className="relative h-1 bg-gray-800 rounded-full cursor-pointer hover:h-3 transition-all" //
                onMouseDown={startDrag}
                onClick={handleSeek}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-label="Seek video"
              >
                <div
                  ref={progressFilledRef}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-300 to-accent-color rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />

                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md -translate-x-1/2 hidden hover:block group-hover:block"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-white text-sm mt-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="text-white hover:text-gray-300 ml-4"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
