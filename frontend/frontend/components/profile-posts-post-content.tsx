import { LoadingPostsCardStack } from "./ui/loading-posts-card-stack";
import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getCreatorPost } from "@/actions/creator-post";
import type { PostType } from "@/types/global";
import { Post } from "./post";
import { PostsLoadingIndicator, PostsLoadMoreTrigger } from "./posts-loading";

interface Props {
	discordId: string;
}
export const ProfilePostsPostContent = ({ discordId }: Props) => {
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error,
	} = useInfiniteQuery({
		queryKey: ["creatorPosts", discordId],
		queryFn: ({ pageParam }) =>
			getCreatorPost({
				discordId,
				limit: 5,
				cursor: pageParam as string | undefined,
			}),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			return lastPage?.hasNextPage ? lastPage.nextCursor : undefined;
		},
		enabled: !!discordId,
	});

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
			rootMargin: "100px",
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

	if (error) {
		return (
			<div className="text-center p-8 text-red-600">
				<p>An unexpected plot twist occurred...</p>
				<p className="text-sm mt-2">
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex w-full gap-y-5 flex-col">
				<PostsLoadingIndicator />
			</div>
		);
	}

	const allPosts = (data?.pages?.flatMap((page) => page || []) ||
		[]) as PostType[];

	if (allPosts.length === 0) {
		return <LoadingPostsCardStack className="mt-10" title="No posts yet" />;
	}

	return (
		<div className="flex w-full gap-y-5 flex-col">
			{allPosts.map((post) => (
				<Post key={post._id} post={post} />
			))}
			{error && allPosts.length > 0 && (
				<div className="flex justify-center py-4">
					<button
						type="button"
						onClick={fetchNextPage}
						className="text-sm text-[#FF007F] hover:text-[#FF007F]/80 transition-colors"
					>
						Failed to load more posts. Tap to retry.
					</button>
				</div>
			)}
			{hasNextPage && (
				<div ref={loadMoreRef} className="h-4">
					<PostsLoadMoreTrigger isVisible={isFetchingNextPage} />
				</div>
			)}

			{!hasNextPage && allPosts.length > 0 && !error && (
				<div className="flex justify-center py-8">
					<div className="text-sm text-[#8A8C95]">
						You've reached the end of the posts
					</div>
				</div>
			)}
		</div>
	);
};
