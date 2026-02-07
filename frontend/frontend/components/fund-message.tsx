import type React from 'react';
import { DialogClose } from './ui/dialog';

export const FundMessage = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  title: string;
  description: string;
  action: string;
}) => {
  return (
    <div className='space-y-[60px] max-w-[479px] flex flex-col items-center'>
      <div className='p-[19.048px] rounded-[9.524px] border-[#FF0065] border-[2.381px] bg-[#0A0A0B] shadow-[4px_4px_0_0_#FF007F] w-max'>
        <Icon />
      </div>
      <div className='m space-y-[26px]'>
        <h2 className='text-[32px] font-semibold text-[#F8F8F8] text-center'>
          {title}
        </h2>
        <p className='text-center text-[15px] font-light '>{description}</p>
      </div>
      <DialogClose className='rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full text-lg'>
        {action}
      </DialogClose>
    </div>
  );
};
