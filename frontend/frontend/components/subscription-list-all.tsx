'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from './ui/icons';

export const SubscriberListAll = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] rounded border'>
        All
        <Icon.viewAll className='rotate-90' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0 w-[193px]'>
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.all />
          All
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.editContent />
          Live
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.editContent />
          Draft
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.archive />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
