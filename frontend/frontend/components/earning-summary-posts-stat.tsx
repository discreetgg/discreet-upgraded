'use client';

import { DatePicker } from './date-picker';
import { EarningSummaryFilterBy } from './earning-summary-filter-by';
import { EarningSummaryViewAll } from './earning-summary-view-all';
import { PostStat } from './post-stat';
import { ShowAnalyticsModal } from './show-analytics-dialog';
import { Separator } from './ui/separator';

export const EarningSummaryPostsStat = () => {
  return (
    <div className='pt-10 px-8 pb-25 rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-15'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg text-[#D4D4D8] font-medium'>Post Stats</h2>
        <div className='flex gap-2 items-center'>
          <ShowAnalyticsModal />
          <DatePicker />
          <EarningSummaryFilterBy />
          <EarningSummaryViewAll />
        </div>
      </div>
      <Separator />
      <div className='flex items-center justify-between'>
        <PostStat />
      </div>
    </div>
  );
};
