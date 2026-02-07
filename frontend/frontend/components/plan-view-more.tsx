'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SubscriptionPlanType } from '@/types/global';
import { useState } from 'react';
import { SubscriptionsCreatePlanDialog } from './subscriptions-create-plan-dialog';
import { Icon } from './ui/icons';

export const PlanViewMore = ({ plan }: { plan: SubscriptionPlanType }) => {
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Icon.more />
        </DropdownMenuTrigger>
        <DropdownMenuContent className='shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0'>
          <DropdownMenuItem
            onClick={() => setShowEditPlanDialog(true)}
            className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'
          >
            <Icon.editContent />
            Edit Plan
          </DropdownMenuItem>
          <DropdownMenuSeparator className='my-0' />
          <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
            <Icon.pause />
            Pause New Sign-ups
          </DropdownMenuItem>
          <DropdownMenuSeparator className='my-0' />
          <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
            <Icon.archive />
            Archive plan
          </DropdownMenuItem>
          <DropdownMenuSeparator className='my-0' />
          <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
            <Icon.download />
            Download Subscriber CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator className='my-0' />
          <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
            <Icon.copy />
            Copy Plan Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showEditPlanDialog && (
        <SubscriptionsCreatePlanDialog
          editData={plan}
          onClose={(close) => setShowEditPlanDialog(close)}
        />
      )}
    </>
  );
};
