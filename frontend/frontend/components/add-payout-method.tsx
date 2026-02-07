import { AddPayoutConnectBank } from './add-payout-connect-bank';
import { Icon } from './ui/icons';

export const AddPaymentMethod = () => {
  return (
    <div className='space-y-6'>
      <h2 className='text-lg text-[#D4D4D8] font-medium'>
        Add a payout method
      </h2>
      <div className='flex gap-2 items-center w-full'>
        <AddPayoutConnectBank
          title='Bank account'
          description='Connect your bank account'
          icon={Icon.bank}
        />
        <AddPayoutConnectBank
          title='PayPal'
          description='Connect your PayPal account'
          icon={Icon.paypal}
        />
      </div>
    </div>
  );
};
