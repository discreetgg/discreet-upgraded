'use client';

import type { AuthorType, UserType } from '@/types/global';
import { useEffect, useState } from 'react';
import { PostAuthor } from './post-author';
import { Icon } from './ui/icons';

import { useCall } from '@/context/call-context';
import { CallVideoReadyDialog } from './call-video-ready-dialog';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useRouter } from '@bprogress/next/app';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MessageDetailsSheet } from './message-details-sheet';
import { MessageSearchHeader } from './message-search-header';
import { ConnectionIndicator } from './connection-indicator';
import { cn, getUserFromID } from '@/lib/utils';
import { CamsConnectDialog } from './cams-connect';

export const MessageContainerHeader = ({
  receiver,
}: {
  receiver: AuthorType | null;
}) => {
  const { receiverId, setReceiverId } = useCall();
  const { user } = useGlobal();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [userReceiver, setUserReceiver] = useState<UserType | null>(null);

  useEffect(() => {
    if (!receiverId) {
      setReceiverId(receiver?.discordId ?? null);
    }
  }, [receiverId, receiver?.discordId, setReceiverId]);

  useEffect(() => {
    if (receiver?.discordId) {
      getUserFromID(receiver.discordId).then((user) => {
        setUserReceiver(user);
      });
    }
  }, [receiver?.discordId]);

  useEffect(() => {
    const handleJumpToMessage = () => {
      setIsSheetOpen(false);
    };

    window.addEventListener(
      'messages:jump-to',
      handleJumpToMessage as EventListener,
    );

    return () => {
      window.removeEventListener(
        'messages:jump-to',
        handleJumpToMessage as EventListener,
      );
    };
  }, []);

  return (
    <div className="relative flex items-center w-full border-b border-[#1E2227] py-3 px-4 min-w-0 overflow-hidden">
      {/* Left side - Hidden on mobile when search is expanded */}
      <div
        className={cn(
          'flex items-center gap-3 flex-1 min-w-0',
          isSearchExpanded && 'md:flex hidden',
        )}
      >
        {/* Back button - only visible on mobile */}
        <button
          type="button"
          onClick={() => router.push('/messages')}
          className="md:hidden flex-shrink-0 p-2 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200 active:scale-95"
          aria-label="Back to messages"
        >
          <Icon.arrowLeft className="size-5 text-[#A1A1AA]" />
        </button>
        {receiver && (
          <div className="flex-1 min-w-0">
            <PostAuthor author={receiver} showUserName={false} />
          </div>
        )}
      </div>

      {/* Right side - Hidden on mobile when search is expanded */}
      <div
        className={cn(
          'flex items-center gap-2 flex-shrink-0',
          isSearchExpanded && 'md:flex hidden',
        )}
      >
        {/* Connection Indicator */}
        <ConnectionIndicator />

        {user?.role === 'buyer' && receiver?.role === 'seller' && (
          // userReceiver?.takingCams &&

          <CamsConnectDialog
            user={userReceiver!}
            open={isConnectOpen}
            onOpenChange={(open) => setIsConnectOpen(open)}
          >
            <button
              type="button"
              className="p-2.5 hover:cursor-pointer hover:bg-[#1A1C1F] rounded-full duration-100"
            >
              <Icon.videoCall />
            </button>
          </CamsConnectDialog>
        )}

        {/* Compact search - only visible on mobile, hidden when expanded */}
        <div className={cn('md:hidden', isSearchExpanded && 'hidden')}>
          <MessageSearchHeader
            isExpanded={isSearchExpanded}
            onExpandedChange={setIsSearchExpanded}
          />
        </div>

        {/* Menu button - only visible on mobile */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="md:hidden p-2 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Open details"
            >
              <Icon.menu stroke="#fff" className="size-5 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md p-0 overflow-y-auto"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Conversation details</SheetTitle>
            </SheetHeader>
            <MessageDetailsSheet />
          </SheetContent>
        </Sheet>
      </div>

      {/* Expanded search - only visible on mobile when expanded, takes full width */}
      <div
        className={cn(
          'md:hidden sticky left-0 w-full right-0 top-0 h-9 z-50 bottom-0 px-4 flex items-center',
          isSearchExpanded ? 'flex' : 'hidden',
        )}
      >
        <MessageSearchHeader
          isExpanded={isSearchExpanded}
          onExpandedChange={setIsSearchExpanded}
        />
      </div>
    </div>
  );
};
