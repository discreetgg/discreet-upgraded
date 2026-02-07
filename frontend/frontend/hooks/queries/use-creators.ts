import { useQuery } from "@tanstack/react-query";
import { getCreatorsService } from "@/lib/services";
import type { UserType } from "@/types/global";

export const useCreators = () => {
	return useQuery({
		queryKey: ["creators"],
		queryFn: async (): Promise<UserType[]> => {
			return await getCreatorsService();
		},
		staleTime: 5 * 60 * 1000, // 5 minutes - creator list changes infrequently
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
