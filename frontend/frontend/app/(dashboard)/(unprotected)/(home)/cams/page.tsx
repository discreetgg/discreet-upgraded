'use client';

import { ComponentLoader } from '@/components/ui/component-loader';
import { getOnlineUsersService, getUserByIdService } from '@/lib/services';
import { UserType } from '@/types/global';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useMessage } from '@/context/message-context';
import { useGlobal } from '@/context/global-context-provider';
import { camsOptions, raceOptions, sortOptions } from '@/lib/data';
import { CamsFilterBar, CamsGrid } from '@/components/cams';
import { useSearchParams } from 'next/navigation';

const getRaceMatches = (raceParam: string): string[] => {
  const normalized = raceParam.toLowerCase().trim();

  const raceMap: Record<string, string[]> = {
    asian: ['asian'],
    black: ['black', 'african_black', 'african'],
    latino: ['latino', 'hispanic_latino', 'hispanic'],
    arab: ['arab', 'arabic', 'middle_eastern'],
    indian: ['indian', 'indigenous_native', 'indigenous', 'native'],
    pacific: ['pacific', 'pacific_islander'],
    white: ['white', 'white_caucasian', 'caucasian'],
    mixed: ['mixed', 'mixed_race'],
  };

  return raceMap[normalized] || [normalized];
};

const matchesRace = (
  userRace: string | null,
  selectedRace: string
): boolean => {
  if (!userRace) return false;

  const userRaceLower = userRace.toLowerCase().trim();
  const selectedRaceLower = selectedRace.toLowerCase().trim();
  const possibleMatches = getRaceMatches(selectedRace);
  if (userRaceLower === selectedRaceLower) {
    return true;
  }
  return possibleMatches.some((match) => {
    const matchLower = match.toLowerCase();
    if (userRaceLower === matchLower) {
      return true;
    }
    if (
      userRaceLower.replace(/[_-]/g, '') === matchLower.replace(/[_-]/g, '')
    ) {
      return true;
    }
    if (
      userRaceLower.includes(matchLower) ||
      matchLower.includes(userRaceLower)
    ) {
      return true;
    }
    return false;
  });
};

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
  const selectedRace = searchParams.get('race');
  const selectedCams = searchParams.get('cams');
  const selectedSort = searchParams.get('sort');

  const filteredCreators = useMemo(() => {
    if (!creators) return null;

    let filtered = creators;

    if (selectedRace) {
      filtered = filtered.filter((creator) =>
        matchesRace(creator.race, selectedRace)
      );
    }

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
      if (normalizedSort === 'highest price') {
        filtered = [...filtered].sort(
          (a, b) => (b.callRate || 0) - (a.callRate || 0)
        );
      } else if (normalizedSort === 'lowest price') {
        filtered = [...filtered].sort(
          (a, b) => (a.callRate || 0) - (b.callRate || 0)
        );
      } else if (normalizedSort === 'random') {
        filtered = shuffleArray(filtered);
      } else if (normalizedSort === 'popular') {
        filtered = [...filtered].sort(
          (a, b) => (b.followerCount || 0) - (a.followerCount || 0)
        );
      }
    }

    return filtered;
  }, [creators, selectedRace, selectedCams, selectedSort]);

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
    return (
      <div className="flex justify-center py-8">
        <ComponentLoader />
      </div>
    );
  }

  return (
    <div>
      <Suspense>
        <CamsFilterBar
          raceOptions={raceOptions}
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
