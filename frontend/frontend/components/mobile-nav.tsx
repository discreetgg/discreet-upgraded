'use client';

import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { useWallet } from '@/context/wallet-context-provider';
import { getWalletService } from '@/lib/services';
import { sidebarData } from '@/lib/data';
import { cn, inDevEnvironment } from '@/lib/utils';
import type { SidebarItemType } from '@/types/global';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui/icons';
import { ContentCreatorAddPostDialog } from './content-creator-add-post-dialog';
import { useNotifications } from '@/hooks/queries/use-notifications';
import { useEffect, useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from './user-avatar';

// Format balance to show m for millions, k for thousands with smart precision
const formatBalance = (balance: number): string => {
  if (balance === 0) return '0';
  if (!Number.isFinite(balance)) return '0';

  const absBalance = Math.abs(balance);

  if (absBalance >= 1000000) {
    const millions = absBalance / 1000000;
    // Show decimal only if < 10 and has meaningful decimals
    return millions < 10 && millions % 1 !== 0
      ? millions.toFixed(1) + 'm'
      : Math.round(millions) + 'm';
  }

  if (absBalance >= 1000) {
    const thousands = absBalance / 1000;
    // Show decimal only if < 10 and has meaningful decimals
    return thousands < 10 && thousands % 1 !== 0
      ? thousands.toFixed(1) + 'k'
      : Math.round(thousands) + 'k';
  }

  // For values less than 1000, show full number or abbreviate if > 100
  return absBalance >= 100
    ? Math.round(absBalance).toString()
    : balance.toString();
};

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { user, handleLogout } = useGlobal();
  const { wallet, setWallet } = useWallet();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const { data: notifications } = useNotifications({
    userId: user?.discordId || '',
    page: 1,
  });

  // Fetch wallet balance on mount and when user changes
  useEffect(() => {
    if (!user?.discordId) return;

    (async () => {
      try {
        const walletData = await getWalletService(user.discordId);
        setWallet(walletData);
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      }
    })();
  }, [user?.discordId, setWallet]);

  // Hide mobile nav on individual message pages
  const isMessagePage =
    pathname.startsWith('/messages/') && pathname !== '/messages';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Hide nav when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // Show nav after user stops scrolling for 150ms
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const shouldShowItem = (item: SidebarItemType) => {
    if (!isAuthenticated) {
      return item.isPublic;
    }

    return (
      item?.role === 'all' || item?.role === user?.role || inDevEnvironment
    );
  };

  // Get main navigation items for mobile
  const getMainNavItems = () => {
    const items = sidebarData.main.filter(shouldShowItem);

    // For sellers, replace bookmarks with earnings
    if (user?.role === 'seller') {
      const earningsItem = sidebarData.creator.find(
        (item) => item.name === 'Earnings'
      );
      if (earningsItem) {
        const bookmarkIndex = items.findIndex(
          (item) => item.name === 'Bookmarks'
        );
        if (bookmarkIndex !== -1) {
          items[bookmarkIndex] = earningsItem;
        }
      }
    }

    // Return items: for sellers (Home, Messages, Earnings), for others (Home, Messages, Bookmarks)
    // Wallet is filtered out in render, so we need to slice to 4 to include Bookmarks/Earnings (which is at index 3 after Home, Messages, Wallet)
    return items.slice(0, 4);
  };

  const mainNavItems = getMainNavItems();

  if (isMessagePage) {
    return null;
  }

  return (
    <>
      <nav
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0B] border-t border-[#1E2227] pb-safe transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {mainNavItems
            .filter((item) => item.name.toLowerCase() !== 'wallet')
            .map((item) => {
              const active = pathname === item.url;
              return (
                <Link
                  key={item.name}
                  href={item.url}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[64px] relative',
                    active
                      ? 'text-white'
                      : 'text-[#8A8C95] hover:text-[#D4D4D8] active:scale-95'
                  )}
                >
                  {item.name.toLowerCase() === 'notifications' &&
                    notifications?.unreadCount &&
                    notifications.unreadCount > 0 && (
                      <div className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#FF007F] flex items-center justify-center text-[8px] text-white font-medium">
                        {notifications.unreadCount > 9
                          ? '9+'
                          : notifications.unreadCount}
                      </div>
                    )}
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-300',
                      active
                        ? 'bg-[#FF007F]/10 shadow-sm'
                        : 'hover:bg-[#1E2227]/50'
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        stroke={active ? '#FF007F' : 'currentColor'}
                        className="size-5"
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors duration-300',
                      active ? 'text-[#FF007F]' : 'text-[#8A8C95]'
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          {/* Wallet Balance Display */}
          {isAuthenticated && (
            <Link href="/wallet">
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[64px] text-[#8A8C95] hover:text-[#D4D4D8] active:scale-95"
                aria-label="Wallet balance"
              >
                <div className="p-1.5 rounded-lg hover:bg-[#1E2227]/50 transition-all duration-300">
                  <span className="text-sm font-bold text-[#FF007F]">
                    ${wallet?.balance ? formatBalance(wallet.balance) : '0'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#8A8C95]">
                  Wallet
                </span>
              </button>
            </Link>
          )}
          {/* Post Button for Sellers */}
          {/* {isAuthenticated && user?.role === 'seller' && (
            <ContentCreatorAddPostDialog>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[64px] text-[#8A8C95] hover:text-[#D4D4D8] active:scale-95"
                aria-label="Create post"
              >
                <div className="p-1.5 rounded-lg hover:bg-[#1E2227]/50 transition-all duration-300">
                  <Icon.add className="size-5 text-[#FF007F]" />
                </div>
                <span className="text-[10px] font-medium text-[#8A8C95]">
                  Post
                </span>
              </button>
            </ContentCreatorAddPostDialog>
          )} */}
          {/* User Menu */}
          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-[64px] text-[#8A8C95] hover:text-[#D4D4D8] active:scale-95',
                    pathname === '/profile' || pathname === '/settings'
                      ? 'text-white'
                      : ''
                  )}
                  aria-label="User menu"
                >
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-300',
                      pathname === '/profile' || pathname === '/settings'
                        ? 'bg-[#FF007F]/10 shadow-sm'
                        : 'hover:bg-[#1E2227]/50'
                    )}
                  >
                    <UserAvatar
                      profileImage={user?.profileImage?.url}
                      discordAvatar={user?.discordAvatar ?? ''}
                      discordId={user?.discordId ?? ''}
                      width={20}
                      height={20}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors duration-300 truncate max-w-[64px]',
                      pathname === '/profile' || pathname === '/settings'
                        ? 'text-[#FF007F]'
                        : 'text-[#8A8C95]'
                    )}
                  >
                    {user?.username ? `@${user.username.length > 8 ? user.username.slice(0, 8) + '...' : user.username}` : 'Profile'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-[180px] shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0 mb-2"
                side="top"
                align="end"
                sideOffset={8}
              >
                <Link href="/profile">
                  <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
                    <Icon.profile className="size-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="my-0" />
                <Link href="/notifications">
                  <DropdownMenuItem className="flex items-center justify-between gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
                    <div className="flex items-center gap-2">
                      <Icon.notificationSquare className="size-4" />
                      Notifications
                    </div>
                    {notifications?.unreadCount && notifications.unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF007F]/10 flex items-center justify-center text-[10px] text-[#FF007F] font-medium leading-none">
                        {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="my-0" />
                {user?.role === 'seller' ? (
                  <Link href="/earnings">
                    <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
                      <Icon.earnings className="size-4" />
                      Earnings
                    </DropdownMenuItem>
                  </Link>
                ) : (
                  <Link href="/bookmarks">
                    <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
                      <Icon.bookmark className="size-4" />
                      Bookmarks
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator className="my-0" />
                <Link href="/settings">
                  <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
                    <Icon.settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-[15px] text-[#B42318] m-0 rounded-none p-4"
                >
                  <Icon.logout className="size-4" />
                  Log out
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* Floating Post Button for Sellers */}
      {isAuthenticated && user?.role === 'seller' && (
        <ContentCreatorAddPostDialog>
          <button
            type="button"
            className={cn(
              'md:hidden fixed bottom-30 right-4 z-50 w-10 h-10 rounded-full bg-[#FF007F] hover:bg-[#FF007F]/90 active:scale-95 shadow-[0_4px_12px_rgba(255,0,127,0.4)] hover:shadow-[0_6px_16px_rgba(255,0,127,0.6)] transition-all duration-300 flex items-center justify-center',
              isVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-24 opacity-0'
            )}
            aria-label="Create post"
          >
            <Icon.add className="size-4 text-white" stroke="white" />
          </button>
        </ContentCreatorAddPostDialog>
      )}
    </>
  );
}
