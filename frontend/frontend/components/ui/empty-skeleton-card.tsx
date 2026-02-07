import { Skeleton } from '@/components/ui/skeleton';

export default function EmptySkeletonCard() {
  return (
    <div className='flex w-full flex-col gap-y-4 border border-accent-gray/50 rounded-lg pl-4 py-4 pr-2 border-r-[6px] border-b-[6px]'>
      <div className='flex items-center gap-x-3'>
        <Skeleton className='size-12 rounded-full shrink-0' />
        <div className='flex flex-col gap-y-2 w-full'>
          <Skeleton className='w-1/4 h-3 rounded-full' />
          <Skeleton className='w-1/2 h-3 rounded-full' />
        </div>
      </div>

      <div className='flex flex-col gap-y-2 w-full'>
        <Skeleton className='w-[80%] h-3 rounded-full' />
        <Skeleton className='w-full h-3 rounded-full' />
        <Skeleton className='w-[80%] h-3 rounded-full' />
      </div>
    </div>
  );
}
