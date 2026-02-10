import { useMessageSearch } from '@/context/message-search-context';
import type { MessageType } from '@/types/global';
import { format, parseISO } from 'date-fns';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import { MessageItem } from './message-item';
import { ComponentLoader } from './ui/component-loader';

interface MessageChatListProps {
  messages: MessageType[];
  currentUserId: string;
  onRetryMessage?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlder?: () => void;
  onReloadMessages?: () => Promise<void>;
  onSendUnlockMessage?: (
    messageId: string,
    price: string,
    sellerId: string,
  ) => Promise<void>;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
}

export const MessageChatList = ({
  messages,
  currentUserId,
  onRetryMessage,
  onMarkAsRead,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadOlder,
  onReloadMessages,
  onSendUnlockMessage,
  scrollRootRef,
}: MessageChatListProps) => {
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const hasIntersectedTopRef = useRef(false);
  const pendingJumpMessageIdRef = useRef<string | null>(null);
  const jumpLoadAttemptsRef = useRef(0);
  const MAX_JUMP_LOAD_ATTEMPTS = 20;
  type ScrollAnchor = {
    type: 'day' | 'message';
    key: string;
    topOffset: number;
  };
  const pendingPrependAdjustRef = useRef<{
    active: boolean;
    scrollTop: number;
    scrollHeight: number;
    anchor: ScrollAnchor | null;
  }>({
    active: false,
    scrollTop: 0,
    scrollHeight: 0,
    anchor: null,
  });
  const { searchValue, isSearchActive, setMatchingMessageIds } =
    useMessageSearch();

  const getVisibleAnchor = (root: HTMLDivElement): ScrollAnchor | null => {
    const rootRect = root.getBoundingClientRect();
    const entries: Array<{ top: number; anchor: ScrollAnchor }> = [];

    const labels = Array.from(
      root.querySelectorAll<HTMLElement>('[data-day-label]'),
    );
    for (const label of labels) {
      const key = label.dataset.dayLabel;
      if (!key) continue;
      const rect = label.getBoundingClientRect();
      if (rect.bottom <= rootRect.top || rect.top >= rootRect.bottom) continue;
      entries.push({
        top: rect.top - rootRect.top,
        anchor: { type: 'day', key, topOffset: rect.top - rootRect.top },
      });
    }

    const messages = Array.from(
      root.querySelectorAll<HTMLElement>('[data-message-id]'),
    );
    for (const message of messages) {
      const key = message.dataset.messageId;
      if (!key) continue;
      const rect = message.getBoundingClientRect();
      if (rect.bottom <= rootRect.top || rect.top >= rootRect.bottom) continue;
      entries.push({
        top: rect.top - rootRect.top,
        anchor: { type: 'message', key, topOffset: rect.top - rootRect.top },
      });
    }

    if (entries.length === 0) {
      return null;
    }

    entries.sort((a, b) => Math.abs(a.top) - Math.abs(b.top));
    return entries[0].anchor;
  };

  const highlightJumpTarget = (element: HTMLElement) => {
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
  };

  const scrollToMessageById = (messageId: string) => {
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
  };

  const tryLoadOlderForJump = () => {
    if (!pendingJumpMessageIdRef.current) {
      return;
    }

    if (!onLoadOlder || !hasMoreMessages || isLoadingMore) {
      return;
    }

    if (jumpLoadAttemptsRef.current >= MAX_JUMP_LOAD_ATTEMPTS) {
      pendingJumpMessageIdRef.current = null;
      jumpLoadAttemptsRef.current = 0;
      return;
    }

    jumpLoadAttemptsRef.current += 1;
    onLoadOlder();
  };

  // Filter messages that match the search term
  const matchingMessages = useMemo(() => {
    if (!isSearchActive) return [];
    if (!searchValue) return [];

    const searchTerm = searchValue.trim().toLowerCase();
    if (!searchTerm) return [];

    return messages.filter((message) =>
      message.text?.toLowerCase().includes(searchTerm)
    );
  }, [messages, searchValue, isSearchActive]);

  // Update the search context with matching message IDs
  useEffect(() => {
    const matchingIds = matchingMessages.map((msg) => msg._id);
    setMatchingMessageIds(matchingIds);
  }, [matchingMessages, setMatchingMessageIds]);

  // Memoize grouped messages to unnecessary recalculations
  const { grouped, dayKeys } = useMemo(() => {
    const sorted = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    );

    const groupedData = sorted.reduce((acc, message) => {
      const key = format(new Date(message.createdAt || Date.now()), 'yyyy-MM-dd'); // sortable
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(message);
      return acc;
    }, {} as Record<string, MessageType[]>);

    const keys = Object.keys(groupedData).sort((a, b) => a.localeCompare(b));

    return { grouped: groupedData, dayKeys: keys };
  }, [messages]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!onLoadOlder || !hasMoreMessages || isLoadingMore) return;
    const rootElement = scrollRootRef?.current ?? null;
    if (scrollRootRef && !rootElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (hasIntersectedTopRef.current || !hasMoreMessages || isLoadingMore) {
            return;
          }

          if (rootElement) {
            const anchor = getVisibleAnchor(rootElement);
            pendingPrependAdjustRef.current = {
              active: true,
              scrollTop: rootElement.scrollTop,
              scrollHeight: rootElement.scrollHeight,
              anchor,
            };
          }

          hasIntersectedTopRef.current = true;
          onLoadOlder();
          return;
        }

        hasIntersectedTopRef.current = false;
      },
      {
        root: rootElement,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const trigger = loadMoreTriggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }

    return () => {
      if (trigger) {
        observer.unobserve(trigger);
      }
    };
  }, [onLoadOlder, hasMoreMessages, isLoadingMore, scrollRootRef]);

  useLayoutEffect(() => {
    const root = scrollRootRef?.current;
    if (!root || isLoadingMore) {
      return;
    }

    const pending = pendingPrependAdjustRef.current;
    if (!pending.active) {
      return;
    }

    let adjusted = false;
    if (pending.anchor) {
      const selector =
        pending.anchor.type === 'day'
          ? `[data-day-label=\"${pending.anchor.key}\"]`
          : `[data-message-id=\"${pending.anchor.key}\"]`;
      const target = root.querySelector<HTMLElement>(selector);
      if (target) {
        const rootRect = root.getBoundingClientRect();
        const currentTop = target.getBoundingClientRect().top - rootRect.top;
        const delta = currentTop - pending.anchor.topOffset;
        if (Math.abs(delta) > 1) {
          root.scrollTop += delta;
        }
        adjusted = true;
      }
    }

    if (!adjusted) {
      const heightDelta = root.scrollHeight - pending.scrollHeight;
      if (heightDelta !== 0) {
        root.scrollTop = pending.scrollTop + heightDelta;
      }
    }

    pendingPrependAdjustRef.current = {
      active: false,
      scrollTop: 0,
      scrollHeight: 0,
      anchor: null,
    };
  }, [messages.length, isLoadingMore, scrollRootRef]);

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
  }, [hasMoreMessages, isLoadingMore, onLoadOlder, scrollRootRef]);

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
  }, [messages.length, hasMoreMessages, isLoadingMore, onLoadOlder, scrollRootRef]);

  return (
    <div className="p-4 space-y-6">
      {/* Load more trigger at the top */}
      {hasMoreMessages && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isLoadingMore && <ComponentLoader className="scale-75" />}
        </div>
      )}
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
                const messageKey = `${message._id}-${message.createdAt ?? 'no-time'}-${messageIndex}`;

                return (
                  <MessageItem
                    key={messageKey}
                    message={message}
                    isOwn={isOwn}
                    onRetryMessage={onRetryMessage}
                    onMarkAsRead={onMarkAsRead}
                    onReloadMessages={onReloadMessages}
                    onSendUnlockMessage={onSendUnlockMessage}
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
