import { getWalletTransactionsService } from "@/lib/services";
import { useQuery } from "@tanstack/react-query";

export const useWalletTransaction = (discordId: string, limit = 100) => {
	return useQuery({
		queryKey: ["wallet__transaction", discordId, limit],
		queryFn: async () => await getWalletTransactionsService(discordId, limit),
		enabled: !!discordId,
	});
};
