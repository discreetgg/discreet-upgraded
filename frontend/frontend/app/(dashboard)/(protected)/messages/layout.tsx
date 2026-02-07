import { GlobalNotificationProvider } from '@/context/global-notification-context';
import { MessageSearchProvider } from '@/context/message-search-context';
import type { ReactNode } from 'react';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { MessagesLayoutClient } from './messages-layout-client';

export default function Layout({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <GlobalNotificationProvider>
      <MessageSearchProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <MessagesLayoutClient>{children}</MessagesLayoutClient>
        </HydrationBoundary>
      </MessageSearchProvider>
    </GlobalNotificationProvider>
  );
}

