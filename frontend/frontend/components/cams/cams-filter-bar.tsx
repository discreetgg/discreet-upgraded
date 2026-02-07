'use client';

import { useRouter } from '@bprogress/next/app';
import { usePathname, useSearchParams } from 'next/navigation';
import { pushUrl } from '@/lib/utils';
import { RaceTab } from '../race-tab';
import { SortDropdown } from '../sort-dropdown';

interface CamsFilterBarProps {
  raceOptions: string[];
  camsOptions: string[];
  sortOptions: string[];
}

export const CamsFilterBar = ({
  raceOptions,
  camsOptions,
  sortOptions,
}: CamsFilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedRace = searchParams.get('race');
  const selectedCams = searchParams.get('cams');

  return (
    <>
      <div className="flex gap-2 w-full relative overflow-x-auto hidden_scrollbar mb-[19px]">
        {raceOptions.length > 0 &&
          raceOptions.map((raceItem) => (
            <RaceTab
              key={raceItem}
              race={raceItem}
              selectedRace={selectedRace}
              onClick={() => {
                const params = new URLSearchParams(
                  Array.from(searchParams.entries())
                );
                const raceValue = raceItem.toLowerCase();
                if (selectedRace === raceValue) {
                  // If clicking the same race, remove the filter
                  params.delete('race');
                } else {
                  params.set('race', raceValue);
                }
                const url = `${pathname}?${params.toString()}`;
                pushUrl(url, router);
              }}
            />
          ))}
      </div>

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
        {sortOptions.length > 0 && <SortDropdown sortOptions={sortOptions} />}
      </div>
    </>
  );
};
