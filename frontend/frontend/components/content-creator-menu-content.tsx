import { PerformancePost } from './performance-post';
import { PerformanceStat } from './performance-stat';

export const ContentCreatorMenuContent = () => {
  return (
    <div className='py-6 space-y-6'>
      <PerformanceStat />
      <PerformancePost />
    </div>
  );
};
