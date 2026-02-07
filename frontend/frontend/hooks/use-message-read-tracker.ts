import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMessageReadTrackerOptions {
  threshold?: number; // How long a message needs to be in view to be marked as read (ms)
  rootMargin?: string; // Intersection Observer root margin
}

export const useMessageReadTracker = (
  options: UseMessageReadTrackerOptions = {}
) => {
  const { threshold = 1000, rootMargin = '0px 0px -50% 0px' } = options;

  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(
    new Set()
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const readMessagesRef = useRef<Set<string>>(new Set());

  // Callback for when a message should be marked as read - use ref to avoid recreating observer
  const onMarkAsReadRef = useRef<((messageId: string) => void) | null>(null);

  const setMarkAsReadCallback = useCallback(
    (callback: (messageId: string) => void) => {
      onMarkAsReadRef.current = callback;
    },
    []
  );

  // Initialize intersection observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) continue;

          if (entry.isIntersecting) {
            setVisibleMessages((prev) => new Set([...prev, messageId]));

            // Set timeout to mark as read after threshold
            const timeoutId = setTimeout(() => {
              if (!readMessagesRef.current.has(messageId) && onMarkAsReadRef.current) {
                readMessagesRef.current.add(messageId);
                onMarkAsReadRef.current(messageId);
              }
            }, threshold);

            timeoutsRef.current.set(messageId, timeoutId);
          } else {
            setVisibleMessages((prev) => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });

            // Clear timeout if message goes out of view
            const timeoutId = timeoutsRef.current.get(messageId);
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutsRef.current.delete(messageId);
            }
          }
        }
      },
      {
        rootMargin,
        threshold: 0.5, // Message needs to be 50% visible
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Clear all timeouts
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
    };
  }, [threshold, rootMargin]);

  // Observe a message element
  const observeMessage = useCallback(
    (element: HTMLElement | null, messageId: string) => {
      if (!element) return;
      if (!observerRef.current) return;
      if (!messageId) return;

      element.setAttribute('data-message-id', messageId);
      observerRef.current.observe(element);

      return () => {
        if (observerRef.current && element) {
          observerRef.current.unobserve(element);
        }
        // Clear timeout for this message
        const timeoutId = timeoutsRef.current.get(messageId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutsRef.current.delete(messageId);
        }
      };
    },
    []
  );

  // Manually mark a message as read
  const markMessageAsRead = useCallback(
    (messageId: string) => {
      if (!readMessagesRef.current.has(messageId) && onMarkAsReadRef.current) {
        readMessagesRef.current.add(messageId);
        onMarkAsReadRef.current(messageId);

        // Clear any pending timeout
        const timeoutId = timeoutsRef.current.get(messageId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutsRef.current.delete(messageId);
        }
      }
    },
    []
  );

  // Check if a message has been marked as read
  const isMessageRead = useCallback((messageId: string) => {
    return readMessagesRef.current.has(messageId);
  }, []);

  // Reset read status (useful for conversation changes)
  const resetReadStatus = useCallback(() => {
    readMessagesRef.current.clear();
    setVisibleMessages(new Set());
    // Clear all timeouts
    for (const timeout of timeoutsRef.current.values()) {
      clearTimeout(timeout);
    }
    timeoutsRef.current.clear();
  }, []);

  return {
    visibleMessages,
    observeMessage,
    markMessageAsRead,
    isMessageRead,
    resetReadStatus,
    setMarkAsReadCallback,
  };
};
