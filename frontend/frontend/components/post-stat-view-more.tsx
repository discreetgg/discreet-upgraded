'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from './ui/icons';

export const PostStatViewMore = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Icon.more />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0'>
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.viewAnalytics />
          View Insights
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.subscription />
          Add to a subscription plan
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.repostContent />
          Unpublished
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
