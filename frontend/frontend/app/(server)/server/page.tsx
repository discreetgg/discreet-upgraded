import ServerDashboard from '@/components/server/server-dashboard';
import { PageLoader } from '@/components/ui/page-loader';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServerDashboard />
    </Suspense>
  );
}
