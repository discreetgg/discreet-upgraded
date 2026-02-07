import NotificationDetails from '@/components/notification-details';
import { Suspense } from 'react';

const NotificationDetailsFallback = () => {
  return (
    <div className="flex flex-col border-t border-[#1E1E21] rounded-lg mt-[17px] py-8">
      <p className="text-center text-[#8A8C95] text-[15px]">Loading notifications...</p>
    </div>
  );
};

const Page = () => {
  return (
    <Suspense fallback={<NotificationDetailsFallback />} >
      <NotificationDetails />
    </Suspense>
  );
};

export default Page;