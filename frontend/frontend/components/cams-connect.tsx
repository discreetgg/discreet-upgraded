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
        <DialogContent className="max-w-[480px] p-0 overflow-hidden border-[#2E2E32] bg-[#0A0A0B] rounded-[32px] shadow-2xl outline-none">
          <div className="relative pt-12 pb-8 px-10 flex flex-col items-center">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-accent-color/10 blur-[80px] -z-10 group-hover:bg-accent-color/20 transition-all duration-500" />

            <div className="relative mb-6 group">
              <div className="absolute inset-0 bg-accent-color/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <UserAvatarWithStatus
                profileImage={user?.profileImage?.url || undefined}
                discordId={user?.discordId || ''}
                discordAvatar={user?.discordAvatar || ''}
                width={160}
                height={160}
                className="relative size-[160px] md:size-[160px] border-4 border-[#1A1A1E] shadow-2xl"
                onlineStatusClassname="size-10 bottom-1 right-1 border-4 border-[#0A0A0B] rounded-full"
              />
            </div>

            <div className="text-center space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {user?.displayName}
              </h3>
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#1A1A1E] border border-[#2E2E32] rounded-full w-fit mx-auto">
                <span className="text-sm font-semibold text-white/90">${user?.callRate}</span>
                <span className="text-xs font-medium text-[#8A8C95]">/ minute</span>
              </div>
            </div>

            <div className="w-full space-y-6">
              <div className="bg-[#161618]/50 border border-[#2E2E32]/50 rounded-2xl p-4 text-center">
                <p className="text-[13px] text-[#8A8C95] font-bold uppercase tracking-widest mb-1"> Requirement </p>
                <p className="text-base text-white font-medium">
                  {user?.minimumCallTime} {user?.minimumCallTime === 1 ? 'minute' : 'minutes'} minimum call
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <button
                  onClick={() => setIsBalanceCheckOpen(true)}
                  disabled={!user?.takingCams}
                  className={cn(
                    "relative group h-14 w-full flex items-center justify-center gap-3 rounded-2xl transition-all duration-300 border-none outline-none focus:outline-none focus:ring-0",
                    user?.takingCams
                      ? "bg-accent-color text-white shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.5)] hover:-translate-y-0.5 active:scale-[0.98]"
                      : "bg-[#1A1A1E] text-[#8A8C95] border border-[#2E2E32] cursor-not-allowed"
                  )}
                >
                  {user?.takingCams ? (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Icon.videoButton className="size-6" />
                      <span className="text-lg font-bold">Start Video Call</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">Not taking cams</span>
                  )}
                </button>

                <p className="text-[11px] text-[#8A8C95] text-center leading-relaxed">
                  By joining this call, you agree to our{' '}
                  <Link href="/terms-of-service" className="text-white hover:text-accent-color hover:underline transition-colors">
                    Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>
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
