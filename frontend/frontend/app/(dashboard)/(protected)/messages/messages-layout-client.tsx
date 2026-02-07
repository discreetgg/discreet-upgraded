'use client';

import { ConversationList } from '@/components/conversation-list';
import { ConversationSearch } from '@/components/conversation-search';
import { NewConversationDialog } from '@/components/new-conversation-dialog';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function MessagesLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const isNewConversationPage =
    pathname === '/messages' && searchParams.get('chat') === 'new';
  const isConversationPage =
    isNewConversationPage ||
    (pathname !== '/messages' && pathname.startsWith('/messages/'));

  return (
    <div className="h-screen flex md:py-6 w-full">
      {/* Conversation List - Hidden on mobile when viewing a conversation */}
      <div
        className={`${isConversationPage ? 'hidden md:flex' : 'flex'
          } md:max-w-[287px] w-full flex-shrink-0`}
      >
        <div className="h-full flex flex-col w-full min-w-0">
          <div className="sticky top-0 z-10 bg-background p-4 flex flex-col gap-4 w-full min-w-0">
            {/* Mobile: Show full-width search when expanded, normal navbar when not */}
            <div className={cn(
              "flex items-center justify-between w-full ",
              isSearchExpanded && "md:flex"
            )}>
              {/* Logo - Hidden on mobile when search is expanded */}
              <button 
                onClick={() => router.push("/")} 
                type="button" 
                className={cn(
                  "flex gap-[6px] items-center md:hidden justify-start data-[home=false]:cursor-pointer",
                  isSearchExpanded && " hidden"
                )}
              >
                <Image src="/logo.png" height={41} width={41} alt="logo" />
              </button>
              {/* Title - Hidden on mobile when search is expanded */}
              <h2 className={cn(
                "text-[15px] font-medium ml-1",
                isSearchExpanded && "md:block hidden"
              )}>Messages</h2>
              <div className="flex items-center gap-2  justify-end w-full flex-1 min-w-0">
                <div className={cn(
                  "md:hidden",
                  isSearchExpanded ? "w-full" : "flex-shrink-0"
                )}>
                  <ConversationSearch 
                    isExpanded={isSearchExpanded}
                    onExpandedChange={setIsSearchExpanded}
                  />
                </div>
                {/* Add conversation button - Hidden on mobile when search is expanded */}
                <div className={cn(
                  isSearchExpanded && "md:block hidden"
                )}>
                  <NewConversationDialog />
                </div>
              </div>
            </div>
            {/* Desktop: Always show search */}
            <div className="hidden md:block">
              <ConversationSearch />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ConversationList />
          </div>
        </div>
      </div>
      {/* Message Container - Hidden on mobile when on /messages page */}
      <div
        className={`${isConversationPage ? '' : 'hidden md:flex'} flex-1 `}
      >
        {children}
      </div>
    </div>
  );
}
