import { SubscriberList } from './subscriber-list';
import { SubscriptionPlans } from './subscription-plans';
import { SubscriptionStat } from './subscription-stat';
import { Separator } from './ui/separator';

export const SubscriptionsContent = () => {
  return (
    <div className='p-8 rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10'>
      <SubscriptionStat />
      <Separator />
      <SubscriptionPlans />
      <Separator />
      <SubscriberList />
    </div>
  );
};
