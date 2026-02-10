'use client';

import { useGlobal } from '@/context/global-context-provider';
import { useSocket } from '@/context/socket-context';
import { useWallet } from '@/context/wallet-context-provider';
import { useAlertPreferences } from '@/context/alert-preferences-context';
import { toastPresets } from '@/lib/toast-presets';
import type { NotificationType } from '@/types/global';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const BURST_WINDOW_MS = 3500;
const SOUND_THROTTLE_MS = 8000;

type TipBurstState = {
  count: number;
  amount: number;
  senders: Set<string>;
  lastAt: number;
};

type MenuBurstState = {
  count: number;
  senders: Set<string>;
  lastAt: number;
};

const formatUsdAmount = (amount: number) => {
  const hasDecimals = !Number.isInteger(amount);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

const parseAmount = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
};

const buildSenderLabel = (senders: Set<string>) => {
  const senderList = Array.from(senders);
  if (senderList.length === 0) return 'A supporter';
  if (senderList.length === 1) return `@${senderList[0]}`;
  return `${senderList.length} supporters`;
};

const playSoftRewardChime = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.connect(context.destination);

    const start = context.currentTime + 0.01;
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.06, start + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);

    const playTone = (frequency: number, toneStart: number, duration: number) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, toneStart);
      gainNode.gain.setValueAtTime(0.0001, toneStart);
      gainNode.gain.exponentialRampToValueAtTime(0.9, toneStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration);
      oscillator.connect(gainNode);
      gainNode.connect(master);
      oscillator.start(toneStart);
      oscillator.stop(toneStart + duration + 0.02);
    };

    playTone(523.25, start, 0.2);
    playTone(659.25, start + 0.16, 0.22);

    window.setTimeout(() => {
      context.close().catch(() => {});
    }, 900);
  } catch (error) {
    // No-op when browser blocks autoplayed audio.
  }
};

export const LivePaymentAlerts = () => {
  const { user } = useGlobal();
  const { newNotifications } = useSocket();
  const { setWallet } = useWallet();
  const { liveAlertsEnabled, alertSoundsEnabled } = useAlertPreferences();
  const seenNotificationsRef = useRef<Set<string>>(new Set());
  const tipBurstRef = useRef<TipBurstState | null>(null);
  const menuBurstRef = useRef<MenuBurstState | null>(null);
  const lastSoundAtRef = useRef<number>(0);

  const playRevenueSound = (now: number) => {
    if (!alertSoundsEnabled || !liveAlertsEnabled) {
      return;
    }

    if (now - lastSoundAtRef.current < SOUND_THROTTLE_MS) {
      return;
    }

    playSoftRewardChime();
    lastSoundAtRef.current = now;
  };

  useEffect(() => {
    if (!newNotifications?._id) {
      return;
    }

    if (seenNotificationsRef.current.has(newNotifications._id)) {
      return;
    }

    seenNotificationsRef.current.add(newNotifications._id);
    if (seenNotificationsRef.current.size > 500) {
      const firstSeen = seenNotificationsRef.current.values().next().value;
      if (firstSeen) {
        seenNotificationsRef.current.delete(firstSeen);
      }
    }

    // Skip self-originated events. Local action toasts already cover this path.
    if (newNotifications.sender?.discordId === user?.discordId) {
      return;
    }

    const now = Date.now();
    const senderName = newNotifications.sender?.username ?? '';

    const amount = parseAmount(newNotifications.metadata?.amount);
    if (amount !== null && amount > 0) {
      setWallet((previousWallet) => {
        if (!previousWallet) {
          return previousWallet;
        }

        return {
          ...previousWallet,
          balance: previousWallet.balance + amount,
        };
      });
    }

    if (!liveAlertsEnabled) {
      return;
    }

    if (newNotifications.entityType === 'Tip') {
      const previousTipBurst = tipBurstRef.current;
      const isBurst =
        previousTipBurst !== null && now - previousTipBurst.lastAt <= BURST_WINDOW_MS;
      const nextTipBurst: TipBurstState = isBurst
        ? {
            ...previousTipBurst,
            count: previousTipBurst.count + 1,
            amount: previousTipBurst.amount + (amount ?? 0),
            senders: new Set(previousTipBurst.senders),
            lastAt: now,
          }
        : {
            count: 1,
            amount: amount ?? 0,
            senders: new Set<string>(),
            lastAt: now,
          };

      if (senderName) {
        nextTipBurst.senders.add(senderName);
      }

      tipBurstRef.current = nextTipBurst;
      playRevenueSound(now);

      const senderLabel = buildSenderLabel(nextTipBurst.senders);
      const tipTitle =
        nextTipBurst.amount > 0 ? (
          <span>
            {nextTipBurst.count > 1 ? 'Tips received:' : 'Tip received:'}{' '}
            <span className="app-toast__amount">+${formatUsdAmount(nextTipBurst.amount)}</span>
          </span>
        ) : nextTipBurst.count > 1 ? (
          `Tips received (${nextTipBurst.count})`
        ) : (
          'Tip received'
        );

      const tipDescription =
        nextTipBurst.count > 1
          ? `${senderLabel} sent ${nextTipBurst.count} new tips.`
          : `${senderLabel} sent you a tip.`;

      toast.success(tipTitle, {
        ...toastPresets.revenue,
        id: 'live-payment-tip-burst',
        description: tipDescription,
      });
      return;
    }

    if (newNotifications.entityType === 'MenuPurchase') {
      const previousMenuBurst = menuBurstRef.current;
      const isBurst =
        previousMenuBurst !== null && now - previousMenuBurst.lastAt <= BURST_WINDOW_MS;
      const nextMenuBurst: MenuBurstState = isBurst
        ? {
            ...previousMenuBurst,
            count: previousMenuBurst.count + 1,
            senders: new Set(previousMenuBurst.senders),
            lastAt: now,
          }
        : {
            count: 1,
            senders: new Set<string>(),
            lastAt: now,
          };

      if (senderName) {
        nextMenuBurst.senders.add(senderName);
      }

      menuBurstRef.current = nextMenuBurst;
      playRevenueSound(now);

      const senderLabel = buildSenderLabel(nextMenuBurst.senders);
      const purchaseTitle =
        nextMenuBurst.count > 1
          ? `Bundles purchased (${nextMenuBurst.count})`
          : 'Bundle purchased';
      const purchaseDescription =
        nextMenuBurst.count > 1
          ? `${senderLabel} completed ${nextMenuBurst.count} bundle purchases.`
          : `${senderLabel} purchased your bundle.`;

      toast.success(purchaseTitle, {
        ...toastPresets.revenue,
        id: 'live-payment-menu-burst',
        description: purchaseDescription,
      });
    }
  }, [
    alertSoundsEnabled,
    liveAlertsEnabled,
    newNotifications,
    setWallet,
    user?.discordId,
  ]);

  return null;
};
