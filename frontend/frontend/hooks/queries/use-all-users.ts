import { getAllUsersService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { useQuery } from '@tanstack/react-query';

export const useAllUsers = () => {
	return useQuery<UserType[]>({
		queryKey: ['all-users'],
		queryFn: async () => {
			const data = await getAllUsersService();
			return data ?? [];
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
};
