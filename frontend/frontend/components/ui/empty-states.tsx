import { Button } from '@/components/ui/button';
import React from 'react';

const EmptyStatesWrapper = ({
  children,
  className,
}: { children: React.ReactElement; className?: string }) => {
  return (
    <div
      className={`mx-auto flex max-w-[212px] flex-col items-center gap-9 md:max-w-[246px] md:gap-[42px] ${className}`}
    >
      {children}
    </div>
  );
};

const EmptyIcon = ({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className='flex flex-col items-center gap-4 md:gap-5'>
    <Icon size='60' color='#4D4D4D' className='size-[57px] md:size-auto' />
    <p className='md:max-w-auto max-w-[182px] text-center text-sm text-[#B3B3B3]'>
      {children}
    </p>
  </div>
);

// Define the EmptyButton component
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ElementType;
  children: React.ReactNode;
}

const EmptyButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ icon: Icon, children, ...props }, ref) => (
    <Button
      className='rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]'
      ref={ref}
      {...props}
    >
      {Icon && <Icon size='15' />}
      {children}
    </Button>
  )
);

const EmptyStates = Object.assign(EmptyStatesWrapper, {
  Icon: EmptyIcon,
  Button: EmptyButton,
});

export { EmptyStates };
