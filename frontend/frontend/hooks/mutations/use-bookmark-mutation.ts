import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "@bprogress/next/app";
import type { BookmarkPostType, PostType } from "@/types/global";

/**
 * Hook to add/remove bookmarks with optimistic updates.
 *
 * Endpoints used:
 * POST   /api/post/bookmark/{discordId}
 * GET    /api/post/bookmark/{discordId}
 * DELETE /api/post/bookmark/{discordId}/{postId}
 */
export const useBookmarkMutation = (opts?: { discordId?: string }) => {
	const queryClient = useQueryClient();
	const router = useRouter();

	const mutation = useMutation({
		mutationFn: async ({
			discordId,
			postId,
			isBookmarked,
		}: {
			discordId: string;
			postId: string;
			isBookmarked: boolean;
		}) => {
			if (isBookmarked) {
				toast.success("Removed from bookmarks");
				const res = await api.delete(`/post/bookmark/${discordId}/${postId}`);
				return res.data;
			}
			toast.success("Added to bookmarks");
			const res = await api.post(`/post/bookmark/${discordId}`, { postId });
			return res.data;
		},

		onMutate: async ({ discordId, postId, isBookmarked }) => {
			if (!discordId) return {};

			const bookmarksKey = ["bookmarks", discordId];
			const hasKey = ["bookmarks", discordId, "has-bookmarked", postId];

			await Promise.all([
				queryClient.cancelQueries({ queryKey: bookmarksKey }),
				queryClient.cancelQueries({ queryKey: hasKey }),
			]);

			const rawBookmarks = queryClient.getQueryData<{
				pages: BookmarkPostType[];
				pageParams: any[];
			}>(bookmarksKey);
			console.log("QUERY", rawBookmarks?.pages);
			const previousBookmarks = rawBookmarks || {
				pages: [
					{
						pages: [],
					},
				],
				pageParams: [],
			};
			if (isBookmarked) {
				const allPages = (previousBookmarks?.pages?.flatMap(
					(page) => page || []
				) || []) as BookmarkPostType[];
				const filteredPages = allPages.filter(
					(page) => page.post._id !== postId
				);

				queryClient.setQueryData(bookmarksKey, {
					pages: [filteredPages],
					pageParams: [],
				});
			}

			const previousHas = queryClient.getQueryData<boolean>(hasKey);

			queryClient.setQueryData(hasKey, !isBookmarked);

			return { previousBookmarks, previousHas };
		},

		onError: (err: any, variables, context: any) => {
			const discordId = variables.discordId || opts?.discordId;
			if (!discordId) return;

			// Revert all optimistic updates on error
			const bookmarksKey = ["bookmarks", discordId];
			const hasKey = [
				"bookmarks",
				discordId,
				"has-bookmarked",
				variables.postId,
			];

			if (context?.previousBookmarks) {
				queryClient.setQueryData(bookmarksKey, context.previousBookmarks);
			}
			if (context?.previousHas) {
				queryClient.setQueryData(hasKey, context.previousHas);
			}

			if (err?.status === 401) {
				localStorage.clear();
				toast.error("You must be logged in to bookmark posts.");
				router.push("/auth");
				return;
			}
			console.log("ERROR:", err?.message);
			toast.error(
				err?.message || "Failed to update bookmark. Please try again."
			);
		},
	});

	const fetchIsBookmarked = async (
		discordId?: string,
		postId?: string,
		signal?: AbortSignal
	) => {
		const id = discordId || opts?.discordId;
		if (!id || !postId) return false;

		try {
			const res = await api.get(
				`/post/bookmark/${id}/${postId}/has-bookmarked`,
				{ signal }
			);

			if (res.data && typeof res.data.bookmarked === "boolean")
				return res.data.bookmarked;
			return !!res.data;
		} catch (err) {
			return false;
		}
	};

	return {
		...mutation,
		fetchIsBookmarked,
	};
};
const fetchIsBookmarked = async (
	discordId?: string,
	postId?: string,
	signal?: AbortSignal
) => {
	const id = discordId;
	if (!id || !postId) return false;

	try {
		const res = await api.get(`/post/bookmark/${id}/${postId}/has-bookmarked`, {
			signal,
		});

		if (res.data && typeof res.data.bookmarked === "boolean")
			return res.data.bookmarked;
		return !!res.data;
	} catch (err) {
		return false;
	}
};
export const useIsBookmarked = ({
	discordId,
	postId,
}: {
	discordId: string;
	postId: string;
}) => {
	return useQuery({
		queryKey: ["bookmarks", discordId, "has-bookmarked", postId],
		queryFn: ({ signal }) => fetchIsBookmarked(discordId, postId, signal),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		enabled: !!discordId && !!postId,
	});
};
