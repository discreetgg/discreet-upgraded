'use client';
import { DatePicker } from './date-picker';
import { Source } from './earning-source';
import { Button } from './ui/button';
import { Icon } from './ui/icons';

export const PerformanceStat = () => {
  return (
    <div className='p-8 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10'>
      <div className='flex gap-2 items-center'>
        <DatePicker />
        <Button
          variant='ghost'
          className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] bg-transparent h-auto rounded border'
        >
          View all
          <Icon.viewAll />
        </Button>
      </div>
      <div className='flex'>
        <Source
          amount='3k'
          currency='Subscription'
          title='Lifetime Subscription'
          metric='23% increase - last month'
          className='flex-1'
        />
        <Source
          amount='2.1k'
          currency='Subscription'
          title='Active Subscription'
          metric='23% increase - last month'
          className='flex-1'
        />
      </div>
    </div>
  );
};
