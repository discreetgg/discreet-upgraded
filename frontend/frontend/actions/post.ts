import api from "@/lib/axios";

export async function markPostAsViewed(postId: string) {
	try {
		const response = await api.post(`/post/post-view/${postId}`);
		// console.log("Post as viewed:", response.data);
		return response.data;
	} catch (error) {
		console.error("Error marking post as viewed:", error);
	}
}
interface MonthlyProps {
	discordId: string;
	month: string;
	year: string;
}
export const postPerformanceByMonth = async ({
	discordId,
	month,
	year,
}: MonthlyProps) => {
	try {
		const response = await api.get(
			`/post/stats-seller/${discordId}/posts?month=${month}&year=${year}`
		);
		return response.data as PostPerformanceType;
	} catch (error: any) {
		throw new Error(error);
	}
};
