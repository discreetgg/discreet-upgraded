'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { serverService } from '@/lib/server-service';
import type { Server } from '@/types/server';

interface UseInfiniteServersProps {
  initialPage?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}

export const useInfiniteServers = ({
  initialPage = 1,
  limit = 10,
  search,
  tags,
}: UseInfiniteServersProps = {}) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [hasNextPage, setHasNextPage] = useState(true);

  const loadServers = useCallback(
    async ({
      nextPage = 1,
      append = false,
    }: {
      nextPage?: number;
      append?: boolean;
    } = {}) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await serverService.getAllServers({
          page: nextPage,
          limit,
          search,
          tags,
        });

        if (append) {
          setServers((prev) => [...prev, ...(response ?? [])]);
        } else {
          setServers(response ?? []);
        }

        const fetchedCount = response?.length ?? 0;
        setHasNextPage(fetchedCount >= limit);
        setPage(nextPage);
      } catch (e) {
        const message = 'Failed to fetch servers';
        setError(message);
        toast.error(message);
        if (!append) setServers([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [limit, search, tags]
  );

  const loadMoreServers = useCallback(() => {
    if (isLoadingMore || isLoading) return;
    if (!hasNextPage) return;
    loadServers({ nextPage: page + 1, append: true });
  }, [isLoadingMore, isLoading, hasNextPage, loadServers, page]);

  const refreshServers = useCallback(() => {
    loadServers({ nextPage: 1, append: false });
  }, [loadServers]);

  return {
    servers,
    isLoading,
    isLoadingMore,
    error,
    hasNextPage,
    page,
    loadServers,
    loadMoreServers,
    refreshServers,
  };
};

