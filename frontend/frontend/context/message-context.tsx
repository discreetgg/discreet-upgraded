'use client';

import { useGlobalNotification } from '@/context/global-notification-context';
import type {
  AuthorType,
  ConversationType,
  MessageType,
  UserType,
} from '@/types/global';
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

type MessageContextValue = {
  receiver: AuthorType | UserType | null;
  setReceiver: (receiver: AuthorType | UserType | null) => void;
  conversationId: string | null;
  setConversationId: (conversationId: string | null) => void;
  conversations: ConversationType[] | null;
  setConversations: (conversations: ConversationType[] | null) => void;
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

const MessageContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const didHydrate = useRef(false);

  const [receiver, setReceiver] = useState<AuthorType | UserType | null>(null);
  const [conversations, setConversations] = useState<ConversationType[] | null>(
    null
  );
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const notification = useGlobalNotification();

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
        notification.markAsRead(clearedCount);
        // Note: React Query cache invalidation should be handled by the component using this
      }
    },
    [notification]
  );

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
