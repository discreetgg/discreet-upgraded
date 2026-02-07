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
  const [newUpdate, setNewUpdate] = useState(false);

  const loadServers = useCallback(
    async (nextPage?: number, isLoadMore = false) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await serverService.getAllServers({
          page: nextPage ?? page,
          limit,
          search,
          tags,
        });
        if (isLoadMore) {
          setServers((prev) => [...prev, ...(response ?? [])]);
        } else {
          setServers(response ?? []);
        }
        const fetchedCount = response?.length ?? 0;
        setHasNextPage(fetchedCount >= limit);
        if (isLoadMore && fetchedCount > 0) {
          setPage((p) => (nextPage ?? p) + 1);
        } else if (!isLoadMore) {
          setPage(nextPage ?? page);
        }
      } catch (e) {
        const message = 'Failed to fetch servers';
        setError(message);
        toast.error(message);
        if (!isLoadMore) setServers([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setNewUpdate(false);
      }
    },
    [page, limit, search, tags, newUpdate]
  );

  const loadMoreServers = useCallback(() => {
    if (isLoadingMore || isLoading) return;
    if (!hasNextPage) return;
    loadServers(page + 1, true);
  }, [isLoadingMore, isLoading, hasNextPage, loadServers, page]);

  const refreshServers = useCallback(() => {
    loadServers();
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


