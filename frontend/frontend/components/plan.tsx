'use client';
// todo work on benefits and mrr

import type { SubscriptionPlanType } from '@/types/global';
import { PlanViewMore } from './plan-view-more';
import { Icon as Icons } from './ui/icons';

export const Plan = ({
  icon: Icon,
  plan,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  plan: SubscriptionPlanType;
}) => {
  return (
    <div className='space-y-6 w-full pb-8'>
      <div className='space-y-6 w-full'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-4 max-w-[199px]'>
            <Icon />
            <div className='space-y-1'>
              <p className='truncate text-[#D4D4D8] text-[15px] font-bold capitalize'>
                {plan.name}
              </p>
              <p className='truncate text-[#8A8C95] text-[15px] capitalize'>
                {plan.amount} USD/monthly
              </p>
            </div>
          </div>
          <PlanViewMore plan={plan} />
        </div>
        <p className=' text-[#737682] text-[15px]'>{plan.description}</p>
        <div className='items-stretch justify-between flex'>
          <span className='flex gap-2 items-center'>
            <Icons.like />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Subscribers:
              <span className='text-white'> {plan.subscribersCount}</span>
            </span>
          </span>
          <div className='bg-[#3C3C42] w-px' />
          {/* <span className='flex gap-2 items-center'>
            <Icons.comment />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              MRR: <span className='text-white'>{mrr}</span>
            </span>
          </span> */}
          <span className='flex gap-2 items-center'>
            <Icons.comment />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Type: <span className='text-white'>{plan.type}</span>
            </span>
          </span>
          <div className='bg-[#3C3C42] w-px' />
          {/* <span className='flex gap-2 items-center'>
            <Icons.views />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Benefits: <span className='text-white'>{benefits}</span>
            </span>
          </span> */}
        </div>
      </div>
    </div>
  );
};
