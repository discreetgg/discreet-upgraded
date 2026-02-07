import { getPostsService } from '@/lib/services';
import type { PostType } from '@/types/global';
import { useQuery } from '@tanstack/react-query';

const ADMIN_POSTS_LIMIT = 500;

export const useAllPosts = () => {
	return useQuery<PostType[]>({
		queryKey: ['all-posts-admin'],
		queryFn: async () => {
			const response = await getPostsService({
				visibility: 'general',
				limit: ADMIN_POSTS_LIMIT,
			});
			const responseData = response.data;
			const posts: PostType[] = Array.isArray(responseData)
				? responseData
				: (responseData?.data ?? []);
			return posts;
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
};
