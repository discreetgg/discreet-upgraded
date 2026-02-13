'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useSocket } from '@/context/socket-context';
import { getConversationsService } from '@/lib/services';
import { cn, getUserDiscordAvatar } from '@/lib/utils';
import type { AuthorType, ConversationType, MessageType } from '@/types/global';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Icon } from './ui/icons';

const CONVERSATION_PAGE_SIZE = 30;
const FALLBACK_CONVERSATION_KEY_PREFIX = 'conversation:';

const getParticipantIdentity = (participant: AuthorType): string => {
  if (participant?.discordId) return `discord:${participant.discordId}`;
  if (participant?._id) return `id:${participant._id}`;
  return '';
};

const getConversationParticipantKey = (
  conversation: ConversationType,
): string => {
  const participantKeys = (conversation.participants ?? [])
    .map((participant) => getParticipantIdentity(participant))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (participantKeys.length === 2) {
    return participantKeys.join(':');
  }

  return `${FALLBACK_CONVERSATION_KEY_PREFIX}${conversation._id}`;
};

const getConversationSortTimestamp = (conversation: ConversationType): number => {
  const updatedAt = conversation.lastMessage?.updatedAt ?? conversation.updatedAt;
  return new Date(updatedAt).getTime();
};

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

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const listRootRef = useRef<HTMLDivElement>(null);

  const sortConversations = useCallback((items: ConversationType[]) => {
    return [...items].sort((a: ConversationType, b: ConversationType) => {
      return getConversationSortTimestamp(b) - getConversationSortTimestamp(a);
    });
  }, []);

  const {
    data,
    isLoading: loading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversations', user?.discordId ?? 'guest', 'list'],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      getConversationsService({
        limit: CONVERSATION_PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    enabled: Boolean(user?.discordId),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const fetchedConversations = useMemo(() => {
    const byGroupKey = new Map<string, ConversationType>();
    for (const page of data?.pages ?? []) {
      for (const conversation of page.conversations ?? []) {
        const groupKey = getConversationParticipantKey(conversation);
        const existing = byGroupKey.get(groupKey);
        if (
          !existing ||
          getConversationSortTimestamp(conversation) >=
            getConversationSortTimestamp(existing)
        ) {
          byGroupKey.set(groupKey, conversation);
        }
      }
    }
    return sortConversations(Array.from(byGroupKey.values()));
  }, [data?.pages, sortConversations]);

  useEffect(() => {
    if (!fetchedConversations) return;

    setConversations((currentConversations) => {
      if (!currentConversations || currentConversations.length === 0) {
        return fetchedConversations;
      }

      const fetchedById = new Map(
        fetchedConversations.map((conversation) => [conversation._id, conversation]),
      );
      const fetchedByGroupKey = new Map(
        fetchedConversations.map((conversation) => [
          getConversationParticipantKey(conversation),
          conversation,
        ]),
      );

      const mergedCurrent = currentConversations.flatMap((conversation) => {
        const fetched = fetchedById.get(conversation._id);
        if (!fetched) {
          const groupKey = getConversationParticipantKey(conversation);
          if (fetchedByGroupKey.has(groupKey)) {
            return [];
          }
          return [conversation];
        }

        fetchedById.delete(conversation._id);
        fetchedByGroupKey.delete(getConversationParticipantKey(conversation));

        const currentUpdatedAt = getConversationSortTimestamp(conversation);
        const fetchedUpdatedAt = getConversationSortTimestamp(fetched);

        const newestConversation =
          fetchedUpdatedAt >= currentUpdatedAt ? fetched : conversation;

        return [{
          ...newestConversation,
          // Server unread count should remain source of truth.
          unreadCount: fetched.unreadCount ?? newestConversation.unreadCount ?? 0,
        } as ConversationType];
      });

      const dedupedByGroupKey = new Map<string, ConversationType>();
      for (const conversation of [
        ...mergedCurrent,
        ...Array.from(fetchedById.values()),
      ]) {
        const groupKey = getConversationParticipantKey(conversation);
        const existing = dedupedByGroupKey.get(groupKey);
        if (
          !existing ||
          getConversationSortTimestamp(conversation) >=
            getConversationSortTimestamp(existing)
        ) {
          dedupedByGroupKey.set(groupKey, conversation);
        }
      }

      return sortConversations(Array.from(dedupedByGroupKey.values()));
    });
  }, [fetchedConversations, setConversations, sortConversations]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const root = listRootRef.current?.parentElement ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) {
          return;
        }
        void fetchNextPage();
      },
      {
        root,
        rootMargin: '120px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderMessagePreview = (message: MessageType) => {
    const prefix = message.sender.discordId === user?.discordId ? 'You: ' : '';

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
          <div
            key={`loading-skeleton-${index}`}
            className="flex items-center gap-3 p-3"
          >
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

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <div ref={listRootRef} className="space-y-1">
      {conversations.map((conversation) => {
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
                    getUserDiscordAvatar({
                      discordId: otherParticipant.discordId,
                      discordAvatar: otherParticipant.discordAvatar,
                    })
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

      <div ref={loadMoreRef} className="h-4" />
      {isFetchingNextPage ? (
        <div className="py-2 text-center text-xs text-muted-foreground">
          Loading more conversations...
        </div>
      ) : null}
    </div>
  );
};
