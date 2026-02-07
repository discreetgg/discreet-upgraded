import { creatorSubscriptionsData } from '@/lib/data';
import { settingsSubscriptionsColumns } from './settings-subscriptions-columns';
import { SettingsSubscriptionsTable } from './settings-subscriptions-table';
import { Separator } from './ui/separator';

export const SettingsSubscriptionsContent = () => {
  return (
    <div className='px-8 py-6 w-full rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10'>
      <div className='space-y-4 max-w-[492px]'>
        <h1 className='text-[#D4D4D8] text-lg font-medium'>
          Your <span className='text-[#FF007F]'>100</span> Active Subscribers
        </h1>
        <p className='text-[#8A8C95] font-medium text-[15px]'>
          These are your active Subscribers.
        </p>
      </div>
      <Separator />
      <SettingsSubscriptionsTable
        columns={settingsSubscriptionsColumns}
        data={creatorSubscriptionsData}
      />
    </div>
  );
};
