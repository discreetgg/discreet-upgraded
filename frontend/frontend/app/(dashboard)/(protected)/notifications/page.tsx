import NotificationDetails from '@/components/notification-details';
import { TabLoadingSkeleton } from '@/components/tab-loading-skeleton';
import { Suspense } from 'react';

const NotificationDetailsFallback = () => {
  return <TabLoadingSkeleton variant="list" />;
};

const Page = () => {
  return (
    <Suspense fallback={<NotificationDetailsFallback />} >
      <NotificationDetails />
    </Suspense>
  );
};

export default Page;
