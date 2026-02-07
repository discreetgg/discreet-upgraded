'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/context/wallet-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getWalletService } from '@/lib/services';
import type { UserType } from '@/types/global';

type PreCallBalanceCheckDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: UserType | null;
  onProceed: () => void;
};

type BalanceCheckState = 'loading' | 'sufficient' | 'insufficient';

export const PreCallBalanceCheckDialog = ({
  open,
  onOpenChange,
  seller,
  onProceed,
}: PreCallBalanceCheckDialogProps) => {
  const { user } = useGlobal();
  const { wallet, setWallet, setIsFundWalletDialogOpen } = useWallet();

  const [checkState, setCheckState] = useState<BalanceCheckState>('loading');
  const [balance, setBalance] = useState<number>(0);
  const [requiredAmount, setRequiredAmount] = useState<number>(0);
  const [shortfall, setShortfall] = useState<number>(0);

  const callRate = seller?.callRate ?? 0;
  const minimumCallTime = seller?.minimumCallTime ?? 1;

  // Calculate required amount and check balance
  const checkBalance = useCallback(async () => {
    if (!user?.discordId || !seller) {
      return;
    }

    setCheckState('loading');

    try {
      // Fetch latest wallet balance
      const walletData = await getWalletService(user.discordId);
      if (walletData) {
        setWallet(walletData);
        setBalance(walletData.balance);
      }

      const currentBalance = walletData?.balance ?? 0;
      const required = callRate * minimumCallTime;

      setRequiredAmount(required);
      setShortfall(Math.max(0, required - currentBalance));

      if (currentBalance >= required) {
        setCheckState('sufficient');
        // Auto-proceed after a short delay to show the check passed
        setTimeout(() => {
          onOpenChange(false);
          onProceed();
        }, 800);
      } else {
        setCheckState('insufficient');
      }
    } catch (error) {
      console.error('[PreCallBalanceCheck] Failed to check balance:', error);
      // If we can't check, let the call proceed - the backend will handle it
      setCheckState('sufficient');
      setTimeout(() => {
        onOpenChange(false);
        onProceed();
      }, 500);
    }
  }, [
    user?.discordId,
    seller,
    callRate,
    minimumCallTime,
    setWallet,
    onOpenChange,
    onProceed,
  ]);

  // Check balance when dialog opens
  useEffect(() => {
    if (open && seller) {
      checkBalance();
    }
  }, [open, seller, checkBalance]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCheckState('loading');
    }
  }, [open]);

  const handleFundWallet = () => {
    onOpenChange(false);
    setIsFundWalletDialogOpen(true);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {checkState === 'loading' && (
          <div className="flex flex-col items-center gap-6 py-8">
            {/* Loading spinner */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1F2227]">
              <Icon.loadingIndicator className="w-8 h-8 text-[#FF007F] animate-spin" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#D4D4D8]">
                Checking Balance
              </h2>
              <p className="text-sm text-[#71717A] mt-2">
                Verifying you have enough credits for this call...
              </p>
            </div>

            {/* Skeleton details */}
            <div className="w-full space-y-3 bg-[#0F1114] rounded-lg p-4 border border-[#1E1E21]">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-[#1F2227]" />
                <Skeleton className="h-4 w-20 bg-[#1F2227]" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 bg-[#1F2227]" />
                <Skeleton className="h-4 w-16 bg-[#1F2227]" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-[#1F2227]" />
                <Skeleton className="h-4 w-24 bg-[#1F2227]" />
              </div>
            </div>
          </div>
        )}

        {checkState === 'sufficient' && (
          <div className="flex flex-col items-center gap-6 py-8">
            {/* Success icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#22C55E]/10">
              <Icon.tickCircle className="w-8 h-8 text-[#22C55E]" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#D4D4D8]">
                Balance Verified
              </h2>
              <p className="text-sm text-[#71717A] mt-2">
                Starting your call...
              </p>
            </div>
          </div>
        )}

        {checkState === 'insufficient' && (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Warning icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#EF4444]/10">
              <Icon.callEnded className="w-8 h-8" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#D4D4D8]">
                Insufficient Balance
              </h2>
              <p className="text-sm text-[#71717A] mt-2">
                You don&apos;t have enough credits to cover the minimum call
                time.
              </p>
            </div>

            {/* Balance Details */}
            <div className="w-full space-y-3 bg-[#0F1114] rounded-lg p-4 border border-[#1E1E21]">
              {/* Current Balance */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71717A]">Your Balance</span>
                <span className="text-sm font-medium text-[#D4D4D8]">
                  ${balance.toFixed(2)}
                </span>
              </div>

              {/* Call Rate */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71717A]">Call Rate</span>
                <span className="text-sm font-medium text-[#D4D4D8]">
                  ${callRate.toFixed(2)}/min
                </span>
              </div>

              {/* Minimum Time */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71717A]">Minimum Time</span>
                <span className="text-sm font-medium text-[#D4D4D8]">
                  {minimumCallTime}{' '}
                  {minimumCallTime === 1 ? 'minute' : 'minutes'}
                </span>
              </div>

              <div className="border-t border-[#1E1E21] my-2" />

              {/* Required Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#D4D4D8]">
                  Minimum Required
                </span>
                <span className="text-base font-semibold text-[#D4D4D8]">
                  ${requiredAmount.toFixed(2)}
                </span>
              </div>

              {/* Shortfall */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#EF4444]">Amount Needed</span>
                <span className="text-sm font-semibold text-[#EF4444]">
                  ${shortfall.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <Button
                onClick={handleFundWallet}
                className="w-full bg-[#FF007F] hover:bg-[#FF007F]/90 text-white border-0"
              >
                <Icon.fundWallet className="w-4 h-4 mr-2" />
                Fund Wallet
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full bg-[#1F2227] hover:bg-[#2A2D33] text-[#D4D4D8] border border-[#1E1E21]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
