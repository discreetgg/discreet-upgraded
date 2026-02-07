'use client';
import React from 'react';
import TipButton from './tip-button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
interface TipAmountCardProps {
  amount: string;
  onClick?: () => void;
  isLoading?: boolean;
  isSelected?: boolean;
  className?: string;
  iconClassName?: string;
}

function TipAmountCard({
  amount,
  onClick,
  isLoading,
  isSelected,
  className,
  iconClassName,
}: TipAmountCardProps) {
  return (
    <div
      style={{
        borderRadius: 9.987,
      }}
      className={cn(
        'w-full sm:w-[255.66px] isolate h-[140px] sm:h-[182px] relative rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-[#0F111433]/40 transition-colors',
        className
      )}
    >
      <Image
        src="/glass-border.png"
        alt="tipping amount card background"
        fill
        className="-z-10"
      />
      <span className="text-[40px] sm:text-[61.22px] font-inter text-white leading-[24.5px]">
        ${amount}
      </span>
      <TipButton
        isLoading={isLoading}
        isSelected={isSelected}
        onClick={onClick}
        iconClassName={iconClassName}
      />
    </div>
  );
}

export default TipAmountCard;
