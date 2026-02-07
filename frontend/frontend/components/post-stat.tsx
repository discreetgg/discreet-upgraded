import Image from 'next/image';
import { PostStatViewMore } from './post-stat-view-more';
import { Icon } from './ui/icons';

export const PostStat = () => {
  return (
    <div className='space-y-6 w-full pb-8'>
      <div className='space-y-6 w-full'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-4 max-w-[199px]'>
            <Image src='/video-thumbnail.svg' width={44} height={44} alt='' />
            <p className='truncate tect-[#D4D4D8] text-[15px] font-weight capitalize'>
              Trading view connection
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <span className='text-[#039855] text-[15px] font-medium'>
                Live
              </span>
              <Icon.dot />
              <span className='text-[#8A8C95] text-[15px] font-medium'>
                Jan 2024
              </span>
            </div>
            <PostStatViewMore />
          </div>
        </div>
        <p className='max-w-[586px] text-[#F8F8F8] text-[15px]'>
          Lorem ipsum dolor sit amet. Aut commodi necessitatibus et architecto
          quia qui dolores necessitatibus cum nemo voluptatem qui unde nobis.
        </p>
        <div className='items-center justify-between flex'>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Tips:</span> 25k USD
          </span>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>PPV:</span> 233K USD
          </span>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Sub:</span> 83 (23K USD)
          </span>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Total earnings:</span> 4566k USD
          </span>
        </div>
        <div className='items-stretch justify-between flex'>
          <span className='flex gap-2 items-center'>
            <Icon.like />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Like: 232
            </span>
          </span>
          <div className='bg-[#3C3C42] w-px' />
          <span className='flex gap-2 items-center'>
            <Icon.comment />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Comments: 232
            </span>
          </span>
          <div className='bg-[#3C3C42] w-px' />
          <span className='flex gap-2 items-center'>
            <Icon.views />
            <span className='text-[15px] capitalize text-[#8A8C95]'>
              Views: 232
            </span>
          </span>
        </div>
      </div>
      <div className='p-6 rounded-lg bg-[#1F2227] space-y-6'>
        <div className='flex items-center gap-2'>
          <Icon.analytics />
          <p className='text-[#D4D4D8] text-[15px] font-medium'>
            Analytics and Insights
          </p>
        </div>
        <div className='items-stretch gap-4 flex'>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Revenue per View: </span> $0.125
          </span>
          <div className='bg-[#3C3C42] w-px' />
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Subscriber Conversion: </span>
            10 new subs
          </span>
          <div className='bg-[#3C3C42] w-px' />
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Engagement Rate: </span>
            10%
          </span>
        </div>
        <div className='items-stretch gap-4 flex'>
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Tips: </span> $20,{' '}
            <span className='text-[#8A8C95]'>PPV: </span> $100
          </span>
          <div className='bg-[#3C3C42] w-px' />
          <span className='text-[15px] capitalize'>
            <span className='text-[#8A8C95]'>Top Audience Location: </span>
            USA: 50%, UK: 30%
          </span>
        </div>
        <div className='text-[15px] capitalize'>
          <span className='text-[#8A8C95]'>Peak Engagement Time: </span>
          5:00 PM - 7:00 PM
        </div>
      </div>
    </div>
  );
};
