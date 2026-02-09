import api from "@/lib/axios";
import type { UserType } from "@/types/global";

const PROFILE_REQUEST_TIMEOUT_MS = 10_000;

export const getUserProfile = async (username: string) => {
	const rawUsername = username ?? '';
	const normalizedUsername = rawUsername.trim();

	if (!normalizedUsername && !rawUsername) {
		throw new Error("Username is required");
	}

	const fetchProfileByUsername = async (targetUsername: string) => {
		try {
			const res = await api.get("/user/username", {
				params: { username: targetUsername },
				timeout: PROFILE_REQUEST_TIMEOUT_MS,
			});
			return res.data as unknown as Omit<UserType, "user">;
		} catch (error) {
			return null;
		}
	};

	const primaryUsername = normalizedUsername || rawUsername;
	const profile = await fetchProfileByUsername(primaryUsername);
	if (profile) {
		return profile;
	}

	if (rawUsername && rawUsername !== normalizedUsername) {
		return await fetchProfileByUsername(rawUsername);
	}

	return null;
};
