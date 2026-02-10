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
  const recentlyHandledMessageIdsRef = useRef<Map<string, number>>(new Map());

  const [receiver, setReceiver] = useState<AuthorType | UserType | null>(null);
  const [conversations, setConversations] = useState<ConversationType[] | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const { addUnreadMessage, markAsRead } = useGlobalNotification();

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
        const existingConversationIndex = baseConversations.findIndex(
          (conv) => conv._id === conversationId
        );

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

          const updated = [newConversation, ...baseConversations];

          return updated.sort((a, b) => {
            const aTime = a.lastMessage
              ? new Date(a.lastMessage.updatedAt).getTime()
              : new Date(a.updatedAt).getTime();
            const bTime = b.lastMessage
              ? new Date(b.lastMessage.updatedAt).getTime()
              : new Date(b.updatedAt).getTime();
            return bTime - aTime;
          });
        }

        // Create a completely new array with updated conversation
        const updatedConversations = baseConversations.map((conversation) => {
          if (conversation._id === conversationId) {
            return {
              ...conversation,
              lastMessage: { ...message },
              updatedAt: message.updatedAt || new Date().toISOString(),
              unreadCount: shouldIncrementUnread
                ? (conversation.unreadCount || 0) + 1
                : conversation.unreadCount || 0,
            };
          }
          return conversation;
        });

        // Sort conversations by updatedAt descending (most recent first)
        return [...updatedConversations].sort((a, b) => {
          const aTime = a.lastMessage
            ? new Date(a.lastMessage.updatedAt).getTime()
            : new Date(a.updatedAt).getTime();
          const bTime = b.lastMessage
            ? new Date(b.lastMessage.updatedAt).getTime()
            : new Date(b.updatedAt).getTime();
          return bTime - aTime;
        });
      });
    },
    []
  );

  // Function to add a new conversation
  const addNewConversation = useCallback((conversation: ConversationType) => {
    setConversations((prev) => {
      if (!prev) return [conversation];

      // Check if conversation already exists
      const existingIndex = prev.findIndex(
        (conv) => conv._id === conversation._id
      );
      if (existingIndex !== -1) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingIndex] = conversation;
        return updated.sort((a, b) => {
          const aTime = a.lastMessage
            ? new Date(a.lastMessage.updatedAt).getTime()
            : new Date(a.updatedAt).getTime();
          const bTime = b.lastMessage
            ? new Date(b.lastMessage.updatedAt).getTime()
            : new Date(b.updatedAt).getTime();
          return bTime - aTime;
        });
      }

      // Add new conversation
      const newConversations = [conversation, ...prev];
      return newConversations.sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.updatedAt).getTime()
          : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.updatedAt).getTime()
          : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    });
  }, []);

  // Function to clear unread count for a conversation
  const clearUnreadCount = useCallback(
    (conversationId: string) => {
      let clearedCount = 0;

      setConversations((prev) => {
        if (!prev) return prev;

        return prev.map((conversation) => {
          if (conversation._id === conversationId) {
            clearedCount = conversation.unreadCount || 0;
            return {
              ...conversation,
              unreadCount: 0,
            };
          }
          return conversation;
        });
      });

      if (clearedCount > 0) {
        markAsRead(clearedCount);
        // Note: React Query cache invalidation should be handled by the component using this
      }
    },
    [markAsRead]
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
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
