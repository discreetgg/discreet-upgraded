"use client";

import { getPostLikedByUser } from "@/actions/creator-post";
import type { PostType } from "@/types/global";
import { useInfiniteQuery } from "@tanstack/react-query";

interface UseInfinitePostsProps {
	initialVisibility?: string;
	limit?: number;
}

interface PostsResponse {
	data: PostType[];
	hasNextPage: boolean;
	nextCursor?: string;
}

export const useInfiniteProfilePosts = ({
	limit = 10,
}: UseInfinitePostsProps = {}) => {
	const query = useInfiniteQuery({
		queryKey: ["profile-liked-posts", limit],
		queryFn: async ({ pageParam }) => {
			const response = await getPostLikedByUser({
				cursor: pageParam,
				limit,
			});

			const responseData: PostsResponse = response.data || {
				data: response.data || [],
				hasNextPage: false,
			};

			const posts = Array.isArray(responseData)
				? responseData
				: responseData.data || [];

			// Determine next cursor and hasNextPage
			let hasNextPage = false;
			let nextCursor: string | undefined;

			if (typeof responseData === "object" && "hasNextPage" in responseData) {
				hasNextPage = Boolean(responseData.hasNextPage);
				nextCursor = responseData.nextCursor;
			} else {
				// Fallback: if we get fewer posts than requested, assume no more pages
				hasNextPage = posts.length >= limit;
				if (posts.length > 0) {
					nextCursor = posts[posts.length - 1]._id;
				}
			}

			return {
				posts,
				nextCursor,
				hasNextPage,
			};
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
		loadPosts: () => query.refetch(),
		loadMorePosts: () => {
			if (!query.isFetchingNextPage && query.hasNextPage) {
				query.fetchNextPage();
			}
		},
		refreshPosts: () => query.refetch(),
	};
};
