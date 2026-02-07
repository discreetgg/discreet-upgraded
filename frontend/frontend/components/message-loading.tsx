'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from './ui/icons';
import { Skeleton } from './ui/skeleton';

export const MessageLoading = () => {
  const skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className='flex text-white h-[80%] gap-4'>
      {/* Left Sidebar - Messages with Loading Skeletons */}
      <div className='max-w-[266px] w-full space-y-2.5'>
        {/* Header */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-[15px] font-semibold text-white'>Messages</h2>
            <Button
              variant='ghost'
              size='icon'
              className='size-6 text-[#738197] hover:text-white hover:bg-[#3c3c42]'
            >
              <Icon.add className='h-4 w-4' />
            </Button>
          </div>

          <Input
            placeholder='Search'
            className='!bg-transparent border-[#1E2227] text-white placeholder:text-[#738197] focus:border-[#00b328]'
          />
        </div>

        <div className='flex-1 p-2 space-y-2.5 '>
          {skeletonItems.map((item, index) => {
            const opacity = 1 - index * 0.1;

            return (
              <div
                key={item}
                className='flex items-center gap-3 p-3 rounded-[13px] bg-[#1F2227]'
                style={{ opacity: Math.max(opacity, 0.3) }} // Prevent it from going too transparent
              >
                <div className='h-10 w-10 bg-[#3c3c42] rounded-full flex-shrink-0' />
                <div className='flex-1 space-y-2'>
                  <div className='h-3 bg-[#3c3c42] rounded w-3/4' />
                  <div className='h-2 bg-[#3c3c42] rounded w-1/2' />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className='flex-1 h-full bg-[#111316] '>
        <div className='flex-1 h-full' />

        {/* <MessageInput /> */}
      </div>

      <div className=' max-w-[295px] w-full'>
        <div className='p-6 '>
          <div className='flex flex-col text-center space-y-6'>
            {/* Avatar Skeleton */}
            <div>
              <Skeleton className='h-[119px] rounded-t-[10px] rounded-b-none relative block' />
              <Skeleton className='size-[74px] block relative rounded-full border-[3.895px] border-[#0F1114] ml-4 -mt-[30px]' />
            </div>
            {/* Profile Info Skeleton */}
            <div className='w-full space-y-3'>
              <Skeleton className='h-2 rounded-[21px] w-[70px]' />
              <Skeleton className='h-2 rounded-[21px] w-[117px]' />

              <div className='space-y-2 mt-4'>
                <Skeleton className='h-2 rounded-[21px] w-full' />
                <Skeleton className='h-2 rounded-[21px] w-full' />
                <Skeleton className='h-2 rounded-[21px] w-full' />
              </div>
            </div>
          </div>
        </div>

        {/* Shared Media Section */}
        <div className='flex-1 p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='text-sm font-semibold text-white'>Shared Media</h4>
            <Button
              variant='ghost'
              size='icon'
              className='p-[3px] rounded-full bg-[#1E1E21] size-auto'
            >
              <Icon.arrowUp />
            </Button>
          </div>

          <Tabs defaultValue='all'>
            <TabsList className='gap-[19.6px] bg-transparent'>
              <TabsTrigger
                value='all'
                className='!data-[state=active]:bg-[#2E2E32] !data-[state=active]:border-none'
              >
                All
              </TabsTrigger>
              <TabsTrigger value='images'>0 Images</TabsTrigger>
              <TabsTrigger value='videos'>0 Videos</TabsTrigger>
            </TabsList>
            <TabsContent value='all' className='grid grid-cols-3 gap-[0.85px]'>
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
            </TabsContent>
            <TabsContent
              value='images'
              className='grid grid-cols-3 gap-[0.85px]'
            >
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
            </TabsContent>
            <TabsContent
              value='videos'
              className='grid grid-cols-3 gap-[0.85px]'
            >
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
              <Skeleton className='!h-[76.752px] rounded-[4.10036px] bg-[#1E1E21]' />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
