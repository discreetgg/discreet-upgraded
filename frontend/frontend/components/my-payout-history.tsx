import { DatePicker } from './date-picker';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';

export const MyPayoutHistory = () => {
  return (
    <div className='p-8 pb-25 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-8'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg text-[#D4D4D8] font-medium'>Payout History</h2>
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
        </div>
      </div>
      <Separator />
      <div className='flex items-center justify-center flex-col gap-6'>
        <Icon.payout className='size-10' />
        <p className='text-[#D4D4D8] text-[15px] text-center'>
          You don't have any payout{' '}
        </p>
      </div>
    </div>
  );
};
