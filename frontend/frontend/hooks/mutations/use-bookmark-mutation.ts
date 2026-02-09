import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "@bprogress/next/app";
import type { BookmarkPostType } from "@/types/global";

type BookmarksQueryData = {
	pages: BookmarkPostType[][];
	pageParams: unknown[];
};

const getErrorStatus = (error: any) => error?.status || error?.response?.status;

const fetchIsBookmarkedStatus = async (
	discordId?: string,
	postId?: string,
	signal?: AbortSignal
) => {
	if (!discordId || !postId) return false;

	try {
		const res = await api.get(
			`/post/bookmark/${discordId}/${postId}/has-bookmarked`,
			{ signal }
		);

		if (res.data && typeof res.data.bookmarked === "boolean") {
			return res.data.bookmarked;
		}
		return !!res.data;
	} catch {
		return false;
	}
};

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
				try {
					const res = await api.delete(`/post/bookmark/${discordId}/${postId}`);
					return res.data;
				} catch (error: any) {
					const status = getErrorStatus(error);
					if (status === 404 || status === 409) {
						return {
							message: "Bookmark already removed",
						};
					}
					throw error;
				}
			}
			toast.success("Added to bookmarks");
			try {
				const res = await api.post(`/post/bookmark/${discordId}`, { postId });
				return res.data;
			} catch (error: any) {
				const status = getErrorStatus(error);
				if (status === 409) {
					return {
						message: "Bookmark already exists",
					};
				}
				throw error;
			}
		},

		onMutate: async ({ discordId, postId, isBookmarked }) => {
			if (!discordId) return {};

			const bookmarksKey = ["bookmarks", discordId];
			const hasKey = ["bookmarks", discordId, "has-bookmarked", postId];

			await Promise.all([
				queryClient.cancelQueries({ queryKey: bookmarksKey }),
				queryClient.cancelQueries({ queryKey: hasKey }),
			]);

			const previousBookmarks =
				queryClient.getQueryData<BookmarksQueryData>(bookmarksKey) || {
					pages: [],
					pageParams: [],
				};

			if (isBookmarked) {
				const allPages = previousBookmarks.pages.flatMap((page) => page || []);
				const filteredPages = allPages.filter(
					(page) => page.post._id !== postId
				);

				queryClient.setQueryData<BookmarksQueryData>(bookmarksKey, {
					pages: [filteredPages],
					pageParams: previousBookmarks.pageParams,
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
			if (
				context &&
				Object.prototype.hasOwnProperty.call(context, "previousHas")
			) {
				queryClient.setQueryData(hasKey, context.previousHas);
			}

			const status = getErrorStatus(err);

			if (status === 401) {
				localStorage.clear();
				toast.error("You must be logged in to bookmark posts.");
				router.push("/auth");
				return;
			}
			toast.error(
				err?.response?.data?.message ||
					err?.message ||
					"Failed to update bookmark. Please try again."
			);
		},
		onSettled: (_, __, variables) => {
			const discordId = variables?.discordId || opts?.discordId;
			if (!discordId || !variables?.postId) return;

			const bookmarksKey = ["bookmarks", discordId];
			const hasKey = ["bookmarks", discordId, "has-bookmarked", variables.postId];

			queryClient.invalidateQueries({ queryKey: bookmarksKey });
			queryClient.invalidateQueries({ queryKey: hasKey });
		},
	});

	const fetchIsBookmarked = async (
		discordId?: string,
		postId?: string,
		signal?: AbortSignal
	) => {
		return fetchIsBookmarkedStatus(discordId || opts?.discordId, postId, signal);
	};

	return {
		...mutation,
		fetchIsBookmarked,
	};
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
		queryFn: ({ signal }) =>
			fetchIsBookmarkedStatus(discordId, postId, signal),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		enabled: !!discordId && !!postId,
	});
};
