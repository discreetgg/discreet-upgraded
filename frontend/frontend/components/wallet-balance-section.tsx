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
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1E21] to-[#0A0A0B] border border-[#2E2E32] rounded-[24px] p-6 mb-8 group transition-all duration-500 hover:border-[#3F3F46]">
      {/* Decorative background elements */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-accent-color/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-blue-500/5 rounded-full blur-[60px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-accent-color uppercase tracking-wider bg-accent-color/10 px-2 py-0.5 rounded-md">
              Total Assets
            </span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-[#8A8C95] text-sm font-medium">Available Balance</h2>
            {wallet ? (
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[#F8F8F8] text-4xl font-bold tracking-tight">
                  {formatCurrency(wallet.currency)}
                  {wallet.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[#8A8C95] text-sm font-medium">USD</span>
              </div>
            ) : (
              <Skeleton className="h-10 w-48 bg-[#1E1E21] mt-2 rounded-lg" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FundWalletDialog>
            <Button className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-2">
              <span className="text-xl">+</span>
              Fund Wallet
            </Button>
          </FundWalletDialog>
        </div>
      </div>
    </div>
  );
};
