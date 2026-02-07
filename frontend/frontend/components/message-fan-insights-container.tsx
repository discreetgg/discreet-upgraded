import { useEffect, useState } from 'react';
import { ComponentLoader } from './ui/component-loader';
import { getFanInsightsService } from '@/lib/services';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';

type FanInsightsType = {
  highestPayment: number;
  lastPayment: {
    amount: number;
    createdAt: string;
    status: string;
    type: string;
  };
  totalAmount: number;
  typeBreakdown: {
    [key: string]: number;
  };
};

export const MessageFanInsightsContainer = () => {
  const { user } = useGlobal();
  const { receiver } = useMessage();

  const [fanInsights, setFanInsights] = useState<FanInsightsType>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await getFanInsightsService({
        buyerId: user?.discordId || '',
        sellerId: receiver?.discordId || '',
      })
        .then((data) => {
          setFanInsights(data);
        })
        .catch((error) => {
          console.error('Error fetching fan insights:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    })();
  }, [user?.discordId, receiver?.discordId]);

  console.log(fanInsights);

  if (loading) {
    return <ComponentLoader />;
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-2.5">
        <div className="rounded-[8px] bg-[#1F222759] w-full space-y-[7px] p-2.5">
          <p className="text-[#8A8C95] text-[10px] font-medium text-center">
            Tips
          </p>
          <p className="text-xs text-[#D4D4D8] font-medium text-center">
            ${fanInsights?.typeBreakdown?.TIP?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-[8px] bg-[#1F222759] w-full space-y-[7px] p-2.5">
          <p className="text-[#8A8C95] text-[10px] font-medium text-center">
            Images
          </p>
          <p className="text-xs text-[#D4D4D8] font-medium text-center">
            ${fanInsights?.typeBreakdown?.IMAGE?.toLocaleString() ?? 0}
          </p>
        </div>
        {/* <div className='rounded-[8px] bg-[#1F222759] w-full space-y-[7px] p-2.5'>
          <p className='text-[#8A8C95] text-[10px] font-medium text-center'>
            Subscribed
          </p>
          <p className='text-xs text-[#D4D4D8] font-medium text-center'>
            $0.00
          </p>
        </div> */}
        <div className="rounded-[8px] bg-[#1F222759] w-full space-y-[7px] p-2.5">
          <p className="text-[#8A8C95] text-[10px] font-medium text-center">
            Total Spent
          </p>
          <p className="text-xs text-[#D4D4D8] font-medium text-center">
            ${fanInsights?.totalAmount.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-[8px] bg-[#1F222759] w-full space-y-[7px] p-2.5">
          <p className="text-[#8A8C95] text-[10px] font-medium text-center">
            Menu
          </p>
          <p className="text-xs text-[#D4D4D8] font-medium text-center">
            ${fanInsights?.typeBreakdown?.MENU_PURCHASE?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>
      <div className="rounded-[8px] bg-[#1F222759] w-full space-y-[17px] p-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[#8A8C95] text-[10px] font-medium">Last Paid</p>
          <p className="text-xs text-[#D4D4D8] font-medium">
            ${fanInsights?.lastPayment?.amount.toLocaleString() ?? 0}
          </p>
        </div>
        {/* <div className='flex items-center justify-between'>
          <p className='text-[#8A8C95] text-[10px] font-medium'>User Type</p>
          <p className='text-xs text-[#D4D4D8] font-medium'>Subscriber</p>
        </div> */}
        <div className="flex items-center justify-between">
          <p className="text-[#8A8C95] text-[10px] font-medium">
            Highest Purchase
          </p>
          <p className="text-xs text-[#D4D4D8] font-medium">
            ${fanInsights?.highestPayment.toLocaleString() ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
};
