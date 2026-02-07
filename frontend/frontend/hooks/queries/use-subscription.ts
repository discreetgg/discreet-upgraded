import { getSubscriptions } from "@/actions/subscriptions";
import { useQuery } from "@tanstack/react-query";

export const useSubscription = (discordId: string) => {
	return useQuery({
		queryKey: ["subscriptions", discordId],
		queryFn: () => getSubscriptions(discordId),
		enabled: !!discordId,
		staleTime: 5 * 60 * 1000, // 5 minutes - subscriptions change infrequently
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
