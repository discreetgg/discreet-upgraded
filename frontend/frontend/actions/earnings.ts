import api from "@/lib/axios";

export const allTimeEarnings = async (discordId: string) => {
	try {
		const response = await api.get(
			`/payment-analytics/alltime?sellerId=${discordId}`
		);
		return response.data as AllTimeEarningsType;
	} catch (error: any) {
		throw new Error(error);
	}
};

interface MonthlyProps {
	discordId: string;
	month: string;
	year: string;
}
export const earningsByMonth = async ({
	discordId,
	month,
	year,
}: MonthlyProps) => {
	try {
		const response = await api.get(
			`/payment-analytics/monthly?sellerId=${discordId}&month=${month}&year=${year}`
		);
		return response.data as MonthlyEarningsType;
	} catch (error: any) {
		throw new Error(error);
	}
};
