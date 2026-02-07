"use client";

import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";
import { Post } from "./post";
import { PostsLoadMoreTrigger, PostsLoadingIndicator } from "./posts-loading";
import { useInfiniteProfilePosts } from "@/hooks/use-infinite-profile-posts";

export const ProfilePostsContainer = () => {
	const {
		posts,
		isLoading,
		isLoadingMore,
		error,
		hasNextPage,
		loadPosts,
		loadMorePosts,
		refreshPosts,
	} = useInfiniteProfilePosts({
		limit: 10,
	});

	useEffect(() => {
		loadPosts();
	}, [loadPosts]);

	const loadMoreTriggerRef = useIntersectionObserver({
		onIntersect: loadMorePosts,
		threshold: 0.1,
		rootMargin: "200px",
		enabled: hasNextPage && !isLoadingMore && !isLoading,
	});

	if (isLoading) {
		return <PostsLoadingIndicator />;
	}

	if (error && posts.length === 0) {
		return (
			<div className="flex justify-center py-8">
				<div className="text-center text-[#8A8C95]">
					<p className="text-lg mb-4">Failed to load posts</p>
					<button
						type="button"
						onClick={refreshPosts}
						className="px-4 py-2 bg-[#FF007F] text-white rounded-lg hover:bg-[#FF007F]/80 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (!posts || posts.length === 0) {
		return (
			<div className="flex justify-center py-8">
				<div className="text-center text-[#8A8C95]">
					<p className="text-lg">No posts available</p>
					<p className="text-sm mt-2">Check back later for new content!</p>
				</div>
			</div>
		);
	}

	return (
		<>
			{posts.map((post) => (
				<Post key={post._id} post={post} />
			))}

			{hasNextPage && (
				<div ref={loadMoreTriggerRef} className="h-4">
					<PostsLoadMoreTrigger isVisible={isLoadingMore} />
				</div>
			)}

			{error && posts.length > 0 && (
				<div className="flex justify-center py-4">
					<button
						type="button"
						onClick={loadMorePosts}
						className="text-sm text-[#FF007F] hover:text-[#FF007F]/80 transition-colors"
					>
						Failed to load more posts. Tap to retry.
					</button>
				</div>
			)}

			{!hasNextPage && posts.length > 0 && !error && (
				<div className="flex justify-center py-8">
					<div className="text-sm text-[#8A8C95]">
						You've reached the end of the posts
					</div>
				</div>
			)}
		</>
	);
};
