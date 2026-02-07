import { DatePicker } from './date-picker';
import { Source } from './earning-source';
import { Button } from './ui/button';
import { Icon } from './ui/icons';

export const SubscriptionStat = () => {
  return (
    <div className='space-y-10'>
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
          amount='345,990'
          currency='USD'
          title='Subscriptions'
          metric='23% increase - last month'
          className='flex-1'
        />
        <Source
          amount='2001'
          currency='Subscriber'
          title='Active Subscriber'
          metric='23% decrease - last month'
          className='flex-1'
        />
        <Source
          amount='3.8'
          currency='%'
          title='Churn Rate'
          metric='23% decrease - last month'
          className='flex-1'
        />
      </div>
    </div>
  );
};
