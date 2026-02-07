'use client';

import { WalletType } from '@/types/global';
import type React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type WalletContextValue = {
  wallet: WalletType | null;
  setWallet: React.Dispatch<React.SetStateAction<WalletType | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  step: 'form' | 'loading' | 'message';
  setStep: React.Dispatch<React.SetStateAction<'form' | 'loading' | 'message'>>;
  loading: boolean;
  isFundWalletDialogOpen: boolean;
  setIsFundWalletDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const storageKey = 'root:wallet';

const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const didHydrate = useRef(false);

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [step, setStep] = useState<'form' | 'loading' | 'message'>('form');
  const [isFundWalletDialogOpen, setIsFundWalletDialogOpen] = useState(false);

  // Auto-reset step to 'form' when dialog opens
  useEffect(() => {
    if (isFundWalletDialogOpen) {
      setStep('form');
    }
  }, [isFundWalletDialogOpen]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
      } catch (err) {
        console.error('Failed to parse auth state:', err);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify({}));
  }, []);

  const value = useMemo(
    () => ({
      loading,
      wallet,
      setWallet,
      setLoading,
      step,
      setStep,
      isFundWalletDialogOpen,
      setIsFundWalletDialogOpen,
    }),
    [loading, wallet, step, isFundWalletDialogOpen]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  return ctx;
};

export default WalletContextProvider;
