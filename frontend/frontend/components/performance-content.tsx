import { PerformancePost } from './performance-post';
import { PerformanceStat } from './performance-stat';

export const PerformanceContent = () => {
  return (
    <div className='py-6 space-y-6'>
      <PerformanceStat />
      <PerformancePost />
    </div>
  );
};
