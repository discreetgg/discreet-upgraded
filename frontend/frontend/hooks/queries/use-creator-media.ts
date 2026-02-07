import { getCreatorMedia } from "@/actions/creator-post";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useCreatorMedia = (discordId: string) => {
	return useSuspenseQuery({
		queryKey: ["creator-media", discordId],
		queryFn: () => getCreatorMedia(discordId),
		staleTime: 10 * 60 * 1000, // 10 minutes - media content changes infrequently
		gcTime: 15 * 60 * 1000, // 15 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
