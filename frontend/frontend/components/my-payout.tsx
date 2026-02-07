import { MyPayoutBalance } from './my-payout-balance';
import { MyPayoutHistory } from './my-payout-history';

export const MyPayout = () => {
  return (
    <div className='py-6 space-y-6'>
      <MyPayoutBalance />
      <MyPayoutHistory />
    </div>
  );
};
