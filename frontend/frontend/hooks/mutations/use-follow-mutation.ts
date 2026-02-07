import api from "@/lib/axios";
import type { UserType } from "@/types/global";
import { useRouter } from "@bprogress/next/app";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FollowStatus {
	isFollowing: boolean;
}

export const useFollowAndUnfollowMutation = ({
	discordId,
	username,
}: {
	discordId: string;
	username: string;
}) => {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async ({ isFollowing }: { isFollowing: boolean }) => {
			const endpoint = isFollowing
				? `user/${discordId}/unfollow`
				: `user/${discordId}/follow`;

			const res = await api.post(endpoint);

			return res.data;
		},

		onMutate: async ({ isFollowing }) => {
			await queryClient.cancelQueries({
				queryKey: ["user", discordId, "is-following"],
			});

			const previousFollowStatus = queryClient.getQueryData<FollowStatus>([
				"user",
				discordId,
				"is-following",
			]);

			const newFollowingState = !isFollowing;

			// Optimistic update for the follow status
			queryClient.setQueryData<FollowStatus>(
				["user", discordId, "is-following"],
				(old) => {
					return {
						...old,
						isFollowing: newFollowingState,
					};
				}
			);

			// Optimistic update for the follower count
			queryClient.setQueryData<UserType>(["username_", username], (old) => {
				if (!old) return old;

				return {
					...old,
					followerCount: newFollowingState
						? old.followerCount + 1
						: old.followerCount - 1,
				};
			});

			// Return context for potential rollback
			return { previousFollowStatus };
		},

		onError: (err, variables, context) => {
			// @ts-expect-error any
			if (err?.status === 401) {
				localStorage.clear();
				// toast.error("You must be logged in to follow users.");
				router.push("/auth");
			}

			if (context?.previousFollowStatus) {
				queryClient.setQueryData(
					["user", discordId, "is-following"],
					context.previousFollowStatus
				);
			}
		},

		onSuccess: (data, variables) => {
			const newFollowingState = !variables.isFollowing;

			queryClient.setQueryData<FollowStatus>(
				["user", discordId, "is-following"],
				{
					isFollowing: newFollowingState,
				}
			);
		},
	});
};
