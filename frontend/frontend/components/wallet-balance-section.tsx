'use client';

import { useEffect } from 'react';
import { FundWalletDialog } from './fund-wallet-dialog';
import { getWalletService } from '@/lib/services';
import { useGlobal } from '@/context/global-context-provider';
import { formatCurrency } from '@/lib/utils';
import { useWallet } from '@/context/wallet-context-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';

export const WalletBalanceSection = () => {
  const { user } = useGlobal();
  const { wallet, setWallet } = useWallet();

  useEffect(() => {
    if (!user?.discordId) return;
    (async () => {
      await getWalletService(user.discordId)
        .then((res) => {
          setWallet(res);
        })
        .catch((e) => console.error(e));
    })();
  }, [user?.discordId, setWallet]);

  return (
    <div className="space-y-[17px] stickyx h-max top-0 bg-background py-6 z-30">
      <div className="space-y-2">
        <h1 className="text-2xl font-extralight  text-[#8A8C95] ">Balance</h1>
        {wallet ? (
          <p className="text-[#F8F8F8] text-2xl font-medium">
            {formatCurrency(wallet.currency)}
            {wallet.balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : (
          <Skeleton className="h-8 w-40 bg-[#1E1E21]" />
        )}
      </div>
      <FundWalletDialog>
        <Button className="rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]">
          Fund wallet
        </Button>
      </FundWalletDialog>
    </div>
  );
};
