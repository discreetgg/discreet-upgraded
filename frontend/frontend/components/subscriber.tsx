import Image from 'next/image';
import { SubscriberViewMore } from './subscriber-view-more';

export const Subscriber = () => {
  return (
    <div className='space-y-6 w-full pb-8'>
      <div className='space-y-6 w-full'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-4 max-w-[199px]'>
            <Image
              src='/user.svg'
              height={48}
              width={48}
              className='rounded-full'
              alt=''
            />
            <div className='space-y-1'>
              <p className='truncate text-[#D4D4D8] text-[15px] font-bold capitalize'>
                Discreet
              </p>
              <p className='truncate text-[#8A8C95] text-[15px] capitalize'>
                @discreet.gg
              </p>
            </div>
          </div>
          <div className='flex items-center gap-6'>
            <p className='text-[#039855] text-[15px]'>Active</p>
            <SubscriberViewMore />
          </div>
        </div>

        <div className='items-stretch justify-between flex'>
          <span className='text-[15px] capitalize text-[#8A8C95]'>
            Plan: <span className='text-white'>Green plan</span>
          </span>
          <span className='text-[15px] capitalize text-[#8A8C95]'>
            Since: <span className='text-white'> 14 Feb 2025</span>
          </span>
          <span className='text-[15px] capitalize text-[#8A8C95]'>
            Next Renewal: <span className='text-white'>14 Mar 2025</span>
          </span>
          <span className='text-[15px] capitalize text-[#8A8C95]'>
            Lifetime Value (LTV): <span className='text-white'>$180</span>
          </span>
        </div>
      </div>
    </div>
  );
};
