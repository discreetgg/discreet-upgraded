'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from './ui/icons';

export const EarningSummaryViewAll = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='gap-2 flex items-center text-[#8A8C95] font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border-[#1F2227] rounded border'>
        View all
        <Icon.viewAll />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0'>
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.viewAnalytics />
          View Analytics
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.editContent />
          Edit Content
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.repostContent />
          Repost Content
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.markAsPaid />
          Mark as Paid/Free
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.activate />
          Activate/Deactivate
        </DropdownMenuItem>
        <DropdownMenuSeparator className='my-0' />
        <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#B42318] m-0 rounded-none p-4'>
          <Icon.deleteContent />
          Delete Content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
