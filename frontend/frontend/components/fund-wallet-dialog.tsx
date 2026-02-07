'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { FundAccount } from './fund-account';
import { FundMessage } from './fund-message';
import { Icon } from './ui/icons';
import { useWallet } from '@/context/wallet-context-provider';
import { Button } from '@/components/ui/button';

export const FundWalletDialog = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { step, setStep, isFundWalletDialogOpen, setIsFundWalletDialogOpen } = useWallet();

  return (
    <Dialog
      open={isFundWalletDialogOpen}
      onOpenChange={(open) => {
        setIsFundWalletDialogOpen(open);
        if (!open) {
          setStep('form'); // Reset to form when dialog closes
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {step === 'form' && <FundAccount />}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Icon.loadingIndicator className="animate-spin h-8 w-8 text-pink-500" />
            <p className="text-sm text-white">Processing your request...</p>
          </div>
        )}

        {step === 'message' && (
          <FundMessage
            title="You've successfully added X Amount to your wallet."
            description="Thank you for topping up! You're now ready to unlock content and interact with your favorite creators."
            action="Continue to Marketplace"
            icon={Icon.tickCircle}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
