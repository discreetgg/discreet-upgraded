'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

import type { ComponentProps } from 'react';

export default function BlurImage(props: ComponentProps<typeof Image>) {
  const [isLoading, setLoading] = useState(true);

  return (
    <Image
      {...props}
      alt={props.alt}
      className={cn(
        'duration-200 ease-in-out',
        isLoading ? 'blur-sm' : 'blur-0',
        props.className
      )}
      onLoad={() => {
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }}
    />
  );
}
