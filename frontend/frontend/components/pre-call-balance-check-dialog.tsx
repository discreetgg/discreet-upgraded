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
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-[#2E2E32] bg-[#0A0A0B] rounded-[32px] shadow-2xl outline-none">
        <div className="p-8">
          {checkState === 'loading' && (
            <div className="flex flex-col items-center gap-8 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-accent-color/20 blur-2xl rounded-full" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#1A1A1E] border border-[#2E2E32]">
                  <Icon.loadingIndicator className="w-10 h-10 text-accent-color animate-spin" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Verifying Balance
                </h2>
                <p className="text-[13px] text-[#8A8C95] leading-relaxed max-w-[240px] mx-auto">
                  Ensuring you have enough credits to connect with {seller?.displayName}...
                </p>
              </div>

              <div className="w-full space-y-4 bg-[#161618]/50 rounded-2xl p-6 border border-[#2E2E32]/50">
                <div className="flex items-center justify-between opacity-40">
                  <Skeleton className="h-4 w-24 bg-[#2E2E32]" />
                  <Skeleton className="h-4 w-12 bg-[#2E2E32]" />
                </div>
                <div className="flex items-center justify-between opacity-40">
                  <Skeleton className="h-4 w-28 bg-[#2E2E32]" />
                  <Skeleton className="h-4 w-16 bg-[#2E2E32]" />
                </div>
              </div>
            </div>
          )}

          {checkState === 'sufficient' && (
            <div className="flex flex-col items-center gap-8 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Icon.tickCircle className="w-10 h-10 text-emerald-500" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Balance Verified
                </h2>
                <p className="text-[13px] text-emerald-500/80 font-medium">
                  Preparing your secure connection...
                </p>
              </div>
            </div>
          )}

          {checkState === 'insufficient' && (
            <div className="flex flex-col items-center gap-8 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20">
                  <Icon.callEnded className="w-10 h-10 text-red-500" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Top-up Required
                </h2>
                <p className="text-[13px] text-[#8A8C95] leading-relaxed">
                  Your current balance of <span className="text-white font-bold">${balance.toFixed(2)}</span> is below the minimum required for this call.
                </p>
              </div>

              <div className="w-full space-y-3 bg-[#161618]/50 rounded-2xl p-5 border border-[#2E2E32]/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8A8C95]">Minimum Required</span>
                  <span className="text-sm font-bold text-white">${requiredAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400 font-medium">Amount Needed</span>
                  <span className="text-sm font-bold text-red-400">${shortfall.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-[#2E2E32]/50 mt-1" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#8A8C95]">Call Rate</span>
                  <span className="text-xs text-white/60">${callRate.toFixed(2)} / min</span>
                </div>
              </div>

              <div className="w-full space-y-4 pt-2">
                <Button
                  onClick={handleFundWallet}
                  className="w-full h-14 bg-accent-color hover:bg-accent-color/90 text-white rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(255,0,127,0.3)] border-0"
                >
                  <Icon.fundWallet className="w-5 h-5 mr-3" />
                  Add Credits
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="w-full h-12 text-[#8A8C95] hover:text-white hover:bg-white/5 rounded-xl font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
