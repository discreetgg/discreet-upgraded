import { useGlobalNotification } from '@/context/global-notification-context';
import { useMessage } from '@/context/message-context';
import { useSocket } from '@/context/socket-context';
import {
  getConversationByIdService,
  sendMessageService,
  getConversationBetweenUsersService,
} from '@/lib/services';
import type {
  AuthorType,
  ConversationResponseType,
  ConversationType,
  MessageType,
  UserType,
} from '@/types/global';
import { useRouter } from '@bprogress/next/app';
import { useCallback, useEffect, useState, useRef } from 'react';

// Helper to generate temporary message IDs
const generateTempId = () => `temp_${Date.now()}_${Math.random()}`;

// Ensure we can work with API responses that sometimes embed the conversation payload
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

type ConversationThreadCacheEntry = {
  messages: MessageType[];
  hasMoreMessages: boolean;
  oldestMessageDate: string | null;
  updatedAt: number;
};

const MAX_CACHED_CONVERSATIONS = 20;
const conversationThreadCache = new Map<string, ConversationThreadCacheEntry>();

type ReloadOptions = {
  background?: boolean;
  forceFresh?: boolean;
};

const upsertConversationThreadCache = (
  conversationKey: string,
  payload: Omit<ConversationThreadCacheEntry, 'updatedAt'>,
) => {
  conversationThreadCache.set(conversationKey, {
    ...payload,
    updatedAt: Date.now(),
  });

  if (conversationThreadCache.size > MAX_CACHED_CONVERSATIONS) {
    const oldestKey = conversationThreadCache.keys().next().value;
    if (oldestKey) {
      conversationThreadCache.delete(oldestKey);
    }
  }
};

const getConversationThreadCache = (conversationKey: string) =>
  conversationThreadCache.get(conversationKey);

const upsertMessageIntoConversationThreadCache = (
  conversationKey: string,
  message: MessageType,
) => {
  const cached = conversationThreadCache.get(conversationKey);
  if (!cached) {
    return;
  }

  const existingIndex = cached.messages.findIndex((m) => m._id === message._id);
  const nextMessages =
    existingIndex === -1
      ? [...cached.messages, message]
      : cached.messages.map((m) => (m._id === message._id ? message : m));

  upsertConversationThreadCache(conversationKey, {
    messages: nextMessages,
    hasMoreMessages: cached.hasMoreMessages,
    oldestMessageDate: cached.oldestMessageDate,
  });
};

export const useChat = (
  sender: AuthorType | UserType | null,
  receiverId: string,
  conversationId?: string,
  isTemporary = false,
  hasActiveConversationView = true,
) => {
  const { updateConversationLastMessage, addNewConversation } = useMessage();
  const notification = useGlobalNotification();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actualConversationId, setActualConversationId] =
    useState(conversationId);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageDate, setOldestMessageDate] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // Refs to track current values without triggering effect re-runs
  const actualConversationIdRef = useRef(actualConversationId);
  const conversationIdRef = useRef(conversationId);
  const senderRef = useRef(sender);
  const socketRef = useRef(socket);
  // Track if we've already loaded for the current conversation to prevent duplicate calls
  const loadedConversationIdRef = useRef<string | null>(null);
  const isReloadingRef = useRef(false);
  const previousConversationIdRef = useRef<string | undefined>(
    actualConversationId,
  );

  // Keep refs in sync
  useEffect(() => {
    actualConversationIdRef.current = actualConversationId;
  }, [actualConversationId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    senderRef.current = sender;
  }, [sender]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    const previousConversationId = previousConversationIdRef.current;

    if (
      previousConversationId &&
      previousConversationId !== actualConversationId &&
      loadedConversationIdRef.current === previousConversationId
    ) {
      upsertConversationThreadCache(previousConversationId, {
        messages,
        hasMoreMessages,
        oldestMessageDate,
      });
    }

    previousConversationIdRef.current = actualConversationId;
  }, [actualConversationId, hasMoreMessages, messages, oldestMessageDate]);

  useEffect(() => {
    if (!actualConversationId) {
      return;
    }

    if (loadedConversationIdRef.current !== actualConversationId) {
      return;
    }

    upsertConversationThreadCache(actualConversationId, {
      messages,
      hasMoreMessages,
      oldestMessageDate,
    });
  }, [actualConversationId, hasMoreMessages, messages, oldestMessageDate]);

  // Stable normalizeIncomingMessage callback using refs to avoid recreation
  const normalizeIncomingMessage = useCallback(
    (
      incoming: MessageType | (MessageType & { conversation: any }),
      fallbackConversationId?: string,
    ): MessageType => {
      // Use refs to get current values without causing callback recreation
      const currentActualConversationId = actualConversationIdRef.current;
      const currentConversationId = conversationIdRef.current;

      const resolvedConversationId =
        resolveConversationIdentifier(incoming.conversation) ??
        fallbackConversationId ??
        currentActualConversationId ??
        currentConversationId ??
        '';

      return {
        ...incoming,
        conversation: resolvedConversationId,
      } as MessageType;
    },
    [], // Empty deps - uses refs internally
  );

  // Sync conversationId prop to actualConversationId state
  // Only run when conversationId prop changes, not when actualConversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== actualConversationIdRef.current) {
      setActualConversationId(conversationId);
    } else if (!conversationId && actualConversationIdRef.current) {
      setActualConversationId(undefined);
    }
    // Only depend on conversationId to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const reload = useCallback(async (options?: ReloadOptions) => {
    const background = options?.background ?? false;
    const forceFresh = options?.forceFresh ?? false;

    if (!actualConversationId) {
      setMessages([]);
      loadedConversationIdRef.current = null;
      return;
    }

    // Prevent duplicate reload calls for the same conversation
    if (isReloadingRef.current) {
      return;
    }

    // Get current sender and socket from refs to avoid dependency issues
    const currentSender = senderRef.current;
    const currentSocket = socketRef.current;

    try {
      isReloadingRef.current = true;
      if (!background) {
        setIsLoading(true);
      }

      const data = await getConversationByIdService(actualConversationId, {
        limit: 50,
        force: forceFresh,
      });

      // Mark this conversation as loaded
      loadedConversationIdRef.current = actualConversationId;

      // Inline normalization to avoid dependency on normalizeIncomingMessage callback
      const normalized = (data || []).map((message: MessageType) => ({
        ...message,
        conversation:
          resolveConversationIdentifier(message.conversation) ??
          actualConversationId,
      }));

      const nextOldestMessageDate =
        normalized.length > 0
          ? (normalized[normalized.length - 1].createdAt ?? null)
          : null;

      // Mark all unread messages from other users as read immediately
      const unreadMessages = normalized.filter(
        (msg: MessageType) =>
          msg.sender.discordId !== currentSender?.discordId &&
          msg.status !== 'read' &&
          msg.type !== 'call',
      );

      // Mark unread messages as read in the normalized array before setting state
      const messagesWithReadStatus = normalized.map((msg: MessageType) => {
        if (
          unreadMessages.some((um: MessageType) => um._id === msg._id) &&
          msg.sender.discordId !== currentSender?.discordId
        ) {
          return { ...msg, status: 'read' as const };
        }
        return msg;
      });

      setMessages(messagesWithReadStatus);

      // Set oldest message date for infinite scroll (use last message as it's the oldest)
      setOldestMessageDate(nextOldestMessageDate);

      // If we got fewer than 50 messages, we've reached the end
      const nextHasMoreMessages = normalized.length >= 50;
      setHasMoreMessages(nextHasMoreMessages);

      upsertConversationThreadCache(actualConversationId, {
        messages: messagesWithReadStatus,
        hasMoreMessages: nextHasMoreMessages,
        oldestMessageDate: nextOldestMessageDate,
      });

      // Emit socket events for marking messages as read (batched)
      if (unreadMessages.length > 0 && currentSocket?.connected) {
        // Batch read status updates - emit once with all message IDs
        const messageIds = unreadMessages.map((msg: MessageType) => msg._id);
        currentSocket.emit('message:read', { messageIds });

        // Update notification count
        notification.markAsRead(unreadMessages.length);
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      if (!background) {
        setIsLoading(false);
      }
      isReloadingRef.current = false;
    }
    // Note: Using refs for sender, socket, notification - excluded from deps to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualConversationId]);

  useEffect(() => {
    if (!socket) return;

    // New message received
    const handleNewMessage = async (msg: MessageType) => {
      // Use refs to get current values without causing re-renders
      const currentActualConversationId = actualConversationIdRef.current;
      const currentConversationIdParam = conversationIdRef.current;
      const currentSender = senderRef.current;

      const resolvedConversationId =
        resolveConversationIdentifier(msg.conversation) ??
        currentActualConversationId ??
        currentConversationIdParam;
      const currentConversationId = hasActiveConversationView
        ? currentActualConversationId ?? currentConversationIdParam
        : undefined;

      if (
        hasActiveConversationView &&
        !currentActualConversationId &&
        resolvedConversationId
      ) {
        setActualConversationId(resolvedConversationId);
      }

      // Normalize message inline to avoid dependency on callback
      const normalizedMessage: MessageType = {
        ...msg,
        conversation: resolvedConversationId ?? '',
      };

      // Check if this message is for the currently active conversation
      const isActiveConversation =
        hasActiveConversationView &&
        !!resolvedConversationId &&
        !!currentConversationId &&
        resolvedConversationId === currentConversationId;

      // Only add message to current view if it belongs to this conversation
      if (isActiveConversation) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => m._id === normalizedMessage._id);
          if (exists) {
            return prev.map((m) =>
              m._id === normalizedMessage._id ? normalizedMessage : m,
            );
          }
          return [...prev, normalizedMessage];
        });

        // Mark incoming message as read immediately if it's from another user and conversation is active
        if (
          msg.sender.discordId !== currentSender?.discordId &&
          normalizedMessage.status !== 'read' &&
          normalizedMessage.type !== 'call' &&
          socket?.connected
        ) {
          // Update UI immediately
          setMessages((prev) =>
            prev.map((m) =>
              m._id === normalizedMessage._id
                ? { ...m, status: 'read' as const }
                : m,
            ),
          );

          // Emit read status (batched format for consistency)
          socket.emit('message:read', { messageIds: [normalizedMessage._id] });
        }
      }

      // Update conversation list with the new message
      // Only increment unread count if:
      // 1. Message is from another user AND
      // 2. This is NOT the currently active conversation
      const shouldIncrementUnread =
        msg.sender.discordId !== currentSender?.discordId &&
        !isActiveConversation;

      const targetConversationId =
        resolvedConversationId ?? currentConversationId ?? '';

      if (targetConversationId) {
        upsertMessageIntoConversationThreadCache(
          targetConversationId,
          normalizedMessage,
        );

        updateConversationLastMessage(
          targetConversationId,
          normalizedMessage,
          shouldIncrementUnread,
        );
      }

      // Play notification sound and update UI if message is from another user
      if (msg.sender.discordId !== currentSender?.discordId) {
        notification.addUnreadMessage();
      }

      if (socket.connected) {
        socket.emit('message:delivered', { messageId: msg._id });
      }

      // If this is a media message coming in with only media IDs (server may send ids only),
      // we need to check if media needs to be fetched. Only do this for the specific message,
      // NOT a full conversation reload which could cause infinite loops.
      try {
        const hasOnlyIds =
          (normalizedMessage.type === 'media' ||
            normalizedMessage.type === 'menu') &&
          Array.isArray(normalizedMessage.media) &&
          normalizedMessage.media.length > 0 &&
          typeof normalizedMessage.media[0] === 'string';

        // Only fetch full message data if we actually have string IDs instead of objects
        // and this is the active conversation
        if (hasOnlyIds && isActiveConversation && targetConversationId) {
          // Just fetch this specific message's data instead of full conversation
          // The message should already be in our state, so we just need the media objects
          // Note: Removed full conversation reload to prevent infinite loops
          // The UI should handle string media IDs gracefully or fetch individually
        }
      } catch (err) {
        console.warn('Failed to reload conversation for media message', err);
      }
    };

    // Delivery/read status updates
    const handleMessageStatus = (statusUpdate: {
      messageId: string;
      tempId?: string;
      status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    }) => {
      setMessages((prev) =>
        prev.map((m) => {
          // Handle both temp IDs and server IDs
          if (
            m._id === statusUpdate.messageId ||
            (m._id.startsWith('temp_') && statusUpdate.tempId === m._id)
          ) {
            return { ...m, status: statusUpdate.status };
          }
          return m;
        }),
      );
    };

    // Sent acknowledgment
    const handleMessageAck = (ack: {
      success: boolean;
      tempId?: string;
      message?: MessageType;
      error?: string;
    }) => {
      if (ack.success) {
        // If we have a temp ID, update the message with server details
        if (ack.tempId && ack.message) {
          // Use refs to get current values
          const currentActualConvId = actualConversationIdRef.current;
          const currentConvIdParam = conversationIdRef.current;
          const fallbackConvId = currentActualConvId ?? currentConvIdParam;

          // Inline normalize to avoid callback dependency
          const normalizedAckMessage: MessageType = {
            ...ack.message,
            conversation:
              resolveConversationIdentifier(ack.message.conversation) ??
              fallbackConvId ??
              '',
          };
          const updatedMessage: MessageType = {
            ...normalizedAckMessage,
            status: 'sent' as const,
          };
          setMessages((prev) =>
            prev.map((m) => (m._id === ack.tempId ? updatedMessage : m)),
          );

          // Update conversation list with acknowledged message (don't increment unread for own messages)
          const targetConversationId =
            resolveConversationIdentifier(ack.message.conversation) ??
            currentActualConvId ??
            currentConvIdParam ??
            '';

          if (targetConversationId) {
            updateConversationLastMessage(
              targetConversationId,
              updatedMessage,
              false,
            );
          }
        }
      } else {
        console.error('Message failed to send:', ack.error);
        // Mark message as failed if we have temp ID
        if (ack.tempId) {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === ack.tempId ? { ...m, status: 'failed' as const } : m,
            ),
          );
        }
      }
    };

    // Conversation created (for temporary chats)
    const handleConversationCreated = (data: { conversationId: string }) => {
      if (data.conversationId) {
        setActualConversationId(data.conversationId);
        router.push(`/messages/${data.conversationId}`);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleMessageStatus);
    socket.on('message:send-with-media', handleNewMessage);
    socket.on('message:ack', handleMessageAck);
    socket.on('conversation:created', handleConversationCreated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleMessageStatus);
      socket.off('message:ack', handleMessageAck);
      socket.off('message:send-with-media', handleNewMessage);
      socket.off('conversation:created', handleConversationCreated);
    };
    // Note: Using refs for actualConversationId, conversationId, sender, normalizeIncomingMessage
    // to prevent infinite re-render loops. These are accessed via refs inside handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, router, updateConversationLastMessage, hasActiveConversationView]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle input text change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
  };

  // Handle media file selection
  const handleMediaSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: {
    preventDefault: () => void;
    paymentData?: { isPayable: boolean; price?: string; details?: string };
  }) => {
    e.preventDefault();
    if (!input && mediaFiles.length === 0) return;

    try {
      if (mediaFiles.length === 0) {
        // Create optimistic message for text messages
        const tempId = generateTempId();
        const optimisticMessage: MessageType = {
          _id: tempId,
          conversation: actualConversationId || 'temp',
          sender: {
            id: sender?.discordId ?? '',
            discordId: sender?.discordId ?? '',
            displayName: sender?.displayName ?? '',
            discordAvatar: sender?.discordAvatar ?? '',
            profileImage: sender?.profileImage ?? null,
            username: sender?.username ?? '',
            role: 'sender',
          },
          reciever: {
            id: receiverId,
            discordId: receiverId,
            displayName: '',
            discordAvatar: '',
            profileImage: null,
            username: '',
            role: '',
          },
          text: input,
          type: 'text',
          media: [],
          call: 'audio',
          callStatus: '',
          callStartedAt: '',
          missed: false,
          durationInSeconds: '',
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };

        // Add optimistic message immediately
        setMessages((prev) => [...prev, optimisticMessage]);
        setInput('');
        setIsSending(true);

        if (socket?.connected) {
          socket.emit(
            'message:send',
            {
              sender: sender?.discordId,
              reciever: receiverId,
              text: input,
              status: 'sent',
            },

            (response: any) => {
              setIsSending(false);

              if (isTemporary) {
                router.push(`/messages/${response?.conversation?.id}`);
                const newConversation =
                  transformResponseToConversation(response);
                addNewConversation(newConversation);
              }

              // Replace optimistic message with server response
              const serverMessage = normalizeIncomingMessage(
                {
                  conversation: (response as ConversationResponseType)
                    .conversation.id,
                  ...(response as object),
                } as MessageType,
                actualConversationId ?? conversationId,
              );

              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempId
                    ? { ...serverMessage, status: 'sent' }
                    : msg,
                ),
              );

              // Update conversation list with sent message (don't increment unread for own messages)
              const targetConversationId =
                resolveConversationIdentifier(serverMessage.conversation) ??
                actualConversationId ??
                conversationId ??
                '';

              if (targetConversationId) {
                updateConversationLastMessage(
                  targetConversationId,
                  {
                    ...serverMessage,
                    status: 'sent',
                  },
                  false,
                );
              }
            },
          );
        } else {
          // Update status to failed if no socket connection
          setIsSending(false);
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg,
              ),
            );
          }, 1000);
        }
      } else {
        // Create optimistic message for media messages
        const tempId = generateTempId();
        const filesToSend = [...mediaFiles];

        // Create preview URLs for files
        const mediaWithPreviews = filesToSend.map((file, index) => {
          const previewUrl = URL.createObjectURL(file);
          const previewKey = `${tempId}_${index}`;
          setPreviewUrls((prev) => new Map(prev).set(previewKey, previewUrl));

          let mediaType = 'image';
          if (file.type.startsWith('video')) {
            mediaType = 'video';
          }

          return {
            _id: previewKey,
            url: previewUrl,
            public_id: '',
            type: mediaType,
            caption: '',
            price: '',
            isPayable: false,
            paid: false,
            post: '',
            owner: '',
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0,
          };
        });

        const optimisticMessage: MessageType = {
          _id: tempId,
          conversation: actualConversationId || 'temp',
          sender: {
            id: sender?.discordId ?? '',
            discordId: sender?.discordId ?? '',
            displayName: sender?.displayName ?? '',
            discordAvatar: sender?.discordAvatar ?? '',
            profileImage: sender?.profileImage ?? null,
            username: sender?.username ?? '',
            role: 'sender',
          },
          reciever: {
            id: receiverId,
            discordId: receiverId,
            displayName: '',
            discordAvatar: '',
            profileImage: null,
            username: '',
            role: '',
          },
          text: input,
          type: 'media',
          media: mediaWithPreviews,
          call: 'audio',
          callStatus: '',
          callStartedAt: '',
          missed: false,
          durationInSeconds: '',
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };

        // Add optimistic message immediately
        setMessages((prev) => [...prev, optimisticMessage]);
        setInput('');
        setMediaFiles([]);
        setIsSending(true);
        // setIsLoading(true);

        try {
          const formData = new FormData();
          formData.append('conversationId', actualConversationId || 'temp');
          formData.append('sender', sender?.discordId ?? '');
          formData.append('reciever', receiverId);
          formData.append('type', 'media');
          formData.append('status', 'sent');

          // Add payment data if provided
          const isPayable = e.paymentData?.isPayable ?? false;
          formData.append('isPayable', isPayable.toString());

          if (isPayable && e.paymentData?.price) {
            formData.append('price', e.paymentData.price);
          }

          if (isPayable && e.paymentData?.details) {
            formData.append('details', e.paymentData.details);
          }

          const mediaMetaArray: Array<object> = [];

          // Append files and build mediaMeta array
          for (const file of filesToSend) {
            formData.append('files', file);

            let mediaType = 'system';
            if (file.type.startsWith('image')) {
              mediaType = 'image';
            } else if (file.type.startsWith('video')) {
              mediaType = 'video';
            }

            mediaMetaArray.push({
              type: mediaType,
              name: file.name,
              size: file.size,
            });
          }

          // Append mediaMeta as a single JSON string
          formData.append('mediaMeta', JSON.stringify(mediaMetaArray));
          const serverMessage = await sendMessageService(formData);
          const normalizedServerMessage = normalizeIncomingMessage(
            serverMessage,
            actualConversationId ?? conversationId,
          );

          // Clean up preview URLs for this message
          mediaWithPreviews.forEach((_, index) => {
            const previewKey = `${tempId}_${index}`;
            setPreviewUrls((prev) => {
              const previewUrl = prev.get(previewKey);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                const newMap = new Map(prev);
                newMap.delete(previewKey);
                return newMap;
              }
              return prev;
            });
          });

          // Replace optimistic message with server response
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? { ...normalizedServerMessage, status: 'sent' }
                : msg,
            ),
          );

          // Update conversation list with sent media message (don't increment unread for own messages)
          const targetConversationId =
            resolveConversationIdentifier(
              normalizedServerMessage.conversation,
            ) ??
            actualConversationId ??
            conversationId ??
            '';

          if (targetConversationId) {
            updateConversationLastMessage(
              targetConversationId,
              {
                ...normalizedServerMessage,
                status: 'sent',
              },
              false,
            );
          }

          if (socket?.connected) {
            socket.emit('message:send-with-media', {
              messageId: normalizedServerMessage._id,
            });
          }
        } catch (err) {
          console.error('Failed to send media message', err);
          // Update status to failed
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId ? { ...msg, status: 'failed' } : msg,
            ),
          );
        } finally {
          //   setIsLoading(false);
          setIsSending(false);
        }
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const markAsRead = (messageId: string) => {
    if (socket?.connected) {
      // Backend expects messageIds (string or string[]) payload shape.
      socket.emit('message:read', { messageIds: [messageId] });
    }
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, status: 'read' } : m)),
    );

    // Update notification count
    notification.markAsRead(1);
  };

  const emitMediaAssetMessage = (messageId: string) => {
    if (socket?.connected) {
      socket.emit('message:send-with-media', { messageId });
    }
  };

  // Clear media files
  const clearMediaFiles = () => {
    setMediaFiles([]);
  };

  // Remove specific media file
  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Retry failed message
  const retryMessage = async (messageId: string) => {
    const failedMessage = messages.find((m) => m._id === messageId);
    if (!failedMessage) return;

    // Update status to sending
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, status: 'sending' } : msg,
      ),
    );

    try {
      if (failedMessage.type === 'text') {
        if (socket?.connected) {
          socket.emit(
            'message:send',
            {
              sender: failedMessage.sender.discordId,
              reciever: failedMessage.reciever.discordId,
              text: failedMessage.text,
              status: 'sent',
            },
            (response: unknown) => {
              const serverMessage = normalizeIncomingMessage(
                {
                  conversation: (response as ConversationResponseType)
                    .conversation.id,
                  ...(response as object),
                } as MessageType,
                actualConversationId ?? conversationId,
              );

              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === messageId
                    ? { ...serverMessage, status: 'sent' }
                    : msg,
                ),
              );

              // Update conversation list with retried message (don't increment unread for own messages)
              const targetConversationId =
                resolveConversationIdentifier(serverMessage.conversation) ??
                actualConversationId ??
                conversationId ??
                '';

              if (targetConversationId) {
                updateConversationLastMessage(
                  targetConversationId,
                  {
                    ...serverMessage,
                    status: 'sent',
                  },
                  false,
                );
              }
            },
          );
        } else {
          throw new Error('Socket not connected');
        }
      }
      // TODO: Add retry logic for media messages if needed
    } catch (err) {
      console.error('Failed to retry message', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: 'failed' } : msg,
        ),
      );
    }
  };

  // Send tip message to conversation
  const sendTipMessage = useCallback(
    async (amount: number, tipReceiverId: string) => {
      if (!sender?.discordId || !tipReceiverId) {
        console.error('âŒ Missing sender or receiver for tip message', {
          sender: sender?.discordId,
          tipReceiverId,
        });
        return;
      }

      try {
        // Get or create conversation between users
        const conversation = await getConversationBetweenUsersService([
          sender.discordId,
          tipReceiverId,
        ]);

        const targetConversationId =
          (conversation as { _id?: string })?._id ||
          (conversation as { id?: string })?.id ||
          (actualConversationId ?? conversationId);

        if (!targetConversationId) {
          console.error('âŒ No conversation ID for tip message', {
            conversation,
            actualConversationId,
            conversationId,
          });
          return;
        }

        const tempId = generateTempId();
        const tipMessageText = `Tip sent: $${amount.toFixed(2)}`;
        const priceString = amount.toFixed(2);

        const optimisticMessage: MessageType = {
          _id: tempId,
          conversation: targetConversationId,
          sender: {
            id: sender.discordId,
            discordId: sender.discordId,
            displayName: sender.displayName ?? '',
            discordAvatar: sender.discordAvatar ?? '',
            profileImage: sender.profileImage ?? null,
            username: sender.username ?? '',
            role: 'sender',
          },
          reciever: {
            id: tipReceiverId,
            discordId: tipReceiverId,
            displayName: '',
            discordAvatar: '',
            profileImage: null,
            username: '',
            role: '',
          },
          text: tipMessageText,
          type: 'text',
          media: [],
          price: priceString,
          call: 'audio',
          callStatus: '',
          callStartedAt: '',
          missed: false,
          durationInSeconds: '',
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };

        // Add optimistic message
        setMessages((prev) => [...prev, optimisticMessage]);

        if (socket?.connected) {
          socket.emit(
            'message:send',
            {
              sender: sender.discordId,
              reciever: tipReceiverId,
              text: tipMessageText,
              type: 'text',
              price: priceString,
              conversation: targetConversationId,
              status: 'sent',
            },
            (response: any) => {
              if (response?.error) {
                console.error('âŒ Socket error response:', response.error);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId ? { ...msg, status: 'failed' } : msg,
                  ),
                );
                return;
              }

              try {
                const serverMessage = normalizeIncomingMessage(
                  {
                    conversation: (response as ConversationResponseType)
                      .conversation.id,
                    ...(response as object),
                  } as MessageType,
                  targetConversationId,
                );

                // Replace optimistic message with server response
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId
                      ? { ...serverMessage, status: 'sent' }
                      : msg,
                  ),
                );

                // Update conversation list
                const resolvedConversationId =
                  resolveConversationIdentifier(serverMessage.conversation) ??
                  targetConversationId;

                if (resolvedConversationId) {
                  updateConversationLastMessage(
                    resolvedConversationId,
                    {
                      ...serverMessage,
                      status: 'sent',
                    },
                    false, // Don't increment unread for own messages
                  );
                }
              } catch (normalizeError) {
                console.error(
                  'âŒ Error normalizing server message:',
                  normalizeError,
                );
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId ? { ...msg, status: 'failed' } : msg,
                  ),
                );
              }
            },
          );
        } else {
          console.error('âŒ Socket not connected', {
            socket: !!socket,
            connected: socket?.connected,
          });
          // Mark as failed if no socket
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg,
              ),
            );
          }, 1000);
        }
      } catch (err) {
        console.error('âŒ Failed to send tip message:', err);
      }
    },
    [
      sender,
      actualConversationId,
      conversationId,
      socket,
      normalizeIncomingMessage,
      updateConversationLastMessage,
    ],
  );

  // Send call message to conversation
  const sendCallMessage = useCallback(
    async (callData: {
      callType: 'audio' | 'video';
      callStatus: 'initiated' | 'ongoing' | 'ended' | 'cancelled';
      callId: string;
      duration?: number;
    }) => {
      if (!sender?.discordId || !receiverId) {
        console.error('Missing sender or receiver for call message');
        return;
      }

      const targetConversationId = actualConversationId ?? conversationId;
      if (!targetConversationId) {
        console.error('No conversation ID for call message');
        return;
      }

      try {
        const tempId = generateTempId();

        // Create call status text based on status
        let callText = '';
        switch (callData.callStatus) {
          case 'initiated':
            callText = `${
              callData.callType === 'video' ? 'Video' : 'Audio'
            } call initiated`;
            break;
          case 'ongoing':
            callText = `${
              callData.callType === 'video' ? 'Video' : 'Audio'
            } call started`;
            break;
          case 'ended':
            callText = callData.duration
              ? `${
                  callData.callType === 'video' ? 'Video' : 'Audio'
                } call ended (${Math.floor(callData.duration / 60)}m ${
                  callData.duration % 60
                }s)`
              : `${
                  callData.callType === 'video' ? 'Video' : 'Audio'
                } call ended`;
            break;
          case 'cancelled':
            callText = `${
              callData.callType === 'video' ? 'Video' : 'Audio'
            } call cancelled`;
            break;
        }

        const optimisticMessage: MessageType = {
          _id: tempId,
          conversation: targetConversationId,
          sender: {
            id: sender.discordId,
            discordId: sender.discordId,
            displayName: sender.displayName ?? '',
            discordAvatar: sender.discordAvatar ?? '',
            profileImage: sender.profileImage ?? null,
            username: sender.username ?? '',
            role: 'sender',
          },
          reciever: {
            id: receiverId,
            discordId: receiverId,
            displayName: '',
            discordAvatar: '',
            profileImage: null,
            username: '',
            role: '',
          },
          text: callText,
          type: 'call',
          media: [],
          call: callData.callType,
          callStatus: callData.callStatus,
          callStartedAt: new Date().toISOString(),
          missed: false,
          durationInSeconds: callData.duration?.toString() ?? '',
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };

        // Add optimistic message
        setMessages((prev) => [...prev, optimisticMessage]);

        if (socket?.connected) {
          socket.emit(
            'message:send',
            {
              sender: sender.discordId,
              reciever: receiverId,
              text: callText,
              type: 'call',
              callType: callData.callType,
              callStatus: callData.callStatus,
              callStartedAt: new Date().toISOString(),
              durationInSeconds: callData.duration?.toString() ?? '',
              status: 'sent',
            },
            (response: any) => {
              const serverMessage = normalizeIncomingMessage(
                {
                  conversation: (response as ConversationResponseType)
                    .conversation.id,
                  ...(response as object),
                } as MessageType,
                targetConversationId,
              );

              // Replace optimistic message with server response
              setMessages((prev) =>
                prev.map((msg) =>
                  msg._id === tempId
                    ? { ...serverMessage, status: 'sent' }
                    : msg,
                ),
              );

              // Update conversation list
              const resolvedConversationId =
                resolveConversationIdentifier(serverMessage.conversation) ??
                targetConversationId;

              if (resolvedConversationId) {
                updateConversationLastMessage(
                  resolvedConversationId,
                  {
                    ...serverMessage,
                    status: 'sent',
                  },
                  false, // Don't increment unread for own messages
                );
              }
            },
          );
        } else {
          // Mark as failed if no socket
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg,
              ),
            );
          }, 1000);
        }
      } catch (err) {
        console.error('Failed to send call message:', err);
      }
    },
    [
      sender,
      receiverId,
      actualConversationId,
      conversationId,
      socket,
      normalizeIncomingMessage,
      updateConversationLastMessage,
    ],
  );

  const sendUnlockMessage = useCallback(
    async (messageId: string, price: string, sellerId: string) => {
      if (!sender?.discordId || !sellerId) {
        console.error('âŒ Missing sender or seller for unlock message', {
          sender: sender?.discordId,
          sellerId,
        });
        return;
      }

      try {
        // Get or create conversation between users
        const conversation = await getConversationBetweenUsersService([
          sender.discordId,
          sellerId,
        ]);

        const targetConversationId =
          (conversation as { _id?: string })?._id ||
          (conversation as { id?: string })?.id ||
          (actualConversationId ?? conversationId);

        if (!targetConversationId) {
          console.error('âŒ No conversation ID for unlock message', {
            conversation,
            actualConversationId,
            conversationId,
          });
          return;
        }

        const tempId = generateTempId();
        const unlockMessageText = `Content unlocked for $${Number(price).toFixed(2)}`;

        const optimisticMessage: MessageType = {
          _id: tempId,
          conversation: targetConversationId,
          sender: {
            id: sender.discordId,
            discordId: sender.discordId,
            displayName: sender.displayName ?? '',
            discordAvatar: sender.discordAvatar ?? '',
            profileImage: sender.profileImage ?? null,
            username: sender.username ?? '',
            role: 'sender',
          },
          reciever: {
            id: sellerId,
            discordId: sellerId,
            displayName: '',
            discordAvatar: '',
            profileImage: null,
            username: '',
            role: '',
          },
          text: unlockMessageText,
          type: 'text',
          media: [],
          price: price,
          call: 'audio',
          callStatus: '',
          callStartedAt: '',
          missed: false,
          durationInSeconds: '',
          status: 'sending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };

        // Add optimistic message
        setMessages((prev) => [...prev, optimisticMessage]);

        if (socket?.connected) {
          socket.emit(
            'message:send',
            {
              sender: sender.discordId,
              reciever: sellerId,
              text: unlockMessageText,
              type: 'text',
              price: price,
              conversation: targetConversationId,
              status: 'sent',
            },
            (response: any) => {

              if (response?.error) {
                console.error('âŒ Socket error response:', response.error);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId ? { ...msg, status: 'failed' } : msg,
                  ),
                );
                return;
              }

              try {
                const serverMessage = normalizeIncomingMessage(
                  {
                    conversation: (response as ConversationResponseType)
                      .conversation.id,
                    ...(response as object),
                  } as MessageType,
                  targetConversationId,
                );


                // Replace optimistic message with server response
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId
                      ? { ...serverMessage, status: 'sent' }
                      : msg,
                  ),
                );

                // Update conversation list
                const resolvedConversationId =
                  resolveConversationIdentifier(serverMessage.conversation) ??
                  targetConversationId;

                if (resolvedConversationId) {
                  updateConversationLastMessage(
                    resolvedConversationId,
                    {
                      ...serverMessage,
                      status: 'sent',
                    },
                    false, // Don't increment unread for own messages
                  );
                }
              } catch (normalizeError) {
                console.error(
                  'âŒ Error normalizing server message:',
                  normalizeError,
                );
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg._id === tempId ? { ...msg, status: 'failed' } : msg,
                  ),
                );
              }
            },
          );
        } else {
          console.error('âŒ Socket not connected', {
            socket: !!socket,
            connected: socket?.connected,
          });
          // Mark as failed if no socket
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempId ? { ...msg, status: 'failed' } : msg,
              ),
            );
          }, 1000);
        }
      } catch (err) {
        console.error('âŒ Failed to send unlock message:', err);
      }
    },
    [
      sender,
      actualConversationId,
      conversationId,
      socket,
      normalizeIncomingMessage,
      updateConversationLastMessage,
    ],
  );

  // Track last loaded date to prevent duplicate requests with same params
  const lastLoadedOldestDateRef = useRef<string | null>(null);

  // Load older messages (infinite scroll)
  const loadOlderMessages = useCallback(async () => {
    if (!actualConversationId || isLoadingMore || !hasMoreMessages) {
      return;
    }

    // Get current messages from state setter to avoid dependency
    let currentMessages: MessageType[] = [];
    setMessages((prev) => {
      currentMessages = prev;
      return prev;
    });

    // Use the oldest message date we have (last message in array since sorted newest first)
    const oldestDate =
      oldestMessageDate ||
      currentMessages[currentMessages.length - 1]?.createdAt;

    if (!oldestDate) {
      setHasMoreMessages(false);
      return;
    }

    // Prevent duplicate requests with the same date
    if (lastLoadedOldestDateRef.current === oldestDate) {
      return;
    }

    try {
      setIsLoadingMore(true);
      lastLoadedOldestDateRef.current = oldestDate;

      const data = await getConversationByIdService(actualConversationId, {
        limit: 50,
        to: oldestDate, // Load messages before this date
      });

      if (!data || data.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      // Inline normalization to avoid dependency on callback
      const normalized = (data || []).map((message: MessageType) => ({
        ...message,
        conversation:
          resolveConversationIdentifier(message.conversation) ??
          actualConversationId,
      }));

      // Get the oldest message from the new batch (last in array)
      const newOldestDate = normalized[normalized.length - 1]?.createdAt;

      // If the new oldest date is the same as or newer than what we had, we're stuck in a loop
      if (newOldestDate && oldestDate && newOldestDate >= oldestDate) {
        // Filter out messages we already have to avoid duplicates
        const existingIds = new Set(currentMessages.map((m) => m._id));
        const newMessages = normalized.filter(
          (m: MessageType) => !existingIds.has(m._id),
        );

        if (newMessages.length === 0) {
          setHasMoreMessages(false);
          return;
        }
      }

      // Prepend older messages to existing messages
      setMessages((prev) => {
        const combined = [...normalized, ...prev];
        // Remove duplicates
        const unique = combined.filter(
          (msg, index, self) =>
            index === self.findIndex((m) => m._id === msg._id),
        );
        return unique;
      });

      // Update oldest message date for next load (use last message - the oldest)
      if (normalized.length > 0 && newOldestDate) {
        setOldestMessageDate(newOldestDate);
        // Reset the lastLoaded ref so we can load the next batch
        lastLoadedOldestDateRef.current = null;
      }

      // If we got fewer than 50 messages, we've reached the end
      if (normalized.length < 50) {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load older messages', err);
      setHasMoreMessages(false);
      lastLoadedOldestDateRef.current = null;
    } finally {
      setIsLoadingMore(false);
    }
  }, [actualConversationId, isLoadingMore, hasMoreMessages, oldestMessageDate]);

  // Reload messages when conversation changes
  // Using actualConversationId as dependency instead of reload to prevent infinite loops
  useEffect(() => {
    if (!actualConversationId) {
      setMessages([]);
      setHasMoreMessages(true);
      setOldestMessageDate(null);
      loadedConversationIdRef.current = null;
      lastLoadedOldestDateRef.current = null;
      return;
    }

    // Only reload if we haven't already loaded this conversation
    if (
      actualConversationId &&
      loadedConversationIdRef.current !== actualConversationId
    ) {
      lastLoadedOldestDateRef.current = null;

      const cachedThread = getConversationThreadCache(actualConversationId);
      if (cachedThread) {
        loadedConversationIdRef.current = actualConversationId;
        setIsLoading(false);
        setMessages(cachedThread.messages);
        setHasMoreMessages(cachedThread.hasMoreMessages);
        setOldestMessageDate(cachedThread.oldestMessageDate);

        const currentSender = senderRef.current;
        const currentSocket = socketRef.current;
        const unreadMessageIds = cachedThread.messages
          .filter(
            (msg) =>
              msg.sender.discordId !== currentSender?.discordId &&
              msg.status !== 'read' &&
              msg.type !== 'call',
          )
          .map((msg) => msg._id);

        if (unreadMessageIds.length > 0) {
          const unreadSet = new Set(unreadMessageIds);
          setMessages((prev) =>
            prev.map((msg) =>
              unreadSet.has(msg._id)
                ? { ...msg, status: 'read' as const }
                : msg,
            ),
          );

          if (currentSocket?.connected) {
            currentSocket.emit('message:read', { messageIds: unreadMessageIds });
            notification.markAsRead(unreadMessageIds.length);
          }
        }

        // Keep instant cached render, but always refresh from server so
        // latest incoming messages appear without a manual page refresh.
        void reload({ background: true, forceFresh: true });
        return;
      }

      // Reset infinite scroll state when conversation changes
      setHasMoreMessages(true);
      setOldestMessageDate(null);
      void reload({ forceFresh: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualConversationId]);

  return {
    messages,
    setMessages,
    input,
    mediaFiles,
    handleInputChange,
    handleSubmit,
    handleMediaSelect,
    clearMediaFiles,
    removeMediaFile,
    isLoading,
    isSending,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    reload,
    markAsRead,
    retryMessage,
    sendCallMessage,
    sendTipMessage,
    sendUnlockMessage,
    // Notification functions
    clearNotifications: notification.clearNotifications,
    getUnreadCount: notification.getUnreadCount,
    emitMediaAssetMessage,
  };
};

const transformResponseToConversation = (response: any): ConversationType => {
  return {
    _id: response.conversation.id,

    participants: [response.sender, response.reciever].map((p: any) => ({
      _id: p.id,
      discordId: p.discordId,
      displayName: p.displayName,
      discordAvatar: p.discordAvatar,
      profileImage: p.profileImage ?? null,
      username: p.username,
      role: p.role,
    })),
    lastMessage: {
      _id: response._id,
      conversation: response.conversation.id,
      sender: {
        id: response.sender.id,
        discordId: response.sender.discordId,
        displayName: response.sender.displayName,
        discordAvatar: response.sender.discordAvatar,
        profileImage: response.sender.profileImage ?? null,
        username: response.sender.username,
        role: response.sender.role,
      },
      reciever: {
        id: response.reciever.id,
        discordId: response.reciever.discordId,
        displayName: response.reciever.displayName,
        discordAvatar: response.reciever.discordAvatar,
        profileImage: response.reciever.profileImage ?? null,
        username: response.reciever.username,
        role: response.reciever.role,
      },
      text: response.text,
      type: response.type,
      media: response.media ?? [],
      call: response.callType ?? 'audio',
      callStatus: response.callStatus ?? '',
      callStartedAt: response.callStartedAt ?? '',
      missed: response.missed ?? false,
      durationInSeconds: response.durationInSeconds ?? '',
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      __v: response.__v,
    },
    createdAt: response.conversation.createdAt,
    updatedAt: response.updatedAt,
    __v: response.conversation.__v ?? 0,
  };
};

// AQW4egd9mt5thXVzszZ12zATLe5nsCKiRNk54EWgxDrQ
