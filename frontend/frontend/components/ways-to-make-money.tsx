import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icon } from './ui/icons';

export const WaysToMakeMoney = () => {
  return (
    <Accordion
      type='single'
      collapsible
      defaultValue='item-1'
      className='border-[#1E1E21] bg-[#0A0A0B] sticky top-5 border shadow-[2px_2px_0_0_#1E1E21] cursor-pointer p-6 rounded-[8px]'
    >
      <AccordionItem value='item-1'>
        <AccordionTrigger className='pt-0 hover:no-underline'>
          <div className='space-y-2.5'>
            <h2 className='text-xl font-semibold text-[#F8F8F8]'>
              Ways to make money{' '}
            </h2>

            <p className='text-[15px] text-[#D4D4D8]'>
              Discreet allows creators to upload and sell content{' '}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent className='space-y-8 pt-8'>
          <div className='h-px bg-[#1E1E21]' />
          <div className='space-y-8'>
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
