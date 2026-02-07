import { cn } from '@/lib/utils';
import { Icon } from './ui/icons';

type PlanKey = 'essential_plan' | 'green_plan' | 'cool_plan';

type PlanTypeProps = {
  type: PlanKey;
  className?: string;
};

const planConfig: Record<
  PlanKey,
  { name: string; price: number; icon: React.JSX.Element }
> = {
  essential_plan: {
    name: 'essential Plan',
    price: 10,
    icon: <Icon.essentialSubscriptionPlan className='size-[33.224px]' />,
  },
  green_plan: {
    name: 'green Plan',
    price: 25,
    icon: <Icon.greenSubscriptionPlan className='size-[33.224px]' />,
  },
  cool_plan: {
    name: 'cool Plan',
    price: 40,
    icon: <Icon.coolSubscriptionPlan className='size-[33.224px]' />,
  },
};

export const PlanType = ({ type, className }: PlanTypeProps) => {
  const plan = planConfig[type];

  if (!plan) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-[12.082px] max-w-[199px]',
        className
      )}
    >
      {plan.icon}
      <div className='space-y-[3.02px]'>
        <p className='truncate text-[#D4D4D8] text-[11.327px] font-bold capitalize'>
          {plan.name}
        </p>
        <p className='truncate text-[#8A8C95] text-[11.327px] capitalize'>
          ${plan.price} USD/monthly
        </p>
      </div>
    </div>
  );
};
