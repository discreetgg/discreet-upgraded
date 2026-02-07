import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn('bg-[#1F2227]  rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
