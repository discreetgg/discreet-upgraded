import { postPerformanceByMonth } from "@/actions/post";
import { useQuery } from "@tanstack/react-query";

interface MonthlyProps {
	discordId: string;
	month: string;
	year: string;
}
export const usePostPerformance = ({
	discordId,
	month,
	year,
}: MonthlyProps) => {
	return useQuery({
		queryKey: ["post__performance", discordId],
		queryFn: async () =>
			await postPerformanceByMonth({ discordId, month, year }),
		enabled: !!discordId,
	});
};
