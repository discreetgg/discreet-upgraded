import { Skeleton } from './ui/skeleton';

export const HomePostsNavHeaderLoader = () => {
  return (
    <div className='flex gap-2'>
      <Skeleton className='w-[82px] h-[39px] rounded' />
      <Skeleton className='w-[71px] h-[39px] rounded' />
      <Skeleton className='w-[134px] h-[39px] rounded' />
      <Skeleton className='w-[225px] h-[39px] rounded' />
    </div>
  );
};
