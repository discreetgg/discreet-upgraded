import { allTimeEarnings, earningsByMonth } from "@/actions/earnings";
import { useQuery } from "@tanstack/react-query";

export const useAllTimeEarnings = (discordId: string) => {
	return useQuery({
		queryKey: ["alltime__earnings", discordId],
		queryFn: async () => await allTimeEarnings(discordId),
		enabled: !!discordId,
	});
};

interface MonthlyProps {
	discordId: string;
	month: string;
	year: string;
}
export const useMonthlyEarnings = ({
	discordId,
	month,
	year,
}: MonthlyProps) => {
	return useQuery({
		queryKey: ["monthly__earnings", discordId],
		queryFn: async () => await earningsByMonth({ discordId, month, year }),
		enabled: !!discordId,
	});
};
