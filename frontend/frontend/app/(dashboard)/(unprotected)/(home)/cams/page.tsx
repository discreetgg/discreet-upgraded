'use client';

import { ComponentLoader } from '@/components/ui/component-loader';
import { getOnlineUsersService, getUserByIdService } from '@/lib/services';
import { UserType } from '@/types/global';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useMessage } from '@/context/message-context';
import { useGlobal } from '@/context/global-context-provider';
import { camsOptions, sortOptions } from '@/lib/data';
import { CamsFilterBar, CamsGrid } from '@/components/cams';
import { useSearchParams } from 'next/navigation';
import { TabLoadingSkeleton } from '@/components/tab-loading-skeleton';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const CamsContent = ({
  creators,
  currentUserId,
}: {
  creators: UserType[] | null;
  currentUserId?: string;
}) => {
  const searchParams = useSearchParams();
  const selectedCams = searchParams.get('cams');
  const selectedSort = searchParams.get('sort');
  const randomSeed = searchParams.get('randomSeed');

  const filteredCreators = useMemo(() => {
    if (!creators) return null;

    let filtered = creators;

    if (selectedCams) {
      const normalizedCams = selectedCams.toLowerCase();
      if (normalizedCams === 'taking cams') {
        filtered = filtered.filter((creator) => creator.takingCams === true);
      } else if (normalizedCams === 'not taking cams') {
        filtered = filtered.filter((creator) => creator.takingCams !== true);
      }
    }

    // Apply sorting
    if (selectedSort) {
      const normalizedSort = selectedSort.toLowerCase();
      if (normalizedSort === 'random') {
        filtered = shuffleArray(filtered);
      } else if (normalizedSort === 'popular') {
        filtered = [...filtered].sort(
          (a, b) => (b.followerCount || 0) - (a.followerCount || 0)
        );
      }
    }

    return filtered;
  }, [creators, selectedCams, selectedSort, randomSeed]);

  return <CamsGrid creators={filteredCreators} currentUserId={currentUserId} />;
};
const Page = () => {
  const [creators, setCreators] = useState<UserType[] | null>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { setReceiver } = useMessage();
  const { user } = useGlobal();

  useEffect(() => {
    // Fetch data or perform side effects here

    (async () => {
      setLoading(true);
      try {
        // Get array of online user IDs
        const onlineUserIds = await getOnlineUsersService();

        // Fetch full user data for each ID
        const userPromises = onlineUserIds.map(async (userId: string) => {
          const response = await getUserByIdService(userId);
          return response.data;
        });

        // Wait for all user data to be fetched
        const users = await Promise.all(userPromises);

        setCreators(users);
      } catch (error) {
        console.error('Error fetching creators:', error);
        setCreators([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <TabLoadingSkeleton showFilterRow variant="grid" />;
  }

  return (
    <div>
      <Suspense>
        <CamsFilterBar
          camsOptions={camsOptions}
          sortOptions={sortOptions}
        />
      </Suspense>
      <Suspense fallback={<ComponentLoader />}>
        <CamsContent creators={creators} currentUserId={user?.discordId} />
      </Suspense>
    </div>
  );
};

export default Page;
