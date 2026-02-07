'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Icon } from './icons';

export const InfiniteMovingCards = ({
  items,
  direction = 'left',
  speed = 'fast',
  pauseOnHover = true,
  className,
}: {
  items: {
    name: string;
    username: string;
    description: string;
    profileImage: string;
    followLink: string;
    partnerLink: string;
  }[];
  direction?: 'left' | 'right';
  speed?: 'fast' | 'normal' | 'slow';
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      for (const item of scrollerContent) {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      }

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === 'left') {
        containerRef.current.style.setProperty(
          '--animation-direction',
          'forwards'
        );
      } else {
        containerRef.current.style.setProperty(
          '--animation-direction',
          'reverse'
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === 'fast') {
        containerRef.current.style.setProperty('--animation-duration', '20s');
      } else if (speed === 'normal') {
        containerRef.current.style.setProperty('--animation-duration', '40s');
      } else {
        containerRef.current.style.setProperty('--animation-duration', '80s');
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative z-20 max-w-xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_5%,white_80%,transparent)]',
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap gap-2',
          start && 'animate-scroll',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {items.map((item, index) => (
          <li
            className="relative w-full space-y-4 max-w-[156px] shrink-0 rounded-2xl bg-[#1E1E21] px-[11px] py-3.5"
            key={item.name + index}
          >
            <Image
              src={item.profileImage}
              height={48}
              width={48}
              alt=""
              className="rounded-full"
            />
            <div className="space-x-1">
              <span className="font-bold text-[15px] ">{item.name}</span>
              <span className="text-[15px] font-light text-[#D4D4D8]">
                {item.username}
              </span>
            </div>
            <p className="max-w-[131px] text-[#737682] text-[15px] ">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <Link
                href={item.followLink}
                type="button"
                className="text-sm text-[#FF007F] font-medium"
              >
                Join Server
              </Link>
              <Link
                href={item.followLink}
                type="button"
                className="text-[10px] text-[#D4D4D8] font-light flex gap-0.5 items-center"
              >
                <Icon.badge />
                Partner
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
