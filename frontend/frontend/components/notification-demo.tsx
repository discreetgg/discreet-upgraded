'use client';

import { Button } from '@/components/ui/button';
import { useNotification } from '@/hooks/use-notification';

export const NotificationDemo = () => {
  const {
    addUnreadMessage,
    markAsRead,
    clearNotifications,
    getUnreadCount,
    playNotificationSound,
  } = useNotification({
    soundEnabled: true,
    titleUpdates: true,
    faviconBadge: true,
  });

  return (
    <div className='p-6 space-y-4 max-w-md mx-auto'>
      <h2 className='text-xl font-bold'>Notification System Demo</h2>
      <p className='text-sm text-muted-foreground'>
        Test the notification features: sound, title updates, and favicon badge.
      </p>

      <div className='space-y-2'>
        <Button onClick={addUnreadMessage} className='w-full'>
          Simulate New Message
        </Button>

        <Button
          onClick={() => markAsRead(1)}
          variant='outline'
          className='w-full'
        >
          Mark 1 as Read
        </Button>

        <Button
          onClick={clearNotifications}
          variant='outline'
          className='w-full'
        >
          Clear All Notifications
        </Button>

        <Button
          onClick={playNotificationSound}
          variant='outline'
          className='w-full'
        >
          Test Sound Only
        </Button>
      </div>

      <div className='text-sm text-muted-foreground'>
        Current unread count: {getUnreadCount()}
      </div>

      <div className='text-xs text-muted-foreground space-y-1'>
        <p>• New messages will play a sound</p>
        <p>• Page title will show unread count</p>
        <p>• Favicon will show red dot badge</p>
        <p>• Notifications clear when tab gains focus</p>
      </div>
    </div>
  );
};
