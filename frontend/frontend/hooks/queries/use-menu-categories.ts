import { getMenuCategories } from "@/actions/menu-item";
import { useQuery } from "@tanstack/react-query";
import type { Tag } from "@/types/global";

export const useMenuCategories = (discordId: string) => {
	return useQuery({
		queryKey: ["menu_categories", discordId],
		queryFn: async (): Promise<Tag[]> => {
			const response = await getMenuCategories(discordId);
			// Map menu categories to Tag format
			return Array.isArray(response.data)
				? response.data.map((cat: any) => ({
						id: cat._id || cat.id || crypto.randomUUID(),
						text: cat.category || cat.hashtag || cat.name || '',
					}))
				: [];
		},
		enabled: !!discordId,
		staleTime: 0, // Always consider data stale so it refetches when invalidated
		gcTime: 5 * 60 * 1000, // 5 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});
};

