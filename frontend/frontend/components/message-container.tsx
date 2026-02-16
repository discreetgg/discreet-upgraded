'use client';

import { useChat } from '@/hooks/use-chat';
import type { AuthorType } from '@/types/global';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageChatList } from './message-chat-list';
import { MessageContainerHeader } from './message-container-header';
import { MessageInput } from './message-input';
import { ComponentLoader } from './ui/component-loader';
import { DmMenuCreation } from './dm-menu-creation';

const BOTTOM_STICK_THRESHOLD_PX = 96;

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
    reload,
  } = useChat(sender, receiver?.discordId ?? '', conversationId);

  const [showDMMenu, setShowDMMenu] = useState(false);
  const [isDmMenuSubmit, setIsDmMenuSubmit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDemenuSubmitting, setIsDemenuSubmitting] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const dmMenuSubmitRef = useRef<(() => void) | null>(null);
  const prevNewestMessageIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const wasShowingDMMenuRef = useRef(false);
  const isAtBottomRef = useRef(true);

  // Keep direct access to the newest message for scroll decisions.
  const newestMessage = useMemo(() => {
    if (messages.length === 0) return null;
    return messages.reduce(
      (newest, msg) => {
        if (!newest) return msg;
        return new Date(msg.createdAt || 0) > new Date(newest.createdAt || 0)
          ? msg
          : newest;
      },
      messages[0] as (typeof messages)[0] | null,
    );
  }, [messages]);
  const newestMessageId = newestMessage?._id ?? null;

  const isNearBottom = useCallback(() => {
    const root = scrollContainerRef.current;
    if (!root) {
      return true;
    }

    const distanceToBottom =
      root.scrollHeight - (root.scrollTop + root.clientHeight);
    return distanceToBottom <= BOTTOM_STICK_THRESHOLD_PX;
  }, []);

  // Scroll to bottom helper function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior,
          });
          isAtBottomRef.current = true;
          setShowJumpToLatest(false);
        }
      });
    }
  }, []);

  useEffect(() => {
    isInitialLoadRef.current = true;
    isAtBottomRef.current = true;
    setShowJumpToLatest(false);
  }, [conversationId]);

  useLayoutEffect(() => {
    if (isLoading || showDMMenu || messages.length === 0) {
      return;
    }

    if (!isInitialLoadRef.current) {
      return;
    }

    const root = scrollContainerRef.current;
    if (!root) {
      return;
    }

    root.scrollTop = root.scrollHeight;
    isInitialLoadRef.current = false;
    isAtBottomRef.current = true;
    setShowJumpToLatest(false);
  }, [conversationId, isLoading, messages.length, showDMMenu]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) {
      return;
    }

    const handleScroll = () => {
      const atBottom = isNearBottom();
      isAtBottomRef.current = atBottom;
      if (atBottom) {
        setShowJumpToLatest(false);
      }
    };

    handleScroll();
    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => root.removeEventListener('scroll', handleScroll);
  }, [conversationId, isNearBottom]);

  useEffect(() => {
    // Only scroll to bottom on initial load or when a NEW message is added (sent/received)
    // Don't scroll when loading older messages (which doesn't change the newest message)
    if (messages.length > 0 && newestMessageId && !showDMMenu) {
      const isNewMessageAdded =
        newestMessageId !== prevNewestMessageIdRef.current;
      const isInitialLoad = isInitialLoadRef.current;
      // Check if we just came back from DM menu (bundle sent)
      const justClosedDMMenu = wasShowingDMMenuRef.current && !showDMMenu;
      const newestMessageFromCurrentUser =
        newestMessage?.sender.discordId === sender?.discordId;

      if (isInitialLoad || justClosedDMMenu) {
        scrollToBottom();
        isInitialLoadRef.current = false;
      } else if (isNewMessageAdded) {
        if (newestMessageFromCurrentUser || isAtBottomRef.current) {
          scrollToBottom();
        } else {
          setShowJumpToLatest(true);
        }
      }
    }

    prevNewestMessageIdRef.current = newestMessageId;
    wasShowingDMMenuRef.current = showDMMenu;
  }, [
    messages.length,
    newestMessage,
    newestMessageId,
    scrollToBottom,
    sender?.discordId,
    showDMMenu,
  ]);

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
    <section className="flex h-full min-h-0 w-full lg:w-[524px] flex-col mx-auto bg-[#111316]">
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
        <div className="relative flex-1 min-h-0">
          {isLoadingMore && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#FF007F] to-transparent animate-pulse" />
              <div className="mx-auto mt-2 w-fit rounded-full border border-white/15 bg-[#1E2128]/95 px-3 py-1 text-[11px] text-[#D4D4D8] shadow-lg shadow-black/30">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 animate-spin rounded-full border-2 border-[#70788C] border-t-[#FF007F]" />
                  Loading older messages...
                </span>
              </div>
            </div>
          )}
          <div
            ref={scrollContainerRef}
            className="h-full w-full overflow-y-scroll hidden_scrollbar"
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
                scrollRootRef={scrollContainerRef}
                conversationKey={conversationId}
              />
            )}
          </div>

          {showJumpToLatest && messages.length > 0 && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-[#1E2128] px-3 py-1.5 text-xs text-white shadow-lg shadow-black/30 hover:bg-[#262A33] transition-colors"
            >
              Jump to latest
            </button>
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
