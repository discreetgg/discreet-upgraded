'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { getConversationsService } from '@/lib/services';
import { cn } from '@/lib/utils';
import type { AuthorType, ConversationType, MessageType } from '@/types/global';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { Icon } from './ui/icons';
import { useSocket } from '@/context/socket-context';
import { useQuery } from '@tanstack/react-query';

export const ConversationList = () => {
  const {
    setReceiver,
    conversations,
    setConversations,
    clearUnreadCount,
    setConversationId,
  } = useMessage();
  const { user } = useGlobal();
  const { isUserOnline } = useSocket();

  const pathname = usePathname();

  // Memoize sorted conversations to prevent unnecessary re-sorts
  const sortConversations = useCallback((conversations: ConversationType[]) => {
    return [...conversations].sort(
      (a: ConversationType, b: ConversationType) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.updatedAt).getTime()
          : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.updatedAt).getTime()
          : new Date(b.updatedAt).getTime();
        return bTime - aTime; // Most recent first
      },
    );
  }, []);

  // Use React Query - will instantly use server-hydrated data
  const { data: fetchedConversations, isLoading: loading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await getConversationsService();
      // Sort conversations by updatedAt or lastMessage.updatedAt
      return sortConversations(response || []);
    },
    staleTime: 30 * 1000, // 30 seconds - conversations change frequently
    gcTime: 5 * 60 * 1000,
  });

  // Sync React Query data to message context
  useEffect(() => {
    if (fetchedConversations) {
      setConversations(fetchedConversations);
    }
  }, [fetchedConversations, setConversations]);

  const renderMessagePreview = (message: MessageType) => {
    const prefix = message.sender.discordId === user?.discordId ? 'You: ' : '';

    // Check if this is a tip message
    const isTipMessage = message.price && message.text?.includes('Tip sent');
    if (isTipMessage) {
      return (
        <span className="flex items-center gap-1">
          {prefix}
          <Icon.fundFilled className="text-muted-foreground size-3.5" /> Tip: $
          {Number(message.price).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
      );
    }

    switch (message.type) {
      case 'text':
        return (
          <>
            {prefix}
            {message.text}
          </>
        );
      case 'media':
        return (
          <span className="flex items-center gap-1">
            {prefix}
            <Icon.image className="text-muted-foreground size-3.5" /> Media
            message
          </span>
        );
      case 'menu':
        return (
          <span className="flex items-center gap-1">
            {prefix}
            <Icon.menuChat className="!text-muted-foreground size-3.5" /> Menu
            message
          </span>
        );
      case 'in_message_media':
        return (
          <span className="flex items-center gap-1">
            {prefix}
            <Icon.image className="text-muted-foreground size-3.5" /> Media
            message
          </span>
        );
      case 'system':
        return (
          <span className="flex items-center gap-1">
            <Info size={14} className="text-muted-foreground size-3.5" /> System
            message
          </span>
        );
      default:
        return null;
    }
  };

  const getOtherParticipant = (
    conversation: ConversationType,
  ): AuthorType | null => {
    return (
      conversation.participants.find((p) => p.discordId !== user?.discordId) ||
      null
    );
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60),
    );
    const diffInHours = diffInMinutes / 60;

    if (diffInHours < 24) {
      if (diffInMinutes < 1) return '1 min';
      if (diffInMinutes < 60) return `${diffInMinutes} min`;
      const hours = Math.floor(diffInHours);
      return `${hours}h`;
    }

    return format(date, 'dd/MM/yy');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => i).map((index) => (
          <div key={`loading-skeleton-${index}`} className="flex items-center gap-3 p-3">
            <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!conversations) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations?.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isActive = pathname === `/messages/${conversation._id}`;

        if (!otherParticipant) return null;

        return (
          <Link
            key={conversation._id}
            href={`/messages/${conversation._id}`}
            onClick={() => {
              setReceiver(otherParticipant);
              setConversationId(conversation._id);
              clearUnreadCount(conversation._id);
            }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors',
              isActive && 'bg-muted',
            )}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={
                    otherParticipant?.profileImage?.url ??
                    `https://cdn.discordapp.com/avatars/${otherParticipant.discordId}/${otherParticipant.discordAvatar}.png`
                  }
                  alt={
                    otherParticipant.displayName || otherParticipant.username
                  }
                />
                <AvatarFallback>
                  <Image
                    src="/user.svg"
                    height={48}
                    width={48}
                    className="rounded-full"
                    alt=""
                  />
                </AvatarFallback>
              </Avatar>
              {isUserOnline(otherParticipant.discordId) ? (
                <Icon.onlineIndicator className="absolute z-20 right-1 bottom-0" />
              ) : (
                <Icon.offlineIndicator className="absolute z-20 right-1 bottom-0" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">
                  {otherParticipant.displayName || otherParticipant.username}
                </p>
                <div className="flex items-center relative gap-2">
                  {conversation.lastMessage && (
                    <span className="text-[8px] text-muted-foreground">
                      {formatMessageTime(conversation.lastMessage.updatedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  {conversation.lastMessage
                    ? renderMessagePreview(conversation.lastMessage)
                    : 'No messages yet'}
                </p>
                {conversation?.unreadCount
                  ? conversation.unreadCount > 0 && (
                      <div className="flex items-center !size-[15px] justify-center !bg-[#FF007F] rounded-full">
                        <span className="text-[9px]">
                          {conversation.unreadCount > 99
                            ? '99+'
                            : conversation.unreadCount}
                        </span>
                      </div>
                    )
                  : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
