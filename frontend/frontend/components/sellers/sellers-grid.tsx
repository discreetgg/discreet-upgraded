'use client';

import type { UserType } from '@/types/global';
import { SellerCard } from './seller-card';

interface SellersGridProps {
  creators: UserType[] | null;
}

export const SellersGrid = ({ creators }: SellersGridProps) => {
  if (!creators || creators.length === 0) {
    return (
      <div className="rounded-md border border-[#2E2E32] bg-[#1F2227] p-6 text-center text-sm text-[#8A8C95]">
        No sellers match your current filters.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {creators.map((creator) => (
        <SellerCard key={creator.discordId} creator={creator} />
      ))}
    </div>
  );
};
