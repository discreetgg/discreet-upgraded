'use client';

import type { NotificationFormSchema } from '@/components/settings-notifications-content';
import type { EditProfileFormSchema } from '@/components/settings-profile-content';
import { getUserService, logoutUserService } from '@/lib/services';
import type { SubscriptionPlanType, Tag, UserType } from '@/types/global';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { useAuth } from './auth-context-provider';
import { useRouter } from 'next/navigation';

type GlobalContextValue = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  profileSettingForm: UseFormReturn<
    z.infer<typeof EditProfileFormSchema>
  > | null;
  setProfileSettingForm: (
    form: UseFormReturn<z.infer<typeof EditProfileFormSchema>> | null
  ) => void;
  notificationForm: UseFormReturn<
    z.infer<typeof NotificationFormSchema>
  > | null;
  setNotificationForm: (
    form: UseFormReturn<z.infer<typeof NotificationFormSchema>> | null
  ) => void;
  subscriptionPlans: SubscriptionPlanType[] | null;
  setSubscriptionPlans: (plans: SubscriptionPlanType[] | null) => void;
  showExplicitContent?: boolean;
  setShowExplicitContent?: (show: boolean) => void;

  generalCategories: Tag[] | null;
  setGeneralCategories: (categories: Tag[] | null) => void;
  handleLogout: () => void;
};

const GlobalContext = createContext<GlobalContextValue | null>(null);

const storageKey = 'root:global';
const manualLogoutKey = 'manual_logout';

const hasManualLogoutMarker = () => {
  if (typeof window === 'undefined') return false;
  const cookieMarker = document.cookie
    .split('; ')
    .some((cookie) => cookie === `${manualLogoutKey}=1`);
  const localMarker = localStorage.getItem(manualLogoutKey) === '1';
  return cookieMarker || localMarker;
};

const GlobalContextProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserType | null;
}) => {
  const didHydrate = useRef(false);
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();

  // Initialize user from server-provided data
  const [user, setUser] = useState<UserType | null>(initialUser ?? null);
  const [profileSettingForm, setProfileSettingForm] = useState<UseFormReturn<
    z.infer<typeof EditProfileFormSchema>
  > | null>(null);
  const [notificationForm, setNotificationForm] = useState<UseFormReturn<
    z.infer<typeof NotificationFormSchema>
  > | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlanType[] | null
  >(null);
  const [showExplicitContent, setShowExplicitContent] = useState<boolean>(true);
  const [generalCategories, setGeneralCategories] = useState<Tag[] | null>(
    null
  ); // if we need general categories is empty use addItemsTags

  // Helper function to set Discord ID cookie
  const setDiscordIdCookie = useCallback(async (discordId: string) => {
    try {
      await fetch('/api/auth/set-discord-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discordId }),
      });
    } catch (error) {
      console.error('Failed to set Discord ID cookie:', error);
    }
  }, []);

  const clearDiscordIdCookie = useCallback(async () => {
    try {
      await fetch('/api/auth/set-discord-id', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to clear Discord ID cookie:', error);
    }
  }, []);

  // Update user state when initialUser changes (e.g., on server-side navigation)
  useEffect(() => {
    if (hasManualLogoutMarker()) {
      return;
    }

    if (initialUser) {
      setUser(initialUser);
      setIsAuthenticated(true);
      if (initialUser.discordId) {
        setDiscordIdCookie(initialUser.discordId);
      }
    }
  }, [initialUser, setIsAuthenticated, setDiscordIdCookie]);

  // Hydrate user and settings from localStorage
  useEffect(() => {
    if (hasManualLogoutMarker()) {
      return;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Restore user data if it exists
        if (parsed?.user && !user) {
          setUser(parsed.user);
          // Save Discord ID to cookie when restoring from localStorage
          if (parsed.user.discordId) {
            setDiscordIdCookie(parsed.user.discordId);
          }
        }

        // Restore showExplicitContent and other non-user settings
        if (parsed?.showExplicitContent !== undefined) {
          setShowExplicitContent(parsed.showExplicitContent);
        }
      } catch (err) {
        console.error('Failed to parse global state:', err);
      }
    }
  }, []);

  // Fetch user on mount if we don't have user data (initialUser or localStorage)
  useEffect(() => {
    const fetchUserOnMount = async () => {
      if (hasManualLogoutMarker()) {
        setIsAuthenticated(false);
        return;
      }

      // Only fetch if we don't have user data from server or localStorage
      if (!user && !initialUser) {
        try {
          const response = await getUserService();
          if (response?.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            // Save Discord ID to cookie
            if (response.data.discordId) {
              await setDiscordIdCookie(response.data.discordId);
            }
          }
        } catch (error: any) {
          const status = error?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('root:auth');
            setIsAuthenticated(false);
            return;
          }

          // Keep production console clean for guest/offline sessions.
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to fetch user on mount:', error);
          }
        }
      }
    };

    fetchUserOnMount();
  }, [user, initialUser, setIsAuthenticated, setDiscordIdCookie]);

  // Save Discord ID to cookie whenever user changes
  useEffect(() => {
    if (user?.discordId) {
      setDiscordIdCookie(user.discordId);
    }
  }, [user?.discordId, setDiscordIdCookie]);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        user,
        showExplicitContent,
      })
    );
  }, [user, showExplicitContent]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUserService();
    } catch (error) {
      // Logout API may fail, but we still want to clear local state
      console.error('Logout API error:', error);
    } finally {
      await clearDiscordIdCookie();
      setUser(null);
      setIsAuthenticated(false);
      // Clear entire localStorage to remove any persisted state for guest mode
      localStorage.clear();
      localStorage.setItem(manualLogoutKey, '1');

      // Best-effort cleanup for client-visible cookies.
      const expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `auth_token=; ${expires}`;
      document.cookie = `refresh_token=; ${expires}`;
      document.cookie = `discord_id=; ${expires}`;
      document.cookie = `bp_token=; ${expires}`;
      document.cookie = `${manualLogoutKey}=1; path=/; max-age=604800; samesite=lax`;

      // Always redirect to /auth page on logout
      router.replace('/auth');
      router.refresh();
    }
  }, [clearDiscordIdCookie, setIsAuthenticated, router]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      profileSettingForm,
      setProfileSettingForm,
      notificationForm,
      setNotificationForm,
      subscriptionPlans,
      setSubscriptionPlans,
      showExplicitContent,
      handleLogout,
      setShowExplicitContent,
      generalCategories,
      setGeneralCategories,
    }),
    [
      user,
      profileSettingForm,
      notificationForm,
      subscriptionPlans,
      handleLogout,
      showExplicitContent,
      generalCategories,
    ]
  );

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) {
    throw new Error('useGlobal must be used within a GlobalContextProvider');
  }
  return ctx;
};

export default GlobalContextProvider;
