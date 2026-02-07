import { Subscriber } from './subscriber';
import { SubscriberListAll } from './subscription-list-all';
import { SubscriberListViewAll } from './subscription-list-view-all';

export const SubscriberList = () => {
  return (
    <div className='space-y-10'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg text-[#D4D4D8] font-medium'>Subscriber List</h2>
        <div className='flex items-center gap-2'>
          <SubscriberListAll />
          <SubscriberListViewAll />
        </div>
      </div>
      <div className='space-8'>
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
        <Subscriber />
      </div>
    </div>
  );
};
