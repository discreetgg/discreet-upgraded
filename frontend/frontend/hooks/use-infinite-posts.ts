'use client';

import { getPostsService } from '@/lib/services';
import type { PostType } from '@/types/global';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfinitePostsProps {
  initialVisibility?: string;
  limit?: number;
}

interface PostsResponse {
  data: PostType[];
  hasNextPage: boolean;
  nextCursor?: string;
}

const unpaginatedPostsCache = new Map<string, PostType[]>();

const buildClientPaginatedPage = ({
  allPosts,
  cursor,
  limit,
}: {
  allPosts: PostType[];
  cursor?: string;
  limit: number;
}) => {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = allPosts.findIndex((post) => post._id === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const posts = allPosts.slice(startIndex, startIndex + limit);
  const hasNextPage = startIndex + limit < allPosts.length;
  const nextCursor =
    hasNextPage && posts.length > 0 ? posts[posts.length - 1]._id : undefined;

  return {
    posts,
    hasNextPage,
    nextCursor,
  };
};

export const useInfinitePosts = ({
  initialVisibility = 'general',
  limit = 10,
}: UseInfinitePostsProps = {}) => {
  const cacheKey = `${initialVisibility}:${limit}`;

  const query = useInfiniteQuery({
    queryKey: ['posts', initialVisibility, limit],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;

      const cachedUnpaginatedPosts = unpaginatedPostsCache.get(cacheKey);
      if (cachedUnpaginatedPosts && cachedUnpaginatedPosts.length > 0) {
        return buildClientPaginatedPage({
          allPosts: cachedUnpaginatedPosts,
          cursor,
          limit,
        });
      }

      const response = await getPostsService({
        visibility: initialVisibility,
        cursor,
        limit,
      });

      const responseData = response.data as
        | PostsResponse
        | PostType[]
        | { data?: PostType[] };

      // Preferred shape from backend pagination
      if (
        responseData &&
        typeof responseData === 'object' &&
        !Array.isArray(responseData) &&
        'hasNextPage' in responseData
      ) {
        return {
          posts: responseData.data || [],
          nextCursor: responseData.nextCursor,
          hasNextPage: Boolean(responseData.hasNextPage),
        };
      }

      // Fallback for legacy/unpaginated backend response:
      // cache the full list and paginate locally to avoid rendering/fetching status for every post at once.
      const allPosts = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];

      unpaginatedPostsCache.set(cacheKey, allPosts);

      return buildClientPaginatedPage({
        allPosts,
        cursor,
        limit,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Flatten all pages into a single posts array
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    posts,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error?.message ?? null,
    hasNextPage: query.hasNextPage,
    loadPosts: () => {
      unpaginatedPostsCache.delete(cacheKey);
      return query.refetch();
    },
    loadMorePosts: () => {
      if (!query.isFetchingNextPage && query.hasNextPage) {
        query.fetchNextPage();
      }
    },
    refreshPosts: () => {
      unpaginatedPostsCache.delete(cacheKey);
      return query.refetch();
    },
  };
};
