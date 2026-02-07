'use client';

import type { UserType } from '@/types/global';
import { SellerCard } from './seller-card';
import { useSocket } from '@/context/socket-context';
import { useMemo } from 'react';

interface SellersGridProps {
  creators: UserType[] | null;
}

export const SellersGrid = ({ creators }: SellersGridProps) => {
  const { isUserOnline } = useSocket();

  // Sort creators: online users first, then offline
  const sortedCreators = useMemo(() => {
    if (!creators) return null;

    return [...creators].sort((a, b) => {
      const aOnline = isUserOnline(a.discordId);
      const bOnline = isUserOnline(b.discordId);

      // Online users come first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return 0; // Keep original order for same status
    });
  }, [creators, isUserOnline]);

  if (!sortedCreators || sortedCreators.length === 0) {
    return (
      <div className="rounded-md border border-[#2E2E32] bg-[#1F2227] p-6 text-center text-sm text-[#8A8C95]">
        No sellers match your current filters.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-2.5">
      {sortedCreators.map((creator) => (
        <SellerCard key={creator.discordId} creator={creator} />
      ))}
    </div>
  );
};
