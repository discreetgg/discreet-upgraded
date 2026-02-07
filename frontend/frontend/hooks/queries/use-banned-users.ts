import { getBannedUsersService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { useQuery } from '@tanstack/react-query';

export const useBannedUsers = () => {
	return useQuery<UserType[]>({
		queryKey: ['banned-users'],
		queryFn: async () => {
			const data = await getBannedUsersService();
			return Array.isArray(data) ? data : [];
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
};
