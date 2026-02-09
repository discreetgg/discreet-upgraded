import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <section className='flex h-full w-full lg:w-[524px] flex-col mx-auto bg-[#111316]'>
      <div className='flex items-center w-full border-b border-[#1E2227] py-3 px-4 gap-3'>
        <Skeleton className='size-8 rounded-lg md:hidden' />
        <Skeleton className='size-8 rounded-full' />
        <div className='space-y-2 flex-1'>
          <Skeleton className='h-4 w-28 rounded-md' />
          <Skeleton className='h-3 w-20 rounded-md' />
        </div>
        <Skeleton className='size-8 rounded-lg' />
        <Skeleton className='size-8 rounded-lg' />
      </div>

      <div className='flex-1 p-4 space-y-5'>
        {Array.from({ length: 8 }, (_, i) => i).map((item) => (
          <div
            key={item}
            className={`flex ${item % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className='max-w-[72%] space-y-2'>
              <Skeleton className='h-3 w-14 rounded-md' />
              <Skeleton className='h-10 w-52 rounded-xl' />
            </div>
          </div>
        ))}
      </div>

      <div className='w-full p-2 border-t border-[#1E2227]'>
        <Skeleton className='h-10 w-full rounded-full' />
      </div>
    </section>
  );
}
