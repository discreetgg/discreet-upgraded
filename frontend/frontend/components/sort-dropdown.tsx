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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>(
    searchParams.get('sort') || 'Sort by'
  );

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'md:py-[11px] md:px-[16.5px] px-3 py-2 border-[1px] transition-all duration-200 border-[#1E2227]  cursor-pointer rounded-[7px] text-[#8A8C95] md:text-[14px] text-[10px] capitalize hover:text-[#F8F8F8] flex items-center gap-2',
            isOpen ? 'border-[#8A8C95]' : 'border-[#1E2227]'
          )}
        >
          <span>{selectedSort}</span>
          <Icon.chevronDown
            className={cn(
              'transition-transform duration-200 size-6',
              isOpen ? 'rotate-180' : 'rotate-0 '
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
