import { Button } from './ui/button';

export const AddPayoutConnectBank = ({
  icon: Icon,
  title,
  description,
}: {
  title: string;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}) => {
  return (
    <div className='rounded-lg bg-[#1E1E21] p-4 space-y-2.5 flex-1'>
      <div className='flex items-center gap-2 justify-between'>
        <Icon />
        <Button variant='ghost' className='text-[#FF007F] font-light text-sm '>
          Connect
        </Button>
      </div>
      <div className='space-y-2'>
        <span>{title}</span>
        <p className='text-base text-[#8A8C95] font-light'>{description}</p>
      </div>
    </div>
  );
};
