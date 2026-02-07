'use client';

import { useChat } from '@/hooks/use-chat';
import type { AuthorType, UserType } from '@/types/global';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageChatList } from './message-chat-list';
import { MessageContainerHeader } from './message-container-header';
import { MessageInput } from './message-input';
import { ComponentLoader } from './ui/component-loader';
import { DmMenuCreation } from './dm-menu-creation';

export const MessageContainer = ({
  sender,
  receiver,
  conversationId,
}: {
  sender: AuthorType | null;
  receiver: AuthorType | null;
  conversationId: string;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleMediaSelect,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    retryMessage,
    markAsRead,
    sendTipMessage,
    sendUnlockMessage,
    reload,
  } = useChat(sender, receiver?.discordId ?? '', conversationId);

  const [showDMMenu, setShowDMMenu] = useState(false);
  const [isDmMenuSubmit, setIsDmMenuSubmit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDemenuSubmitting, setIsDemenuSubmitting] = useState(false);
  const dmMenuSubmitRef = useRef<(() => void) | null>(null);
  const prevNewestMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const wasShowingDMMenuRef = useRef(false);

  // Get the newest message ID (find the one with the latest createdAt)
  const newestMessageId = useMemo(() => {
    if (messages.length === 0) return null;
    return (
      messages.reduce(
        (newest, msg) => {
          if (!newest) return msg;
          return new Date(msg.createdAt || 0) > new Date(newest.createdAt || 0)
            ? msg
            : newest;
        },
        messages[0] as (typeof messages)[0] | null,
      )?._id ?? null
    );
  }, [messages]);

  // Scroll to bottom helper function
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, []);

  useEffect(() => {
    // Only scroll to bottom on initial load or when a NEW message is added (sent/received)
    // Don't scroll when loading older messages (which doesn't change the newest message)
    if (messages.length > 0 && newestMessageId && !showDMMenu) {
      const isNewMessageAdded =
        newestMessageId !== prevNewestMessageIdRef.current;
      const isInitialLoad = isInitialLoadRef.current;
      // Check if we just came back from DM menu (bundle sent)
      const justClosedDMMenu = wasShowingDMMenuRef.current && !showDMMenu;

      if (isInitialLoad || isNewMessageAdded || justClosedDMMenu) {
        scrollToBottom();
        isInitialLoadRef.current = false;
      }
    }

    prevNewestMessageIdRef.current = newestMessageId;
    wasShowingDMMenuRef.current = showDMMenu;
  }, [messages.length, newestMessageId, scrollToBottom, showDMMenu]);

  const handleDMMenuClick = () => {
    setShowDMMenu((prev) => {
      const next = !prev;
      setIsDmMenuSubmit(next);
      return next;
    });
  };

  const handleDmMenuSubmit = () => {
    dmMenuSubmitRef.current?.();
  };

  return (
    <section className="flex h-full w-full lg:w-[524px] flex-col mx-auto bg-[#111316]">
      <MessageContainerHeader receiver={receiver} />
      {showDMMenu ? (
        <DmMenuCreation
          setIsDemenuSubmitting={setIsDemenuSubmitting}
          // setShowPreview={setShowPreview}
          // showPreview={showPreview}
          onClose={() => {
            setShowDMMenu(false);
            setIsDmMenuSubmit(false);
            setShowPreview(false);
          }}
          receiver={receiver}
          onRegisterSubmit={(fn) => {
            dmMenuSubmitRef.current = fn;
          }}
          onCreationSuccess={() => setShowPreview(true)}
          conversationId={conversationId}
        />
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-scroll hidden_scrollbar"
        >
          {isLoading ? (
            <div className="flex-1 h-full flex items-center justify-center">
              <ComponentLoader />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Start a conversation with {receiver?.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Send a message to create this conversation
                </p>
              </div>
            </div>
          ) : (
            <MessageChatList
              messages={messages}
              currentUserId={sender?.discordId ?? ''}
              onRetryMessage={retryMessage}
              onMarkAsRead={markAsRead}
              isLoadingMore={isLoadingMore}
              hasMoreMessages={hasMoreMessages}
              onLoadOlder={loadOlderMessages}
              onReloadMessages={reload}
              onSendUnlockMessage={sendUnlockMessage}
              scrollRootRef={scrollContainerRef}
            />
          )}
        </div>
      )}

      <div className="w-full p-2">
        <MessageInput
          className="w-full"
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onMediaSelect={handleMediaSelect}
          isLoading={isLoading}
          senderId={sender?.discordId}
          receiverId={receiver?.discordId}
          receiverRole={receiver?.role}
          handleDMMenuClick={handleDMMenuClick}
          isDmMenuSubmit={isDmMenuSubmit}
          handleDmMenuSubmit={handleDmMenuSubmit}
          isDemenuSubmitting={isDemenuSubmitting}
          sendTipMessage={sendTipMessage}
        />
      </div>
    </section>
  );
};
