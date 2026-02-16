import { useMessageSearch } from '@/context/message-search-context';
import type { MessageType } from '@/types/global';
import { format, parseISO } from 'date-fns';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { MessageItem } from './message-item';

interface MessageChatListProps {
  messages: MessageType[];
  currentUserId: string;
  onRetryMessage?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlder?: () => void;
  onReloadMessages?: () => Promise<void>;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  conversationKey?: string;
}

const MAX_JUMP_LOAD_ATTEMPTS = 20;
const AUTO_TOP_LOAD_COOLDOWN_MS = 220;
const PREPEND_LAYOUT_STABILIZE_MS = 900;
const AUTO_TOP_LOAD_SCROLL_THRESHOLD_PX = 72;

export const MessageChatList = ({
  messages,
  currentUserId,
  onRetryMessage,
  onMarkAsRead,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadOlder,
  onReloadMessages,
  scrollRootRef,
  conversationKey,
}: MessageChatListProps) => {
  const pendingJumpMessageIdRef = useRef<string | null>(null);
  const jumpLoadAttemptsRef = useRef(0);
  const lastSearchJumpKeyRef = useRef<string | null>(null);
  const lastConversationKeyRef = useRef<string | null>(null);
  const lastMatchingIdsKeyRef = useRef<string>('');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const autoTopLoadAtRef = useRef(0);
  const autoTopLoadLockedRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const prependCompensationRef = useRef<{
    active: boolean;
    lastContentHeight: number;
    disableTimer: number | null;
  }>({
    active: false,
    lastContentHeight: 0,
    disableTimer: null,
  });

  const pendingPrependAdjustRef = useRef<{
    active: boolean;
    scrollTop: number;
    scrollHeight: number;
    messageCount: number;
  }>({
    active: false,
    scrollTop: 0,
    scrollHeight: 0,
    messageCount: 0,
  });

  const {
    searchValue,
    isSearchActive,
    setMatchingMessageIds,
    matchingMessageIds,
    currentMatchIndex,
  } = useMessageSearch();
  const [promotedMessageOrder, setPromotedMessageOrder] = useState<
    Record<string, number>
  >({});

  const getEffectiveSortTime = useCallback(
    (message: MessageType) => {
      const promotedAt = promotedMessageOrder[message._id];
      if (typeof promotedAt === 'number' && Number.isFinite(promotedAt)) {
        return promotedAt;
      }
      return new Date(message.createdAt || 0).getTime();
    },
    [promotedMessageOrder],
  );

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aSortTime = getEffectiveSortTime(a);
      const bSortTime = getEffectiveSortTime(b);
      if (aSortTime !== bSortTime) {
        return aSortTime - bSortTime;
      }

      return (
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
      );
    });
  }, [getEffectiveSortTime, messages]);

  const visibleMessages = sortedMessages;

  useEffect(() => {
    const key = conversationKey ?? '__default_conversation__';
    if (lastConversationKeyRef.current === key) {
      return;
    }
    lastConversationKeyRef.current = key;
    pendingJumpMessageIdRef.current = null;
    jumpLoadAttemptsRef.current = 0;
    setPromotedMessageOrder({});
  }, [conversationKey]);

  const matchingMessages = useMemo(() => {
    if (!isSearchActive) return [];
    if (!searchValue) return [];

    const searchTerm = searchValue.trim().toLowerCase();
    if (!searchTerm) return [];

    return sortedMessages.filter((message) =>
      message.text?.toLowerCase().includes(searchTerm),
    );
  }, [sortedMessages, searchValue, isSearchActive]);

  useEffect(() => {
    const matchingIds = matchingMessages.map((message) => message._id);
    const matchingIdsKey = matchingIds.join('|');
    if (lastMatchingIdsKeyRef.current === matchingIdsKey) {
      return;
    }
    lastMatchingIdsKeyRef.current = matchingIdsKey;
    setMatchingMessageIds(matchingIds);
  }, [matchingMessages, setMatchingMessageIds]);

  const { grouped, dayKeys } = useMemo(() => {
    const groupedData = visibleMessages.reduce((accumulator, message) => {
      const effectiveTimestamp = getEffectiveSortTime(message);
      const key = format(
        new Date(
          Number.isFinite(effectiveTimestamp)
            ? effectiveTimestamp
            : Date.now(),
        ),
        'yyyy-MM-dd',
      );
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(message);
      return accumulator;
    }, {} as Record<string, MessageType[]>);

    const keys = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));

    return { grouped: groupedData, dayKeys: keys };
  }, [getEffectiveSortTime, visibleMessages]);

  const handlePromoteMessage = useCallback(
    (messageId: string) => {
      if (!messageId) {
        return;
      }

      const currentMaxSortTime = messages.reduce((maxValue, message) => {
        return Math.max(maxValue, getEffectiveSortTime(message));
      }, Date.now());
      const promotedAt = currentMaxSortTime + 1;
      setPromotedMessageOrder((previous) => ({
        ...previous,
        [messageId]: Math.max(previous[messageId] ?? 0, promotedAt),
      }));

      const root = scrollRootRef?.current;
      if (!root) {
        return;
      }

      requestAnimationFrame(() => {
        root.scrollTo({
          top: root.scrollHeight,
          behavior: 'smooth',
        });
      });
    },
    [getEffectiveSortTime, messages, scrollRootRef],
  );

  const schedulePrependCompensationReset = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const state = prependCompensationRef.current;
    if (state.disableTimer !== null) {
      window.clearTimeout(state.disableTimer);
    }

    state.disableTimer = window.setTimeout(() => {
      prependCompensationRef.current.active = false;
      prependCompensationRef.current.disableTimer = null;
    }, PREPEND_LAYOUT_STABILIZE_MS);
  }, []);

  const enablePrependCompensation = useCallback(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    prependCompensationRef.current.active = true;
    prependCompensationRef.current.lastContentHeight = content.scrollHeight;
    schedulePrependCompensationReset();
  }, [schedulePrependCompensationReset]);

  const preparePrependAdjustment = useCallback(() => {
    const root = scrollRootRef?.current;
    if (!root) {
      return;
    }

    pendingPrependAdjustRef.current = {
      active: true,
      scrollTop: root.scrollTop,
      scrollHeight: root.scrollHeight,
      messageCount: visibleMessages.length,
    };
    enablePrependCompensation();
  }, [
    enablePrependCompensation,
    scrollRootRef,
    visibleMessages.length,
  ]);

  const highlightJumpTarget = useCallback((element: HTMLElement) => {
    const previousTransition = element.style.transition;
    const previousBoxShadow = element.style.boxShadow;

    element.style.transition = 'box-shadow 160ms ease';
    element.style.boxShadow = '0 0 0 2px rgba(255, 0, 127, 0.8)';
    window.setTimeout(() => {
      element.style.boxShadow = previousBoxShadow;
      window.setTimeout(() => {
        element.style.transition = previousTransition;
      }, 180);
    }, 900);
  }, []);

  const scrollToMessageById = useCallback(
    (messageId: string) => {
      const root = scrollRootRef?.current ?? null;
      const queryRoot: ParentNode = root ?? document;
      const target = queryRoot.querySelector<HTMLElement>(
        `[data-message-id="${messageId}"]`,
      );

      if (!target) {
        return false;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      highlightJumpTarget(target);
      return true;
    },
    [highlightJumpTarget, scrollRootRef],
  );

  const tryLoadOlderForJump = useCallback(() => {
    const pendingMessageId = pendingJumpMessageIdRef.current;
    if (!pendingMessageId) {
      return;
    }

    if (!onLoadOlder || !hasMoreMessages || isLoadingMore) {
      if (!hasMoreMessages) {
        pendingJumpMessageIdRef.current = null;
        jumpLoadAttemptsRef.current = 0;
      }
      return;
    }

    if (jumpLoadAttemptsRef.current >= MAX_JUMP_LOAD_ATTEMPTS) {
      pendingJumpMessageIdRef.current = null;
      jumpLoadAttemptsRef.current = 0;
      return;
    }

    jumpLoadAttemptsRef.current += 1;
    preparePrependAdjustment();
    onLoadOlder();
  }, [
    hasMoreMessages,
    isLoadingMore,
    onLoadOlder,
    preparePrependAdjustment,
  ]);

  const triggerAutoTopLoad = useCallback(() => {
    if (isLoadingMore) {
      return false;
    }

    if (!onLoadOlder || !hasMoreMessages) {
      return false;
    }

    const now = Date.now();
    if (now - autoTopLoadAtRef.current < AUTO_TOP_LOAD_COOLDOWN_MS) {
      return false;
    }

    autoTopLoadAtRef.current = now;
    preparePrependAdjustment();
    onLoadOlder();
    return true;
  }, [
    hasMoreMessages,
    isLoadingMore,
    onLoadOlder,
    preparePrependAdjustment,
  ]);

  useEffect(() => {
    autoTopLoadAtRef.current = 0;
    autoTopLoadLockedRef.current = false;
    lastScrollTopRef.current = 0;
  }, [conversationKey]);

  useEffect(() => {
    const root = scrollRootRef?.current;
    if (!root) {
      return;
    }

    lastScrollTopRef.current = root.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = root.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      lastScrollTopRef.current = currentScrollTop;

      if (!isScrollingUp) {
        if (currentScrollTop > AUTO_TOP_LOAD_SCROLL_THRESHOLD_PX) {
          autoTopLoadLockedRef.current = false;
        }
        return;
      }

      if (root.scrollTop > AUTO_TOP_LOAD_SCROLL_THRESHOLD_PX) {
        autoTopLoadLockedRef.current = false;
        return;
      }

      if (autoTopLoadLockedRef.current) {
        return;
      }

      const triggered = triggerAutoTopLoad();
      if (triggered) {
        autoTopLoadLockedRef.current = true;
      }
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    return () => root.removeEventListener('scroll', handleScroll);
  }, [conversationKey, scrollRootRef, triggerAutoTopLoad]);

  useLayoutEffect(() => {
    const root = scrollRootRef?.current;
    if (!root) {
      return;
    }

    const pending = pendingPrependAdjustRef.current;
    if (!pending.active) {
      return;
    }

    const resetPendingPrependAdjustment = () => {
      pendingPrependAdjustRef.current = {
        active: false,
        scrollTop: 0,
        scrollHeight: 0,
        messageCount: 0,
      };
      autoTopLoadLockedRef.current = false;
    };

    const hasPrependedMessages = visibleMessages.length > pending.messageCount;
    if (!hasPrependedMessages) {
      if (isLoadingMore) {
        // Wait until older messages are actually inserted.
        return;
      }

      // Loading completed without unseen prepend.
      resetPendingPrependAdjustment();
      return;
    }

    const heightDelta = root.scrollHeight - pending.scrollHeight;
    if (heightDelta !== 0) {
      root.scrollTop = pending.scrollTop + heightDelta;
    }
    // Baseline compensation from the post-prepend height so ResizeObserver
    // only handles late media/layout growth and not the initial prepend delta.
    prependCompensationRef.current.lastContentHeight = root.scrollHeight;

    resetPendingPrependAdjustment();
  }, [isLoadingMore, scrollRootRef, visibleMessages.length]);

  useEffect(() => {
    const root = scrollRootRef?.current;
    const content = contentRef.current;
    if (!root || !content || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      const state = prependCompensationRef.current;
      if (!state.active) {
        return;
      }

      const nextContentHeight = content.scrollHeight;
      const heightDelta = nextContentHeight - state.lastContentHeight;
      if (heightDelta !== 0) {
        root.scrollTop += heightDelta;
        state.lastContentHeight = nextContentHeight;
        schedulePrependCompensationReset();
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [
    conversationKey,
    schedulePrependCompensationReset,
    scrollRootRef,
    visibleMessages.length,
  ]);

  useEffect(
    () => () => {
      if (typeof window === 'undefined') {
        return;
      }
      const timer = prependCompensationRef.current.disableTimer;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const jumpEvent = event as CustomEvent<{ messageId?: string }>;
      const messageId = jumpEvent.detail?.messageId;
      if (!messageId) {
        return;
      }

      pendingJumpMessageIdRef.current = messageId;
      jumpLoadAttemptsRef.current = 0;

      const found = scrollToMessageById(messageId);
      if (found) {
        pendingJumpMessageIdRef.current = null;
        return;
      }

      tryLoadOlderForJump();
    };

    window.addEventListener('messages:jump-to', handler as EventListener);
    return () => {
      window.removeEventListener('messages:jump-to', handler as EventListener);
    };
  }, [scrollToMessageById, tryLoadOlderForJump]);

  useEffect(() => {
    if (
      !isSearchActive ||
      currentMatchIndex < 0 ||
      currentMatchIndex >= matchingMessageIds.length
    ) {
      lastSearchJumpKeyRef.current = null;
      return;
    }

    const messageId = matchingMessageIds[currentMatchIndex];
    if (!messageId) {
      return;
    }

    const jumpKey = `${currentMatchIndex}:${messageId}`;
    if (lastSearchJumpKeyRef.current === jumpKey) {
      return;
    }
    lastSearchJumpKeyRef.current = jumpKey;

    pendingJumpMessageIdRef.current = messageId;
    jumpLoadAttemptsRef.current = 0;

    const found = scrollToMessageById(messageId);
    if (found) {
      pendingJumpMessageIdRef.current = null;
      return;
    }

    tryLoadOlderForJump();
  }, [
    currentMatchIndex,
    isSearchActive,
    matchingMessageIds,
    scrollToMessageById,
    tryLoadOlderForJump,
  ]);

  useEffect(() => {
    const pendingId = pendingJumpMessageIdRef.current;
    if (!pendingId) {
      return;
    }

    const found = scrollToMessageById(pendingId);
    if (found) {
      pendingJumpMessageIdRef.current = null;
      jumpLoadAttemptsRef.current = 0;
      return;
    }

    tryLoadOlderForJump();
  }, [
    hasMoreMessages,
    isLoadingMore,
    scrollToMessageById,
    tryLoadOlderForJump,
    visibleMessages.length,
  ]);

  return (
    <div ref={contentRef} className="p-4 space-y-6">
      {dayKeys.map((dayKey) => {
        const dayMessages = grouped[dayKey];
        const label = format(parseISO(dayKey), 'MMMM dd, yyyy');

        return (
          <div key={dayKey}>
            <p
              data-day-label={dayKey}
              className="text-center text-xs font-light text-[#D4D4D8] mb-4"
            >
              {label}
            </p>

            <div className="space-y-5">
              {dayMessages.map((message, messageIndex) => {
                const isOwn = message.sender.discordId === currentUserId;
                const messageKey = message._id || `message-${dayKey}-${messageIndex}`;

                return (
                  <MessageItem
                    key={messageKey}
                    message={message}
                    isOwn={isOwn}
                    onRetryMessage={onRetryMessage}
                    onMarkAsRead={onMarkAsRead}
                    onReloadMessages={onReloadMessages}
                    onPromoteMessage={handlePromoteMessage}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
