'use client';

import { Toaster } from '@/components/ui/sonner';
import { LivePaymentAlerts } from '@/components/live-payment-alerts';
import { AlertPreferencesProvider } from '@/context/alert-preferences-context';
import AuthContextProvider from '@/context/auth-context-provider';
import GlobalContextProvider from '@/context/global-context-provider';
import { GlobalNotificationProvider } from '@/context/global-notification-context';
import { SocketContextProvider } from '@/context/socket-context';
import { ThemeModeProvider } from '@/context/theme-mode-provider';
import CallContextProvider from '@/context/call-context';
import MessageContextProvider from '@/context/message-context';
import { getQueryClient } from '@/lib/get-query-client';
import { ProgressProvider } from '@bprogress/next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import WalletContextProvider from '@/context/wallet-context-provider';
import type { UserType } from '@/types/global';
import dynamic from 'next/dynamic';

// Lazy load CallSheet - only loads when needed (when there's an active call)
const CallSheet = dynamic(
  () =>
    import('@/components/call-sheet').then((mod) => ({
      default: mod.CallSheet,
    })),
  {
    ssr: false,
  }
);

export const Providers = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: UserType | null;
}) => {
  const queryClient = getQueryClient();

  return (
    <AuthContextProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalContextProvider initialUser={initialUser}>
          <AlertPreferencesProvider>
            <GlobalNotificationProvider>
              <SocketContextProvider>
                <MessageContextProvider>
                  <CallContextProvider>
                    <WalletContextProvider>
                      <ProgressProvider
                        disableStyle
                        options={{ showSpinner: false }}
                        shallowRouting
                      >
                        <ThemeModeProvider
                          attribute="class"
                          defaultTheme="dark"
                          forcedTheme="dark"
                          disableTransitionOnChange
                        >
                          {children}
                          <Toaster position="top-center" />
                          <LivePaymentAlerts />
                          <CallSheet />
                        </ThemeModeProvider>
                      </ProgressProvider>
                    </WalletContextProvider>
                  </CallContextProvider>
                </MessageContextProvider>
              </SocketContextProvider>
            </GlobalNotificationProvider>
          </AlertPreferencesProvider>
        </GlobalContextProvider>
      </QueryClientProvider>
    </AuthContextProvider>
  );
};
