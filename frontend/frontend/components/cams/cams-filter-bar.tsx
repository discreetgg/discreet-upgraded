'use client';

import { useRouter } from '@bprogress/next/app';
import { usePathname, useSearchParams } from 'next/navigation';
import { pushUrl } from '@/lib/utils';
import { RaceTab } from '../race-tab';
import { SortDropdown } from '../sort-dropdown';

interface CamsFilterBarProps {
  camsOptions: string[];
  sortOptions: string[];
}

export const CamsFilterBar = ({
  camsOptions,
  sortOptions,
}: CamsFilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCams = searchParams.get('cams');
  const selectedSort = searchParams.get('sort')?.toLowerCase();
  const showRandomRefresh = selectedSort === 'random';

  return (
    <div className="flex items-start justify-between mb-[19px]">
      <div className="flex gap-2 max-w-full relative overflow-x-auto hidden_scrollbar">
        {camsOptions.length > 0 &&
          camsOptions.map((camsItem) => (
            <RaceTab
              key={camsItem}
              race={camsItem}
              selectedRace={selectedCams}
              onClick={() => {
                const params = new URLSearchParams(
                  Array.from(searchParams.entries())
                );
                const camsValue = camsItem.toLowerCase();
                if (selectedCams === camsValue) {
                  // If clicking the same cams, remove the filter
                  params.delete('cams');
                } else {
                  params.set('cams', camsValue);
                }
                const url = `${pathname}?${params.toString()}`;
                pushUrl(url, router);
              }}
            />
          ))}
      </div>
      <div className="flex items-center gap-2">
        {showRandomRefresh && (
          <button
            className="md:py-[11px] md:px-[16.5px] px-3 py-2 border border-[#1E2227] cursor-pointer rounded-[7px] text-[#8A8C95] md:text-[14px] text-[10px] hover:text-[#F8F8F8] transition-all duration-200"
            onClick={() => {
              const params = new URLSearchParams(Array.from(searchParams.entries()));
              params.set('randomSeed', Date.now().toString());
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            Refresh Random
          </button>
        )}
        {sortOptions.length > 0 && <SortDropdown sortOptions={sortOptions} />}
      </div>
    </div>
  );
};
