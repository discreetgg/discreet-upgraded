import { PerformancePostViewAll } from './performance-post-view-all';
import { PostStat } from './post-stat';

export const PerformancePost = () => {
  return (
    <div className='p-8 rounded-lg border  border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg text-[#D4D4D8] font-medium'>Post / Menu</h2>
        <PerformancePostViewAll />
      </div>
      <div className='space-y-8 divide-y'>
        <PostStat />
        <PostStat />
      </div>
    </div>
  );
};
