'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from './shared/video-player';

interface AuthenticatedMediaProps extends Omit<ImageProps, 'src'> {
  src: string;
  type: 'image' | 'video';
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
  customVideoPlayer?: boolean;
  videoPlayerFit?: 'contain' | 'cover';
  videoPlayerCaption?: string;
  alt: string;
  className?: string;
  onMediaError?: () => void;
}

export const AuthenticatedMedia = ({
  src,
  type,
  className,
  alt,
  videoProps,
  customVideoPlayer = false,
  videoPlayerFit = 'contain',
  videoPlayerCaption,
  onMediaError,
  ...props
}: AuthenticatedMediaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setResolvedSrc(src);

    if (typeof window === 'undefined') {
      return;
    }

    const isMediaProxyPath = /\/api\/(media|asset)\//.test(src);
    if (!isMediaProxyPath) {
      return;
    }

    const token = window.localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const fetchMediaBlob = async () => {
      try {
        const response = await fetch(src, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setResolvedSrc(objectUrl);
      } catch {
        // keep original source if auth fetch fails
      }
    };

    void fetchMediaBlob();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    },
    [],
  );

  if (type === 'video') {
    return (
      <div
        ref={containerRef}
        className="w-full h-full select-none"
        onDragStart={(e) => e.preventDefault()}
      >
        {customVideoPlayer ? (
          <VideoPlayer
            src={resolvedSrc}
            className={className}
            fit={videoPlayerFit}
            caption={videoPlayerCaption}
            onError={onMediaError}
          />
        ) : (
          <video
            src={resolvedSrc}
            className={className}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            controlsList="nodownload"
            onError={onMediaError}
            {...videoProps}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      ref={containerRef}
      className="w-full h-full select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        className={className}
        unoptimized
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        onError={onMediaError}
        {...props}
      />
    </div>
  );
};
