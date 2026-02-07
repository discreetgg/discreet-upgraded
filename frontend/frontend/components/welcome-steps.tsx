import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';

export const WelcomeSteps = () => {
  return (
    <Accordion
      type='single'
      defaultValue='item-1'
      collapsible
      className='border-[#1E1E21] bg-[#0A0A0B] border shadow-[2px_2px_0_0_#1E1E21] cursor-pointer p-6 rounded-[8px]'
    >
      <AccordionItem value='item-1'>
        <AccordionTrigger className='pt-0 hover:no-underline'>
          <div className='space-y-2.5'>
            <h2 className='text-xl font-semibold text-[#F8F8F8]'>
              Welcome to Discreet
            </h2>
            <div className='space-y-1'>
              <p className='text-[15px] text-[#D4D4D8]'>
                Add some details to set up account{' '}
              </p>
              <span className='text-[#039855] font-light text-[15px]'>
                1 of 5 completed
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='space-y-8 pt-8'>
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
            <div className='flex justify-between'>
              <div className='flex gap-4 items-center'>
                <Icon.setupImage />
                <span className='text-[15px] text-[#F8F8F8] font-medium'>
                  Set Up Your Image
                </span>
              </div>
              <Icon.stepsNotDone />
            </div>
            <div className='flex justify-between'>
              <div className='flex gap-4 items-center'>
                <Icon.addPaymentMethod />
                <span className='text-[15px] text-[#F8F8F8] font-medium'>
                  Add Payment Method 
                </span>
              </div>
              <Icon.stepsNotDone />
            </div>
            <div className='flex justify-between'>
              <div className='flex gap-4 items-center'>
                <Icon.fundWallet />
                <span className='text-[15px] text-[#F8F8F8] font-medium'>
                  Fund Your Wallet
                </span>
              </div>
              <Icon.stepsNotDone />
            </div>
            <div className='flex justify-between'>
              <div className='flex gap-4 items-center'>
                <Icon.creatorSetup />
                <span className='text-[15px] text-[#F8F8F8] font-medium'>
                  Creator Setup (For Creators Only)
                </span>
              </div>
              <Icon.stepsNotDone />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
