import { getMenuItems } from "@/actions/menu-item";
import { useQuery } from "@tanstack/react-query";

export const useMenuItems = (discordId: string) => {
	return useQuery({
		queryKey: ["menu_item", discordId],
		queryFn: () => getMenuItems(discordId),
		enabled: !!discordId,
		staleTime: 5 * 60 * 1000, // 5 minutes - menu items change infrequently
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
