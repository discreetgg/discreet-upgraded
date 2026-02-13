'use client';

import { useGlobalNotification } from '@/context/global-notification-context';
import { useSocket } from '@/context/socket-context';
import { useGlobal } from '@/context/global-context-provider';
import type {
  AuthorType,
  ConversationType,
  MessageType,
  UserType,
} from '@/types/global';
import { usePathname } from 'next/navigation';
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
import { useQueryClient } from '@tanstack/react-query';
import {
  clearConversationRequestCaches,
  markConversationAsReadService,
} from '@/lib/services';

type MessageContextValue = {
  receiver: AuthorType | UserType | null;
  setReceiver: (receiver: AuthorType | UserType | null) => void;
  conversationId: string | null;
  setConversationId: (conversationId: string | null) => void;
  conversations: ConversationType[] | null;
  setConversations: React.Dispatch<
    React.SetStateAction<ConversationType[] | null>
  >;
  updateConversationLastMessage: (
    conversationId: string,
    message: MessageType,
    shouldIncrementUnread?: boolean
  ) => void;
  addNewConversation: (conversation: ConversationType) => void;
  clearUnreadCount: (conversationId: string) => void;
};

const MessageContext = createContext<MessageContextValue | null>(null);

const storageKey = 'root:message';
const MESSAGE_DEDUP_WINDOW_MS = 3000;
const UNREAD_SYNC_CHANNEL = 'discreet:chat:unread-sync';
const UNREAD_SYNC_STORAGE_KEY = 'discreet:chat:unread-sync:event';

type ConversationReadSyncEvent = {
  type: 'conversation_read';
  userDiscordId: string;
  conversationId: string;
  participantKey?: string;
  sourceTabId: string;
  createdAt: number;
};

const resolveConversationIdentifier = (
  conversation: unknown,
): string | undefined => {
  if (!conversation) return undefined;

  if (typeof conversation === 'string') {
    return conversation;
  }

  if (typeof conversation === 'object') {
    const value = conversation as { _id?: unknown; id?: unknown };

    if (typeof value._id === 'string') {
      return value._id;
    }

    if (typeof value.id === 'string') {
      return value.id;
    }
  }

  return undefined;
};

const getAuthorIdentity = (
  author: Partial<Pick<AuthorType, '_id' | 'discordId'>> | undefined,
): string => {
  if (typeof author?.discordId === 'string' && author.discordId.length > 0) {
    return `discord:${author.discordId}`;
  }
  if (typeof author?._id === 'string' && author._id.length > 0) {
    return `id:${author._id}`;
  }
  return '';
};

const getConversationParticipantKey = (
  conversation: ConversationType | undefined,
): string => {
  if (!conversation) return '';

  const participantKeys = (conversation.participants ?? [])
    .map((participant) => getAuthorIdentity(participant))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (participantKeys.length === 2) {
    return participantKeys.join(':');
  }

  return `conversation:${conversation._id}`;
};

const getMessageParticipantKey = (message: MessageType): string => {
  const senderKey = getAuthorIdentity(message.sender);
  const receiverKey = getAuthorIdentity(message.reciever);
  const participantKeys = [senderKey, receiverKey]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (participantKeys.length === 2) {
    return participantKeys.join(':');
  }

  return '';
};

const moveConversationToTop = (
  conversations: ConversationType[],
  index: number,
  updatedConversation: ConversationType,
): ConversationType[] => {
  if (index === 0) {
    return [updatedConversation, ...conversations.slice(1)];
  }

  return [
    updatedConversation,
    ...conversations.slice(0, index),
    ...conversations.slice(index + 1),
  ];
};

const decrementUnreadTotal = (
  totalUnreadCount: unknown,
  delta: number,
): number | unknown => {
  if (typeof totalUnreadCount !== 'number' || !Number.isFinite(totalUnreadCount)) {
    return totalUnreadCount;
  }
  return Math.max(0, totalUnreadCount - Math.max(0, delta));
};

const MessageContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const { socket } = useSocket();
  const { user } = useGlobal();
  const queryClient = useQueryClient();
  const didHydrate = useRef(false);
  const previousUserDiscordIdRef = useRef<string | null>(null);
  const recentlyHandledMessageIdsRef = useRef<Map<string, number>>(new Map());
  const conversationsRef = useRef<ConversationType[] | null>(null);
  const unreadSyncChannelRef = useRef<BroadcastChannel | null>(null);
  const unreadSyncTabIdRef = useRef<string>(
    `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  );

  const [receiver, setReceiver] = useState<AuthorType | UserType | null>(null);
  const [conversations, setConversations] = useState<ConversationType[] | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const { addUnreadMessage, markAsRead } = useGlobalNotification();
  const activeConversationQueryKey = useMemo(
    () => ['conversations', user?.discordId ?? 'guest'],
    [user?.discordId],
  );

  const clearUnreadLocally = useCallback(
    (conversationId: string, participantKeyHint?: string) => {
      const conversationSnapshot = conversationsRef.current ?? [];
      const hasParticipantKeyHint =
        typeof participantKeyHint === 'string' && participantKeyHint.length > 0;
      const targetConversation = conversationSnapshot.find(
        (conversation) => conversation._id === conversationId,
      );
      const effectiveParticipantKey =
        participantKeyHint ||
        getConversationParticipantKey(targetConversation) ||
        '';
      const matchedConversationIds = new Set<string>();

      for (const conversation of conversationSnapshot) {
        if (conversation._id === conversationId) {
          matchedConversationIds.add(conversation._id);
          continue;
        }

        if (
          hasParticipantKeyHint &&
          getConversationParticipantKey(conversation) === effectiveParticipantKey
        ) {
          matchedConversationIds.add(conversation._id);
        }
      }

      if (!matchedConversationIds.has(conversationId)) {
        matchedConversationIds.add(conversationId);
      }

      const hasMatch = (conversation: ConversationType): boolean => {
        if (matchedConversationIds.has(conversation._id)) {
          return true;
        }
        if (!effectiveParticipantKey) {
          return false;
        }
        return (
          getConversationParticipantKey(conversation) === effectiveParticipantKey
        );
      };

      const clearedCount = conversationSnapshot.reduce((total, conversation) => {
        if (!hasMatch(conversation)) {
          return total;
        }
        return total + (conversation.unreadCount || 0);
      }, 0);

      setConversations((prev) => {
        if (!prev) return prev;
        return prev.map((conversation) => {
          if (!hasMatch(conversation)) {
            return conversation;
          }
          if (!conversation.unreadCount) {
            return conversation;
          }
          return {
            ...conversation,
            unreadCount: 0,
          };
        });
      });

      queryClient.setQueriesData(
        { queryKey: activeConversationQueryKey },
        (oldData: any) => {
          if (!oldData) {
            return oldData;
          }

          const clearConversationArrayUnread = (
            sourceConversations: ConversationType[],
          ) => {
            let pageClearedCount = 0;
            const nextConversations = sourceConversations.map((conversation) => {
              if (!hasMatch(conversation)) {
                return conversation;
              }

              const unreadCount = conversation.unreadCount || 0;
              if (unreadCount <= 0) {
                return conversation;
              }

              pageClearedCount += unreadCount;
              return {
                ...conversation,
                unreadCount: 0,
              };
            });

            return {
              nextConversations,
              pageClearedCount,
            };
          };

          if (Array.isArray(oldData.pages)) {
            let globalClearedCount = 0;
            const nextPages = oldData.pages.map((page: any) => {
              const pageConversations = Array.isArray(page?.conversations)
                ? (page.conversations as ConversationType[])
                : [];
              const { nextConversations, pageClearedCount } =
                clearConversationArrayUnread(pageConversations);

              if (pageClearedCount > globalClearedCount) {
                globalClearedCount = pageClearedCount;
              }

              return {
                ...page,
                conversations: nextConversations,
              };
            });

            const effectiveDelta =
              globalClearedCount > 0 ? globalClearedCount : clearedCount;
            const normalizedPages = nextPages.map((page: any) => ({
              ...page,
              totalUnreadCount: decrementUnreadTotal(
                page?.totalUnreadCount,
                effectiveDelta,
              ),
            }));

            return {
              ...oldData,
              pages: normalizedPages,
            };
          }

          if (Array.isArray(oldData.conversations)) {
            const { nextConversations, pageClearedCount } =
              clearConversationArrayUnread(
                oldData.conversations as ConversationType[],
              );
            const effectiveDelta =
              pageClearedCount > 0 ? pageClearedCount : clearedCount;

            return {
              ...oldData,
              conversations: nextConversations,
              totalUnreadCount: decrementUnreadTotal(
                oldData?.totalUnreadCount,
                effectiveDelta,
              ),
            };
          }

          return oldData;
        },
      );

      return {
        clearedCount,
        participantKey: effectiveParticipantKey,
      };
    },
    [activeConversationQueryKey, queryClient],
  );

  const applyReadSyncEvent = useCallback(
    (conversationId: string, participantKeyHint?: string) => {
      const { clearedCount } = clearUnreadLocally(
        conversationId,
        participantKeyHint,
      );
      if (clearedCount > 0) {
        markAsRead(clearedCount);
      }
      void queryClient.invalidateQueries({ queryKey: activeConversationQueryKey });
    },
    [activeConversationQueryKey, clearUnreadLocally, markAsRead, queryClient],
  );

  const publishReadSyncEvent = useCallback(
    (payload: { conversationId: string; participantKey?: string }) => {
      if (typeof window === 'undefined' || !user?.discordId) {
        return;
      }

      const syncEvent: ConversationReadSyncEvent = {
        type: 'conversation_read',
        userDiscordId: user.discordId,
        conversationId: payload.conversationId,
        participantKey: payload.participantKey,
        sourceTabId: unreadSyncTabIdRef.current,
        createdAt: Date.now(),
      };

      try {
        unreadSyncChannelRef.current?.postMessage(syncEvent);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to publish unread sync event via channel', error);
        }
      }

      try {
        localStorage.setItem(UNREAD_SYNC_STORAGE_KEY, JSON.stringify(syncEvent));
        localStorage.removeItem(UNREAD_SYNC_STORAGE_KEY);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to publish unread sync event via storage', error);
        }
      }
    },
    [user?.discordId],
  );

  useEffect(() => {
    const currentUserDiscordId = user?.discordId ?? null;
    const previousUserDiscordId = previousUserDiscordIdRef.current;
    const hasUserSwitch =
      previousUserDiscordId !== null &&
      previousUserDiscordId !== currentUserDiscordId;

    if (hasUserSwitch) {
      setReceiver(null);
      setConversationId(null);
      setConversations(null);
      recentlyHandledMessageIdsRef.current.clear();
      clearConversationRequestCaches();
      queryClient.removeQueries({ queryKey: ['conversations'] });
      localStorage.removeItem(storageKey);
    }

    previousUserDiscordIdRef.current = currentUserDiscordId;
  }, [queryClient, user?.discordId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.discordId) {
      return;
    }

    const handleSyncEvent = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return;
      }

      const syncEvent = payload as ConversationReadSyncEvent;
      if (syncEvent.type !== 'conversation_read') {
        return;
      }
      if (syncEvent.userDiscordId !== user.discordId) {
        return;
      }
      if (syncEvent.sourceTabId === unreadSyncTabIdRef.current) {
        return;
      }
      if (!syncEvent.conversationId) {
        return;
      }

      applyReadSyncEvent(syncEvent.conversationId, syncEvent.participantKey);
    };

    let unreadSyncChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      unreadSyncChannel = new BroadcastChannel(UNREAD_SYNC_CHANNEL);
      unreadSyncChannelRef.current = unreadSyncChannel;
      unreadSyncChannel.onmessage = (event) => {
        handleSyncEvent(event.data);
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== UNREAD_SYNC_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        handleSyncEvent(JSON.parse(event.newValue));
      } catch {
        // Ignore malformed payloads.
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (unreadSyncChannel) {
        unreadSyncChannel.close();
      }
      if (unreadSyncChannelRef.current === unreadSyncChannel) {
        unreadSyncChannelRef.current = null;
      }
    };
  }, [applyReadSyncEvent, user?.discordId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setReceiver(parsed.receiver);
        setConversationId(parsed.conversationId);
      } catch (err) {
        console.error('Failed to parse message state:', err);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        receiver,
        conversationId,
      })
    );
  }, [receiver, conversationId]);

  // Function to update last message in a conversation
  const updateConversationLastMessage = useCallback(
    (
      conversationId: string,
      message: MessageType,
      shouldIncrementUnread = false
    ) => {
      setConversations((prev) => {
        const baseConversations = prev ?? [];
        const messageParticipantKey = getMessageParticipantKey(message);

        // Helper to convert message authors to full participants
        const toAuthor = (author: MessageType['sender']): AuthorType => ({
          _id: author.id,
          discordId: author.discordId,
          displayName: author.displayName,
          discordAvatar: author.discordAvatar,
          profileImage: author.profileImage ?? null,
          username: author.username,
          role: author.role,
        });

        // Check if conversation already exists
        let existingConversationIndex = baseConversations.findIndex(
          (conv) => conv._id === conversationId
        );
        if (existingConversationIndex === -1 && messageParticipantKey) {
          existingConversationIndex = baseConversations.findIndex(
            (conv) =>
              getConversationParticipantKey(conv) === messageParticipantKey,
          );
        }

        if (existingConversationIndex === -1) {
          if (!conversationId) {
            return baseConversations;
          }

          const participants = [message.sender, message.reciever]
            .filter(Boolean)
            .map((participant) =>
              toAuthor(participant as MessageType['sender'])
            );

          const newConversation: ConversationType = {
            _id: conversationId,
            participants,
            lastMessage: { ...message },
            unreadCount: shouldIncrementUnread ? 1 : 0,
            createdAt: message.createdAt || new Date().toISOString(),
            updatedAt: message.updatedAt || new Date().toISOString(),
            __v: 0,
          };

          // Incoming message is by definition newest for that conversation.
          return [newConversation, ...baseConversations];
        }

        const existingConversation = baseConversations[existingConversationIndex];
        const updatedConversation: ConversationType = {
          ...existingConversation,
          lastMessage: { ...message },
          updatedAt: message.updatedAt || new Date().toISOString(),
          unreadCount: shouldIncrementUnread
            ? (existingConversation.unreadCount || 0) + 1
            : existingConversation.unreadCount || 0,
        };

        // Move touched conversation to top in O(n) instead of re-sorting O(n log n).
        return moveConversationToTop(
          baseConversations,
          existingConversationIndex,
          updatedConversation,
        );
      });
    },
    []
  );

  // Function to add a new conversation
  const addNewConversation = useCallback((conversation: ConversationType) => {
    setConversations((prev) => {
      if (!prev) return [conversation];

      // Check if conversation already exists
      let existingIndex = prev.findIndex(
        (conv) => conv._id === conversation._id
      );
      if (existingIndex === -1) {
        const incomingParticipantKey = getConversationParticipantKey(conversation);
        if (incomingParticipantKey) {
          existingIndex = prev.findIndex(
            (conv) =>
              getConversationParticipantKey(conv) === incomingParticipantKey,
          );
        }
      }
      if (existingIndex !== -1) {
        return moveConversationToTop(prev, existingIndex, conversation);
      }

      // Newly created conversations should appear first.
      return [conversation, ...prev];
    });
  }, []);

  // Function to clear unread count for a conversation
  const clearUnreadCount = useCallback(
    (conversationId: string) => {
      const participantKeyHint =
        getConversationParticipantKey(
          conversationsRef.current?.find(
            (conversation) => conversation._id === conversationId,
          ),
        ) || undefined;
      const { clearedCount, participantKey } = clearUnreadLocally(
        conversationId,
        participantKeyHint,
      );

      if (clearedCount > 0) {
        markAsRead(clearedCount);
      }
      publishReadSyncEvent({
        conversationId,
        participantKey,
      });

      void markConversationAsReadService(conversationId)
        .catch((error) => {
          console.error('Failed to persist conversation read state', error);
        })
        .finally(() => {
          void queryClient.invalidateQueries({
            queryKey: activeConversationQueryKey,
          });
        });
    },
    [
      activeConversationQueryKey,
      clearUnreadLocally,
      markAsRead,
      publishReadSyncEvent,
      queryClient,
    ],
  );

  useEffect(() => {
    if (!socket) return;
    if (pathname.startsWith('/messages')) return;

    const handleIncomingMessage = (
      incoming: MessageType | (MessageType & { conversation?: unknown }),
    ) => {
      if (!incoming?._id) return;
      if (incoming.sender.discordId === user?.discordId) return;

      const now = Date.now();
      const recentMessageIds = recentlyHandledMessageIdsRef.current;
      const previousHandledAt = recentMessageIds.get(incoming._id);

      if (previousHandledAt && now - previousHandledAt < MESSAGE_DEDUP_WINDOW_MS) {
        return;
      }

      recentMessageIds.set(incoming._id, now);

      if (recentMessageIds.size > 200) {
        const cutoff = now - MESSAGE_DEDUP_WINDOW_MS;
        for (const [messageId, handledAt] of recentMessageIds.entries()) {
          if (handledAt < cutoff) {
            recentMessageIds.delete(messageId);
          }
        }
      }

      const conversationIdentifier =
        resolveConversationIdentifier(incoming.conversation) ?? '';

      if (!conversationIdentifier) return;

      // When conversation state is not hydrated (e.g. just refreshed on Home),
      // avoid building partial unread state from zero and instead refresh
      // authoritative server conversations.
      if (conversations === null) {
        queryClient.invalidateQueries({ queryKey: activeConversationQueryKey });
        addUnreadMessage();
        return;
      }

      const normalizedMessage: MessageType = {
        ...incoming,
        conversation: conversationIdentifier,
      } as MessageType;

      updateConversationLastMessage(
        conversationIdentifier,
        normalizedMessage,
        true,
      );
      addUnreadMessage();
    };

    socket.on('message:new', handleIncomingMessage);
    socket.on('message:send-with-media', handleIncomingMessage);

    return () => {
      socket.off('message:new', handleIncomingMessage);
      socket.off('message:send-with-media', handleIncomingMessage);
    };
  }, [
    addUnreadMessage,
    activeConversationQueryKey,
    conversations,
    pathname,
    queryClient,
    socket,
    updateConversationLastMessage,
    user?.discordId,
  ]);

  const value = useMemo(
    () => ({
      receiver,
      setReceiver,
      conversations,
      setConversations,
      updateConversationLastMessage,
      addNewConversation,
      clearUnreadCount,
      loading,
      conversationId,
      setConversationId,
    }),
    [
      receiver,
      conversations,
      updateConversationLastMessage,
      addNewConversation,
      clearUnreadCount,
      loading,
      conversationId,
      setConversationId,
    ]
  );

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};

export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) {
    throw new Error('useMessage must be used within a MessageContextProvider');
  }
  return ctx;
};

export default MessageContextProvider;
