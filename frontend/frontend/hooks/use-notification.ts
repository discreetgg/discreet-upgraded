import { useCallback, useEffect, useRef } from 'react';

interface UseNotificationOptions {
  soundEnabled?: boolean;
  titleUpdates?: boolean;
  faviconBadge?: boolean;
}

export const useNotification = (options: UseNotificationOptions = {}) => {
  const {
    soundEnabled = true,
    titleUpdates = true,
    faviconBadge = true,
  } = options;

  const originalTitle = useRef<string>('');
  const originalFavicon = useRef<string>('');
  const unreadCount = useRef<number>(0);
  const titleInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize original values
  useEffect(() => {
    originalTitle.current = document.title;
    const faviconLink = document.querySelector(
      'link[rel*="icon"]'
    ) as HTMLLinkElement;
    if (faviconLink) {
      originalFavicon.current = faviconLink.href;
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create a simple notification sound using Web Audio API
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  // Update page title with unread count
  const updateTitle = useCallback(
    (count: number) => {
      if (!titleUpdates) return;

      if (count > 0) {
        document.title = `(${count}) ${originalTitle.current}`;

        // Add blinking effect
        if (titleInterval.current) {
          clearInterval(titleInterval.current);
        }

        titleInterval.current = setInterval(() => {
          if (document.title.startsWith('•')) {
            document.title = `(${count}) ${originalTitle.current}`;
          } else {
            document.title = `• New Message • ${originalTitle.current}`;
          }
        }, 1000);
      } else {
        document.title = originalTitle.current;
        if (titleInterval.current) {
          clearInterval(titleInterval.current);
          titleInterval.current = null;
        }
      }
    },
    [titleUpdates]
  );

  // Create favicon with red dot badge
  const createBadgedFavicon = useCallback(() => {
    if (!faviconBadge) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 32;
    canvas.height = 32;

    img.onload = () => {
      if (!ctx) return;

      // Draw original favicon
      ctx.drawImage(img, 0, 0, 32, 32);

      // Draw red badge
      ctx.beginPath();
      ctx.arc(24, 8, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();

      // Add white border to badge
      ctx.beginPath();
      ctx.arc(24, 8, 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Update favicon
      const link = document.querySelector(
        'link[rel*="icon"]'
      ) as HTMLLinkElement;
      if (link) {
        link.href = canvas.toDataURL('image/png');
      }
    };

    img.src = originalFavicon.current || '/favicon.ico';
  }, [faviconBadge]);

  // Restore original favicon
  const restoreOriginalFavicon = useCallback(() => {
    if (!faviconBadge) return;

    const link = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
    if (link && originalFavicon.current) {
      link.href = originalFavicon.current;
    }
  }, [faviconBadge]);

  // Add unread message
  const addUnreadMessage = useCallback(() => {
    unreadCount.current += 1;
    playNotificationSound();
    updateTitle(unreadCount.current);
    createBadgedFavicon();
  }, [playNotificationSound, updateTitle, createBadgedFavicon]);

  // Mark messages as read
  const markAsRead = useCallback(
    (count = 0) => {
      unreadCount.current = Math.max(
        0,
        unreadCount.current - (count || unreadCount.current)
      );

      if (unreadCount.current === 0) {
        updateTitle(0);
        restoreOriginalFavicon();
      } else {
        updateTitle(unreadCount.current);
      }
    },
    [updateTitle, restoreOriginalFavicon]
  );

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    unreadCount.current = 0;
    updateTitle(0);
    restoreOriginalFavicon();
  }, [updateTitle, restoreOriginalFavicon]);

  // Get current unread count
  const getUnreadCount = useCallback(() => unreadCount.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (titleInterval.current) {
        clearInterval(titleInterval.current);
      }
      document.title = originalTitle.current;
      restoreOriginalFavicon();
    };
  }, [restoreOriginalFavicon]);

  // Handle visibility change (clear notifications when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && unreadCount.current > 0) {
        // Optional: Auto-clear notifications when user comes back to tab
        // clearNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    addUnreadMessage,
    markAsRead,
    clearNotifications,
    getUnreadCount,
    playNotificationSound,
  };
};
