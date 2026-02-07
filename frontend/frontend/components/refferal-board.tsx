import { AddPaymentMethod } from './add-payout-method';
import { Source } from './earning-source';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';

export const RefferalBoard = () => {
  return (
    <div className='p-8 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-[37px]'>
      <div className='space-y-[37px]'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-[17px] max-w-[422px]'>
            <h2 className='text-[24.26px] text-[#D4D4D8] font-medium'>
              Referrals
            </h2>
            <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>Grow our community and earn rewards for each members you invite</p>
            </div>
            <Button
              variant='default'
              className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2  text-[20.15px] transition-all duration-300 hover:bg-[#FF007F]/90 active:bg-[#FF007F]/90 active:scale-95 hover:text-black  bg-[#FF007F] rounded-[12px] text-black h-auto rounded'
            >
            Copy link
            </Button>
          </div>
        </div>
      </div>
      <Separator />
      <p className='text-[25.25px] leading-[26.4px] tracking-[0.66px] font-semibold py-[20.5px] rounded-full w-full bg-[#15171B] text-[#8A8C95] text-center'>discreet.gg/invite?345=123</p>
      <div className='w-full p-5 bg-[#1F222759] space-y-[34.32px] rounded-[16.1px]' >
        <div className='flex items-center justify-between '>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>Today</p>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>0</p>
        </div>
        <div className='flex items-center justify-between '>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>Total Invites</p>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>130</p>
        </div>
        <div className='flex items-center justify-between '>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>Claimed</p>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>$0.00</p>
        </div>
        <div className='flex items-center justify-between '>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>Unclaimed</p>
          <p className='text-[20.215px] leading-[26.4px] tracking-[0.66px] font-medium text-[#8A8C95] '>$0.00</p>
        </div>
        <Button
              variant='default'
              className='gap-2 flex items-center text-[#8A8C95] w-full font-medium px-4 py-2  text-[20.15px] transition-all duration-300 hover:bg-[#FF007F]/90 active:bg-[#FF007F]/90 active:scale-95 hover:text-black  bg-[#FF007F] rounded-[12px] text-black h-auto rounded'
            >
            Claim All
            </Button>
      </div>
    </div>
  );
};
