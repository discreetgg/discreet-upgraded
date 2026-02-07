'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { serverService } from '@/lib/server-service';

export type TagCount = {
  tag: string;
  count: number;
};

export const useTags = () => {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const limit = 50; // reasonable page size for aggregation
      let page = 1;
      let hasNext = true;
      const tagToCount: Record<string, number> = {};

      while (hasNext) {
        //     const { servers, total, page: current, limit: pageLimit } = await serverService.getAllServers({
        //   page,
        //   limit,
        // });
        const response = await serverService.getAllServers({
          page,
          limit,
        });

            for (const srv of response ?? []) {
          for (const tag of srv.tags ?? []) {
            const key = String(tag).trim();
            if (!key) continue;
            tagToCount[key] = (tagToCount[key] ?? 0) + 1;
          }
        }

        // pagination       
        const totalPages = limit ? Math.ceil((response?.length ?? 0) / limit) : 0;
        hasNext = page < totalPages;
        page = page + 1;
      }

      const result: TagCount[] = Object.entries(tagToCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      setTags(result);
    } catch {
      const message = 'Failed to load tags';
      setError(message);
      toast.error(message);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    loadTags();
  }, [loadTags]);

  return { tags, isLoading, error, loadTags, refresh };
};


