'use client';

import { useGlobal } from '@/context/global-context-provider';
import { EarningSummaryChannelStat } from './earning-summary-channel-stat';
import { EarningSummaryPostsStat } from './earning-summary-posts-stat';

export const EarningSummary = () => {
  const { user: currentUser } = useGlobal();

  if (!currentUser) {
    return <p>UNAUTHENTICATED</p>;
  }

  return (
    <div className="py-6 space-y-6">
      <EarningSummaryChannelStat currentUser={currentUser} />
      {/* <EarningSummaryPostsStat /> */}
    </div>
  );
};
