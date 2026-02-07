'use client';

import { cn } from '@/lib/utils';
import Image, { type ImageProps } from 'next/image';
import { useRef } from 'react';

interface AuthenticatedMediaProps extends Omit<ImageProps, 'src'> {
  src: string;
  type: 'image' | 'video';
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
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
  onMediaError,
  ...props
}: AuthenticatedMediaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (type === 'video') {
    return (
      <div
        ref={containerRef}
        className="w-full h-full select-none"
        onDragStart={(e) => e.preventDefault()}
      >
        <video
          src={src}
          className={className}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          controlsList="nodownload"
          onError={onMediaError}
          {...videoProps}
        />
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
        src={src}
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
