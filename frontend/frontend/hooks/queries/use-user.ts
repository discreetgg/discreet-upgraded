import { getUserProfile } from "@/actions/user-profile";
import { useQuery } from "@tanstack/react-query";

interface UseUserOptions {
	enabled?: boolean;
}

export const useUser = (username: string, options: UseUserOptions = {}) => {
	const { enabled = true } = options;

	return useQuery({
		queryKey: ["username_", username],
		queryFn: () => getUserProfile(username),
		enabled: enabled && !!username,
		staleTime: 5 * 60 * 1000, // 5 minutes - user profiles don't change often
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2, // Retry failed requests twice
		refetchOnWindowFocus: false, // Don't refetch on window focus
	});
};
