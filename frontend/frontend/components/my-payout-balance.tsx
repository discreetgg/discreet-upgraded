import { AddPaymentMethod } from './add-payout-method';
import { Source } from './earning-source';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';

export const MyPayoutBalance = () => {
  return (
    <div className='p-8 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-8'>
      <div className='space-y-8'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg text-[#D4D4D8] font-medium'>
              Available Balance
            </h2>
            <Button
              variant='ghost'
              className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] bg-transparent h-auto rounded border'
            >
              Withdraw all
            </Button>
          </div>

          <Source
            amount='00.00'
            title='Credit'
            metric='00.00'
            icon={Icon.credit}
            className='space-y-4'
          />
        </div>
      </div>
      <Separator />
      <AddPaymentMethod />
    </div>
  );
};
