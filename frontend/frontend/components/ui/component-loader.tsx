import { cn } from '@/lib/utils';
import { Icon } from './icons';

export const ComponentLoader = ({
  className,
  parentClassName,
}: { className?: string; parentClassName?: string }) => {
  return (
    <div className={cn(parentClassName)}>
      <Icon.loadingIndicator
        className={cn('animate-spin h-8 w-8 text-pink-500', className)}
      />
    </div>
  );
};
