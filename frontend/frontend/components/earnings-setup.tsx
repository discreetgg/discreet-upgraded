import { Icon } from './ui/icons';
import { Separator } from './ui/separator';

export const EarningsSetup = () => {
  return (
    <div className='p-6 rounded-lg border border-[#1E1E21] space-y-8 my-1'>
      <div className='space-y-2.5 max-w-[402px]'>
        <h2 className='text-xl font-semibold text-[#F8F8F8]'>
          Complete your account setup
        </h2>
        <div className='space-y-1'>
          <p className='text-[15px] text-[#D4D4D8]'>
            Add some details to set up account to set up your creator's account
          </p>
          <span className='text-[#039855] font-light text-[15px]'>
            1 of 5 completed
          </span>
        </div>
      </div>
      <Separator />
      <div className='space-y-8'>
        <div className='flex justify-between'>
          <div className='flex gap-4 items-center'>
            <Icon.displayName />
            <span className='text-[15px] text-[#8A8C95] font-medium'>
              Add Your display Name
            </span>
          </div>
          <Icon.stepsDone />
        </div>
        <div className='flex justify-between items-center'>
          <div className='flex gap-4'>
            <Icon.setupImage />
            <div className='space-y-1 max-w-[413px] '>
              <p className='text-[15px] text-[#F8F8F8] font-medium'>
                Set Up Your Image
              </p>
              <p className='text-[#D4D4D8] text-sm '>
                Upload a profile image (you can either use your Discord avatar
                or upload a new image)
              </p>
            </div>
          </div>
          <Icon.stepsNotDone />
        </div>
        <div className='flex justify-between items-center'>
          <div className='flex gap-4'>
            <Icon.addPaymentMethod />
            <div className='space-y-1 max-w-[413px] '>
              <p className='text-[15px] text-[#F8F8F8] font-medium'>
                Add Payment Method
              </p>
              <p className='text-[#D4D4D8] text-sm '>
                Set up a payment method for receiving your earnings (via
                Coinsbee gift cards or other supported payout methods)
              </p>
            </div>
          </div>
          <Icon.stepsNotDone />
        </div>
        <div className='flex justify-between items-center'>
          <div className='flex gap-4'>
            <Icon.fundWallet />
            <div className='space-y-1 max-w-[413px] '>
              <p className='text-[15px] text-[#F8F8F8] font-medium'>
                Fund Your Wallet
              </p>
              <p className='text-[#D4D4D8] text-sm '>
                Add funds to your wallet using Helio or another supported
                payment method (credit card).
              </p>
            </div>
          </div>
          <Icon.stepsNotDone />
        </div>
        <div className='flex justify-between items-center'>
          <div className='flex gap-4'>
            <Icon.creatorSetup />
            <div className='space-y-1 max-w-[413px] '>
              <p className='text-[15px] text-[#F8F8F8] font-medium'>
                Creator Setup (For Creators Only)
              </p>
              <p className='text-[#D4D4D8] text-sm '>
                Write a brief bio to explain what kind of content you create &
                dd a preview of your content (like a demo video or sample image)
                to showcase your work.
              </p>
            </div>
          </div>
          <Icon.stepsNotDone />
        </div>
      </div>
    </div>
  );
};
