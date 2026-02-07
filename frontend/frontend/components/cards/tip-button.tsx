'use client';
import React, { useState } from 'react';
import { Icon } from '../ui/icons';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TipButtonProps {
  isLoading?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  type?: 'button' | 'submit' | 'reset';
}

const ArrowIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="17"
    viewBox="0 0 13 17"
    fill="none"
    {...props}
  >
    <path
      d="M6.28334 0.698242L0.698242 6.28334M6.28334 0.698242L11.8684 6.28334M6.28334 0.698242V10.4722M6.28334 15.5918V13.2647"
      stroke={props.stroke || 'white'}
      strokeWidth="1.39628"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function TipButton({
  isLoading,
  isSelected,
  onClick,
  className,
  iconClassName,
  type = 'button',
}: TipButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      disabled={isLoading}
      type={type}
      className={cn(
        'absolute w-[41px] h-[41px] bottom-2.5 right-2.5 cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all duration-150',
        isHovered && 'scale-105',
        isLoading && 'opacity-50 cursor-wait',
        className
      )}
    >
      <Image src="/glass-button-bg.png" alt="glass-button" fill />
      <div className="w-full h-full relative flex items-center justify-center">
        {isLoading && isSelected ? (
          <Icon.loadingIndicator
            width={20}
            height={20}
            className="animate-spin"
          />
        ) : (
          <ArrowIcon
            stroke={isHovered ? '#FF0065' : 'white'}
            className={cn('', iconClassName)}
          />
        )}
      </div>
    </button>
  );
}

export default TipButton;
