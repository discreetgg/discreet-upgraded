'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { UserType } from '@/types/global';
import { UserAvatarWithStatus } from './user-avatar-with-status';
import Link from 'next/link';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CamsConnectQueueBuyerDialog } from './cams-connect-queue-buyer-dialog';
import { PreCallBalanceCheckDialog } from './pre-call-balance-check-dialog';

export const CamsConnectDialog = ({
  open,
  onOpenChange,
  user,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
  children?: React.ReactNode;
}) => {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isBalanceCheckOpen, setIsBalanceCheckOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="rounded-[12px] bg-[#111316] w-[542px] border border-[#16191D] p-[calc(7.752px*2)] space-y-3">
          <div className="w-max mx-auto">
            <UserAvatarWithStatus
              profileImage={user?.profileImage?.url || undefined}
              discordId={user?.discordId || ''}
              discordAvatar={user?.discordAvatar || ''}
              width={248}
              height={248}
              className="mx-auto my-4 md:size-[248px] w-max"
              onlineStatusClassname="size-[41px] bottom-0 right-6 border-2 border-[#111316] rounded-full"
            />
          </div>
          <div className="space-y-[37px] max-w-[313px] mx-auto">
            <div className="space-y-3">
              <p className="text-center text-[18.625px] font-medium">
                {user?.displayName} charges
              </p>
              <p className="text-[18.625px] text-center font-medium">
                ${user?.callRate}{' '}
                <span className="text-[#FF007F]">per minute</span>
              </p>
            </div>

            <Separator className="my-" />

            <p className="text-[18.625px] mb-[56px] font-medium text-center">
              {user?.minimumCallTime}{' '}
              {user?.minimumCallTime === 1 ? 'minute' : 'minutes'} minimum call
              time
            </p>
          </div>

          <div className="space-y-10 max-w-[389px] mx-auto">
            <button
              onClick={() => setIsBalanceCheckOpen(true)}
              disabled={!user?.takingCams}
              className={cn(
                'rounded flex items-center justify-center border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
                !user?.takingCams &&
                  'opacity-50 cursor-not-allowed border-[#8A8C95] shadow-[2px_2px_0_0_#8A8C95]',
              )}
            >
              {user?.takingCams ? (
                <>
                  <Icon.videoButton className="size-[21.38px]" />
                  Dial
                </>
              ) : (
                'Not taking cams'
              )}
            </button>
            <span className="text-[#B3B3B3] text-sm text-center">
              By Dialing you are agreeing to Discreet{' '}
              <Link href="/terms-and-condition" className="underline">
                Terms & Conditions.
              </Link>
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <PreCallBalanceCheckDialog
        open={isBalanceCheckOpen}
        onOpenChange={setIsBalanceCheckOpen}
        seller={user}
        onProceed={() => {
          setIsBalanceCheckOpen(false);
          setIsQueueOpen(true);
        }}
      />
      <CamsConnectQueueBuyerDialog
        open={isQueueOpen}
        onOpenChange={setIsQueueOpen}
        user={user}
      />
    </>
  );
};
