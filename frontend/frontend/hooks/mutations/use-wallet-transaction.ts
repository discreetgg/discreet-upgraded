import { getWalletTransactionsService } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";

export const useWalletTransaction = (discordId: string) => {
	return useQuery({
		queryKey: ["wallet__transaction", discordId],
		queryFn: async () => await getWalletTransactionsService(discordId),
		enabled: !!discordId,
	});
};
