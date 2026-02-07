import api from "@/lib/axios";

export async function blockUser(discordId: string) {
	try {
		const response = await api.post(`/user/block`, { discordId });
		return response.data;
	} catch (error) {
		console.error("Error blocking user:", error);
		throw new Error();
	}
}

export async function unblockUser(discordId: string) {
	try {
		const response = await api.post(`/user/unblock`, { discordId });
		return response.data;
	} catch (error) {
		console.error("Error unblocking user:", error);
		throw new Error();
	}
}

export async function reportHandle({ payload }: { payload: ReportPayload }) {
	try {
		const response = await api.post(`/report`, payload);
		return response.data;
	} catch (error) {
		console.error(`Error reporting ${payload.targetType}:`, error);
		throw new Error();
	}
}

export const getAllBlockedUsers = async () => {
	try {
		const response = await api.get(`/user/blocked`);
		return response.data;
	} catch (error) {
		console.error("Error getting blocked users:", error);
	}
};
