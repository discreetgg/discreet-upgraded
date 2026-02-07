import { Skeleton } from './skeleton';

export const EmptyPostsCard = () => {
  return (
    <div className='bg-[#0F1114] w-full rounded-[8px] p-4 shadow-[2px_2px_0_0_#1E1E21] border border-[#1E1E21]  flex flex-col gap-[17px] justify-between'>
      <div className='flex gap-4 items-center'>
        <Skeleton className='rounded-full size-4 p-4' />
        <div className='space-y-1'>
          <Skeleton className='rounded-[21px] bg-[#1F2227] w-[74px] h-[10px]' />
          <Skeleton className='rounded-[21px] bg-[#1F2227] w-[145px] h-[10px]' />
        </div>
      </div>
      <div className='space-y-1.5'>
        <Skeleton className='rounded-[21px] bg-[#1F2227] w-[247px] h-[10px]' />
        <Skeleton className='rounded-[21px] bg-[#1F2227] w-[301px] h-[10px]' />
        <Skeleton className='rounded-[21px] bg-[#1F2227] w-[247px] h-[10px]' />
      </div>
    </div>
  );
};
