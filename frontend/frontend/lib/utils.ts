import type { ThemeColors } from '@/types/theme-color-types';
import { type ClassValue, clsx } from 'clsx';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import { themeColors } from './data';
import getSymbolFromCurrency from 'currency-symbol-map';
import { getUserByIdService } from './services';
import { UserType } from '@/types/global';

export const inDevEnvironment =
  !!process && process.env.NODE_ENV === 'development';

export const formatBalance = (balance: number): string => {
  if (balance === 0) return '0';
  if (!Number.isFinite(balance)) return '0';

  const absBalance = Math.abs(balance);

  if (absBalance >= 1_000_000) {
    const millions = absBalance / 1_000_000;
    return millions < 10 && millions % 1 !== 0
      ? millions.toFixed(1) + 'm'
      : Math.round(millions) + 'm';
  }

  if (absBalance >= 1_000) {
    const thousands = absBalance / 1_000;
    return thousands < 10 && thousands % 1 !== 0
      ? thousands.toFixed(1) + 'k'
      : Math.round(thousands) + 'k';
  }

  return absBalance >= 100
    ? Math.round(absBalance).toString()
    : balance.toString();
};
export function formatEarningsAmount(amount: string) {
  const intAmount = Number(amount);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(intAmount);
}

export const generateRandomId = () => {
  return `temp_${Math.random().toString(36).substring(2, 8)}`;
};

export const getBlurredImage = (url: string, amount = 1000) => {
  return url.replace('/upload/', `/upload/e_blur:${amount}/`);
};
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function setGlobalColorTheme(
  themeMode: 'light' | 'dark',
  themeColor: ThemeColors,
) {
  const theme = themeColors[themeColor][themeMode] as {
    [key: string]: string;
  };

  for (const key in theme) {
    document.documentElement.style.setProperty(`--${key}`, theme[key]);
  }
}

export const isEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatDistanceForTweet = (fomattedDate: string) => {
  const [amount, unit] = fomattedDate.split(' ');
  return `${amount}${unit[0]}`;
};

export const getSectionLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMMM d, yyyy');
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export function formatTwitterDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  }

  return format(date, 'MMM d');
}

/**
 * Converts an ISO timestamp string to a human-readable relative time format
 * @param timestamp - ISO timestamp string (e.g., "2025-11-12T14:02:00Z")
 * @returns Relative time string (e.g., "2 hours ago", "3 minutes ago", "just now")
 */
export function formatTimeAgo(timestamp: string | undefined | null): string {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const now = new Date();

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  // For very recent times (less than 1 minute), return "just now"
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Use date-fns formatDistanceToNow for natural language relative time
  // Remove "about " prefix from the result
  return formatDistanceToNow(date, { addSuffix: true }).replace(/^about /i, '');
}

export const getUserDiscordAvatar = ({
  discordId,
  discordAvatar,
}: {
  discordId?: string | null;
  discordAvatar?: string | null;
}) => {
  const normalizedDiscordId = `${discordId ?? ''}`.trim();
  const normalizedDiscordAvatar = `${discordAvatar ?? ''}`.trim();
  const isValidDiscordSnowflake = /^\d{17,20}$/.test(normalizedDiscordId);
  const isValidDiscordAvatarHash = /^[a-f0-9]{32}$/i.test(
    normalizedDiscordAvatar,
  );

  if (!isValidDiscordSnowflake || !isValidDiscordAvatarHash) {
    return '/user.svg';
  }

  return `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
};

export const formatCallTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

export function formatCurrency(currencyCode = 'USD') {
  const symbol = getSymbolFromCurrency(currencyCode);
  if (!symbol) return currencyCode;
  return symbol;
}


export const convertCurrencyToNumber = (currency: string): number => {
  const plainNumberString = currency.replace(/[^0-9.-]+/g, '');
  const plainNumber = Number(plainNumberString);
  return plainNumber;
};
export const convertCurrencyToString = (currency: string): string => {
  const plainNumberString = currency.replace(/[^0-9.-]+/g, '');
  return plainNumberString;
};

export const formatCompactNumber = (value: number, decimals = 2): string => {
  const abs = Math.abs(value);
  if (abs < 1000) return String(value);
  const units = [
    { v: 1_000_000_000, s: 'b' },
    { v: 1_000_000, s: 'm' },
    { v: 1_000, s: 'k' },
  ];
  for (const { v, s } of units) {
    if (abs >= v) {
      const formatted = (value / v).toFixed(decimals);
      // remove trailing zeros and optional dot
      const trimmed = formatted
        .replace(/\.0+$/, '')
        .replace(/(\.[1-9]*?)0+$/, '$1');
      return trimmed + s;
    }
  }
  return String(value);
};

export function pushUrl(
  url: string,
  router?: { push: (url: string, opts?: { scroll?: boolean }) => void },
) {
  if (typeof window !== 'undefined' && window.history?.pushState) {
    window.history.pushState({}, '', url);
    return;
  }
  router?.push(url, { scroll: false });
}

export function replaceUrl(
  url: string,
  router?: { replace: (url: string, opts?: { scroll?: boolean }) => void },
) {
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    window.history.replaceState({}, '', url);
    return;
  }
  if (router && typeof (router as any).replace === 'function') {
    (router as any).replace(url, { scroll: false });
  }
}

// Emoji utilities with aggressive optimizations
// Simplified emoji regex for better performance
const simpleEmojiRegex =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

// Cache for emoji checks to avoid repeated regex operations
const emojiCache = new Map<string, { isOnly: boolean; count: number }>();
const MAX_CACHE_SIZE = 50; // Reduced cache size

function getEmojiInfo(text: string): { isOnly: boolean; count: number } {
  // Return early for empty text
  if (!text || text.length === 0) {
    return { isOnly: false, count: 0 };
  }

  // Don't process text longer than 20 characters for performance
  if (text.length > 20) {
    return { isOnly: false, count: 0 };
  }

  // Check cache first
  if (emojiCache.has(text)) {
    const cached = emojiCache.get(text);
    if (cached) return cached;
  }

  // Ultra-fast check: if text contains common non-emoji characters, bail early
  if (/[a-zA-Z0-9\s.,!?;:]/.test(text) && text.length > 3) {
    const result = { isOnly: false, count: 0 };
    return result; // Don't cache mixed content
  }

  // Count emojis using simplified regex
  const matches = text.match(simpleEmojiRegex);
  const count = matches ? matches.length : 0;

  // Quick check: if no emojis found, return early
  if (count === 0) {
    const result = { isOnly: false, count: 0 };
    if (emojiCache.size < MAX_CACHE_SIZE) {
      emojiCache.set(text, result);
    }
    return result;
  }

  // Check if only emojis (whitespace is ok)
  const withoutEmojis = text.replace(simpleEmojiRegex, '').trim();
  const isOnly = withoutEmojis.length === 0;

  const result = { isOnly, count };

  // Cache the result only for pure emoji text
  if (isOnly && emojiCache.size < MAX_CACHE_SIZE) {
    emojiCache.set(text, result);
  }

  return result;
}

export function isOnlyEmojis(text: string): boolean {
  return getEmojiInfo(text).isOnly;
}

export function countEmojis(text: string): number {
  return getEmojiInfo(text).count;
}

export function getEmojiSizeClass(text: string): string {
  const info = getEmojiInfo(text);

  if (!info.isOnly) return '';

  if (info.count === 1) {
    return '!text-[80px] !leading-[80px]';
  }
  if (info.count === 2) {
    return '!text-[48px] !leading-[48px]';
  }
  if (info.count === 3) {
    return '!text-base !leading-normal';
  }

  return '';
}

export function getEmojiInlineStyle(text: string): React.CSSProperties {
  const info = getEmojiInfo(text);

  if (!info.isOnly) return {};

  if (info.count === 1) {
    return { fontSize: '80px', lineHeight: '80px' };
  }
  if (info.count === 2) {
    return { fontSize: '48px', lineHeight: '48px' };
  }
  if (info.count === 3) {
    return { fontSize: '16px', lineHeight: 'normal' };
  }

  return {};
}

export const getProxiedMediaUrl = (
  mediaId?: string,
  originalUrl?: string,
): string => {
  if (mediaId) {
    return `https://api.discreet.fans/api/media/${mediaId}`;
  }
  return originalUrl || '';
};

export const getUserFromID = async (id: string): Promise<UserType> => {
  const response = await getUserByIdService(id);

  console.log('response', response);
  return response.data;
};
