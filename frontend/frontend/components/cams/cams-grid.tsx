'use client';

import type { UserType } from '@/types/global';
import { CamCard } from './cam-card';

interface CamsGridProps {
  creators: UserType[] | null;
  currentUserId?: string;
}

export const CamsGrid = ({ creators, currentUserId }: CamsGridProps) => {
  const availableCreators =
    creators?.filter((creator) => creator.role === 'seller') ?? [];

  if (availableCreators.length === 0) {
    return (
      <div className="rounded-md border border-[#2E2E32] bg-[#1F2227] p-6 text-center text-sm text-[#8A8C95]">
        No creators are currently available for cams.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-2.5">
      {availableCreators.map((creator) => {
        const isCurrentUser = currentUserId === creator.discordId;
        return (
          <CamCard
            key={creator.discordId}
            creator={creator}
            isCurrentUser={isCurrentUser}
          />
        );
      })}
    </div>
  );
};
