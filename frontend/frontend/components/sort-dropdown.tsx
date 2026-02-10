'use client';

import { Icon } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, pushUrl } from '@/lib/utils';
import { useRouter } from '@bprogress/next/app';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

interface SortDropdownProps {
  sortOptions: string[];
}

export const SortDropdown = ({ sortOptions }: SortDropdownProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>(
    initialSort && sortOptions.includes(initialSort) ? initialSort : 'Sort by'
  );

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300',
            'bg-[#1A1A1E]/40 backdrop-blur-md border border-[#2E2E32] hover:border-accent-color/50',
            'text-[#8A8C95] hover:text-white shadow-lg active:scale-95',
            isOpen && 'border-accent-color/50 ring-1 ring-accent-color/20 bg-[#1A1A1E]/60'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Sort By</span>
            <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors capitalize">
              {selectedSort === 'Sort by' ? 'Default' : selectedSort}
            </span>
          </div>
          <Icon.chevronDown
            className={cn(
              'transition-transform duration-300 size-4 opacity-40 group-hover:opacity-100',
              isOpen ? 'rotate-180 text-accent-color' : 'rotate-0'
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="!min-w-[186px] shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {sortOptions.map((sortOption, index) => (
          <React.Fragment key={sortOption}>
            {index > 0 && <DropdownMenuSeparator className="my-0" />}
            <DropdownMenuItem
              className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
              onClick={() => {
                setSelectedSort(sortOption);
                setIsOpen(false);
                const params = new URLSearchParams(
                  Array.from(searchParams.entries())
                );
                params.set('sort', sortOption);
                if (sortOption.toLowerCase() === 'random') {
                  params.set('randomSeed', Date.now().toString());
                } else {
                  params.delete('randomSeed');
                }
                const url = `${pathname}?${params.toString()}`;
                pushUrl(url, router);
              }}
            >
              {selectedSort === sortOption ? (
                <Icon.radioActive />
              ) : (
                <Icon.radioInactive />
              )}
              {sortOption}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
