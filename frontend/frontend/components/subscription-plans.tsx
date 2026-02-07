'use client';

import { useGlobal } from '@/context/global-context-provider';
import { getSubscriptionPlansService } from '@/lib/services';
import { IconMoodSad } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plan } from './plan';
import { ComponentLoader } from './ui/component-loader';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';

export const SubscriptionPlans = () => {
  const { user, subscriptionPlans, setSubscriptionPlans } = useGlobal();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await getSubscriptionPlansService(user?.discordId ?? '')
        .then((response) => {
          setSubscriptionPlans(response.data.plans);
        })
        .catch((error) => {
          console.error('Failed to fetch subscription plans:', error);
          toast.error('Failed to fetch subscription plans', {
            description: error.message,
            duration: 5000,
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    })();
  }, [user, setSubscriptionPlans]);

  return (
    <div className='space-y-8'>
      <h2 className='text-[15px] text-[#D4D4D8]'>Subscription Plans</h2>
      <div className='space-y-10'>
        {isLoading ? (
          <ComponentLoader />
        ) : subscriptionPlans ? (
          subscriptionPlans?.map((subscription) => (
            <Plan key={Math.random()} icon={Icon.all} plan={subscription} />
          ))
        ) : (
          <EmptyStates>
            <React.Fragment>
              <EmptyStates.Icon icon={IconMoodSad}>
                You've don't have any subscription plans yet.
              </EmptyStates.Icon>
            </React.Fragment>
          </EmptyStates>
        )}
      </div>
    </div>
  );
};
