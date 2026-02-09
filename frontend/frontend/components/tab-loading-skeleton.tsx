import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type TabLoadingVariant = 'posts' | 'grid' | 'list';

interface TabLoadingSkeletonProps {
  className?: string;
  containerClassName?: string;
  showFilterRow?: boolean;
  showSearch?: boolean;
  showRightRail?: boolean;
  variant?: TabLoadingVariant;
}

export function TabLoadingSkeleton({
  className,
  containerClassName,
  showFilterRow = false,
  showSearch = false,
  showRightRail = false,
  variant = 'posts',
}: TabLoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'w-full flex gap-x-5 justify-between',
        containerClassName,
      )}
    >
      <div className={cn('w-full max-w-[560px] xl:max-w-full space-y-4', className)}>
        {showFilterRow && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Skeleton className="h-9 w-28 rounded-[7px]" />
            <Skeleton className="h-9 w-36 rounded-[7px]" />
            <Skeleton className="h-9 w-28 rounded-[7px]" />
            <Skeleton className="h-9 w-24 rounded-[7px]" />
          </div>
        )}

        {showSearch && <Skeleton className="h-12 w-full rounded-full" />}

        <div className="relative min-h-[360px] overflow-hidden rounded-[8px] border border-[#1E1E21] bg-background p-4">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#5A5D66]/35 border-t-[#8A8C95]/65" />
          </div>
          <div className="relative space-y-4 opacity-80">
            {variant === 'posts' && <PostSkeletonRows />}
            {variant === 'grid' && <GridSkeletonRows />}
            {variant === 'list' && <ListSkeletonRows />}
          </div>
        </div>
      </div>

      {showRightRail && (
        <aside className="mt-10 hidden h-max w-full max-w-[376px] shrink-0 space-y-6 overflow-hidden md:block">
          <Skeleton className="h-[72px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </aside>
      )}
    </div>
  );
}

function PostSkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={`post-loading-${index}`}
          className="space-y-4 rounded-[8px] border border-[#1E1E21] bg-background p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-[86%] rounded-md" />
            <Skeleton className="h-3 w-[70%] rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

function GridSkeletonRows() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: 9 }, (_, index) => (
        <div
          key={`grid-loading-${index}`}
          className="space-y-2 rounded-[8px] border border-[#1E1E21] bg-background p-2.5"
        >
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-3/5 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function ListSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={`list-loading-${index}`}
          className="space-y-3 rounded-[8px] border border-[#1E1E21] bg-background p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
