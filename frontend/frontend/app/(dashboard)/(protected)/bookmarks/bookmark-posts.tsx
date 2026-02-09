import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBookmarks } from '@/actions/creator-post';
import type { BookmarkPostType } from '@/types/global';
import {
  PostsLoadingIndicator,
  PostsLoadMoreTrigger,
} from '@/components/posts-loading';
import { LoadingPostsCardStack } from '@/components/ui/loading-posts-card-stack';
import { Post } from '@/components/post';
import { Icon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TabLoadingSkeleton } from '@/components/tab-loading-skeleton';

interface Props {
  discordId: string;
}
export const BookmarkPosts = ({ discordId }: Props) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>('');
  const queryClient = useQueryClient();
  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['bookmarks', discordId],
    queryFn: ({ pageParam }) =>
      fetchBookmarks({
        discordId,
        limit: 10,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage?.hasNextPage ? lastPage.nextCursor : undefined;
    },
    enabled: !!discordId,
  });

  useEffect(() => {
    queryClient.refetchQueries({
      queryKey: ['bookmarks', discordId],
      exact: true,
    });
  }, [queryClient, discordId]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [handleIntersection]);

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    const normalizedSearchTerm = query?.trim().toLowerCase() || '';
    const searchWords = normalizedSearchTerm
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const allPosts = (data?.pages?.flatMap((page) => page || []) ||
      []) as BookmarkPostType[];

    const matchesSearch = (item: BookmarkPostType) => {
      if (searchWords.length === 0) return true;

      const combinedFields = [
        item.post.content,
        item.post.title,
        item.post.author.username,
        item.post.author.displayName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchWords.every((word) => combinedFields.includes(word));
    };

    return allPosts.filter(matchesSearch);
  }, [data, query, data?.pages]);

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>An unexpected plot twist occurred...</p>
        <p className="text-sm mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <TabLoadingSkeleton showSearch variant="posts" />;
  }

  if (filteredPosts.length === 0) {
    return (
      <>
        <div className="relative">
          <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Bookmarks"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="border border-border p-0 h-12 px-8 text-sm focus-visible:ring-1 rounded-full"
          />
          <Button
            data-clear={query.length > 0}
            className="absolute right-0 hidden data-[clear=true]:flex top-1/2 -translate-y-1/2 text-accent-text"
            onClick={() => setQuery('')}
            variant="ghost"
          >
            <Icon.close />
          </Button>
        </div>
        <LoadingPostsCardStack
          className="mt-10 md:mt-20"
          title="No bookmarks yet"
        />
      </>
    );
  }

  return (
    <div className="flex w-full gap-y-5 flex-col">
      <div className="relative">
        <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Bookmarks"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="border border-border p-0 h-12 px-8 text-sm focus-visible:ring-1 rounded-full"
        />
        <Button
          data-clear={query.length > 0}
          className="absolute right-0 hidden data-[clear=true]:flex top-1/2 -translate-y-1/2 text-accent-text"
          onClick={() => setQuery('')}
          variant="ghost"
        >
          <Icon.close />
        </Button>
      </div>
      {filteredPosts.map((post) => (
        <Post isBookmarkPage key={post._id} post={post.post} />
      ))}
      {error && filteredPosts.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={fetchNextPage}
            className="text-sm text-[#FF007F] hover:text-[#FF007F]/80 transition-colors"
          >
            Failed to load more bookmarks. Tap to retry.
          </button>
        </div>
      )}
      {hasNextPage && (
        <div ref={loadMoreRef} className="h-4">
          <PostsLoadMoreTrigger isVisible={isFetchingNextPage} />
        </div>
      )}

      {!hasNextPage && filteredPosts.length > 0 && !error && (
        <div
          data-show={query.length === 0}
          className="flex justify-center py-8 data-[show=true]:opacity-100 data-[show=false]:opacity-0 transition-opacity"
        >
          <div className="text-sm text-[#8A8C95]">
            You've reached the end of the bookmarks
          </div>
        </div>
      )}
    </div>
  );
};
