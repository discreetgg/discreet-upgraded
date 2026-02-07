'use client';

import { cn } from '@/lib/utils';

interface RaceTabProps {
  race: string;
  selectedRace: string | null;
  onClick: () => void;
}

export const RaceTab = ({ race, selectedRace, onClick }: RaceTabProps) => {
  const isSelected = selectedRace === race.toLowerCase();
  return (
    <button
      onClick={onClick}
      className={cn(
        'md:py-[11px] md:px-[16.5px] px-3 py-2 border cursor-pointer rounded-[7px] md:text-[14px] text-[10px] capitalize transition-colors',
        isSelected
          ? 'border-[#FF007F] bg-[#FF007F] text-[#F8F8F8]'
          : 'border-[#1E2227] text-[#8A8C95] hover:bg-[#1E2227] hover:text-[#F8F8F8]'
      )}
    >
      {race}
    </button>
  );
};
