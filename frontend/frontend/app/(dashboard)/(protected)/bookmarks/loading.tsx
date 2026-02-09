import { TabLoadingSkeleton } from '@/components/tab-loading-skeleton';

export default function Loading() {
  return (
    <TabLoadingSkeleton
      containerClassName="pt-6 px-4"
      showRightRail
      showSearch
      variant="posts"
    />
  );
}
