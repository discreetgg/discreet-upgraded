import api from "@/lib/axios";
import type { UserType } from "@/types/global";

export const getUserProfile = async (username: string) => {
	if (!username) {
		throw new Error("Username is required");
	}

	try {
		const res = await api.get(`/user/username?username=${username}`);
		return res.data as unknown as Omit<UserType, "user">;
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return null; // Return null instead of undefined
	}
};
