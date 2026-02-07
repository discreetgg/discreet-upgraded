import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface FollowStatus {
	isFollowing: boolean;
}
export const useIsFollowing = (discordId: string) => {
	return useQuery({
		queryKey: ["user", discordId, "is-following"],
		queryFn: async (): Promise<FollowStatus> => {
			try {
				const res = await api.get(`user/${discordId}/is-following`);
				return res.data;
			} catch (error) {
				console.log(error);
				// @ts-expect-error any
				if (error?.status === 401) {
					localStorage.clear();
					// toast.error("You must be logged in to follow users.");
				}
				return { isFollowing: false };
			}
		},
		enabled: !!discordId,
		staleTime: 3 * 60 * 1000, // 3 minutes - frequently checked query
		gcTime: 5 * 60 * 1000, // 5 minutes
		retry: 1, // Only retry once for follow status
		refetchOnWindowFocus: false,
	});
};
