import api from "@/lib/axios";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import { baseURL } from "./data";
import type {
	NotificationsResponseType,
	TipPayload,
	UserType,
	WalletTransactionType,
} from "@/types/global";

interface CreatePinPayload {
	discordId: string;
	pin: string;
}
interface RemovePinPayload {
	discordId: string;
	pin: string;
}
interface ChangePinPayload {
	discordId: string;
	oldPin: string;
	newPin: string;
}
interface GenerateOTPPayload {
	discordId: string;
}
interface VerifyOTPPayload {
	discordId: string;
	token: string;
}
interface GenerateBackupCodesPayload {
	discordId: string;
}
interface RemoveAuthenticatorAppPayload {
	discordId: string;
}
interface UploadProfileImagePayload {
	discordId: string;
	image: File;
	onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
}
interface UploadBannerImagePayload {
	discordId: string;
	image: File;
	onUploadProgress: (progressEvent: AxiosProgressEvent) => void;
}
interface CreateSubscriptionPayload {
	name: string;
	amount: string;
	description: string;
	icon: string;
}

interface EditSubscriptionPayload extends CreateSubscriptionPayload {
	id: string;
}

interface UpdateUserPayload {
	role?: string;
	bio?: string;
	discordNotification?: {
		enabled?: boolean;
		newFollower?: boolean;
		newComment?: boolean;
		newLike?: boolean;
		newSubscriber?: boolean;
		tip?: boolean;
	};
	emailNotification?: {
		enabled?: boolean;
		newSubscriber?: boolean;
		tip?: boolean;
	};
	inAppNotification?: {
		enabled?: boolean;
		newFollower?: boolean;
		newComment?: boolean;
		newLike?: boolean;
		newSubscriber?: boolean;
		tip?: boolean;
	};
}

interface VerifyAgePayload {
	discordId: string;
}

interface UnlockMessageAssetPayload {
	buyerId: string;
	sellerId: string;
	conversationId: string;
	messageId: string;
}

interface ReadNotificationPayload {
	discordId: string;
	notificationId: string;
}

interface GuestSigninPayload {
	username: string;
	password: string;
	isSeller?: boolean;
}

interface GuestSignupPayload {
	username: string;
	password: string;
	isSeller?: boolean;
}

export const discordSigninService = async () => {
	// Store the current page in sessionStorage for mobile redirect handling
	if (typeof window !== "undefined") {
		sessionStorage.setItem("discord_signin_source", window.location.pathname);
		const hostname = window.location.hostname.toLowerCase();
		const isLocalHost =
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname.endsWith(".local");

		if (isLocalHost) {
			const callbackUrl = `${window.location.origin}/auth/callback`;
			const signinUrl = `${baseURL}/auth/discord/signin?callback=${encodeURIComponent(
				callbackUrl
			)}`;
			window.location.href = signinUrl;
			return;
		}
	}
	window.location.href = `${baseURL}/auth/discord/signin`;
};

export const guestSigninService = async (payload: GuestSigninPayload) => {
	try {
		const response = await api.post("/auth/discord/signin", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Guest signin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const guestSignupService = async (payload: GuestSignupPayload) => {
	try {
		const response = await api.post("/auth/discord/signup", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Guest signup failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const createPinService = async (payload: CreatePinPayload) => {
	try {
		const response = await api.post("/auth/create-pin", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create pin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const removePinService = async (payload: RemovePinPayload) => {
	try {
		const response = await api.post("/auth/remove-pin", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Remove pin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const changePinService = async (payload: ChangePinPayload) => {
	try {
		const response = await api.post("/auth/change-pin", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Change pin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const generateOTPService = async (payload: GenerateOTPPayload) => {
	try {
		const response = await api.post("/auth/2fa/generate", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Generate OTP failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const verifyOtpService = async (payload: VerifyOTPPayload) => {
	try {
		const response = await api.post("/auth/2fa/verify", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Verify OTP failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const verifyAgeService = async (payload: VerifyAgePayload) => {
	try {
		const response = await api.post("/auth/verify-age", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Verify OTP failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const generateBackupCodesService = async (
	payload: GenerateBackupCodesPayload
) => {
	try {
		const response = await api.post("/auth/2fa/generate-backup-codes", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Generate backup codes failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const removeAuthenticatorAppService = async (
	payload: RemoveAuthenticatorAppPayload
) => {
	try {
		const response = await api.post("/auth/2fa/disable", payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Authenticator app removal failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getUserService = async () => {
	try {
		// Auth identity must always be fresh and never served from client cache.
		const response = await api.get("/user", { cache: false });
		// console.log("CURRENT USER", response.data);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get user failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const logoutUserService = async () => {
	try {
		const response = await api.post("/auth/logout");

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Logout failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const updateUserService = async ({
	payload,
	discordId,
}: {
	payload: UpdateUserPayload;
	discordId: string;
}) => {
	try {
		const response = await api.patch(`/user/${discordId}`, payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get user failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const getUserByIdService = async (id: string) => {
	try {
		const response = await api.get(`/user/${id}`);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get user failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getPostsService = async ({
	visibility,
	cursor,
	limit = 10,
}: {
	visibility: string;
	cursor?: string;
	limit?: number;
}) => {
	try {
		const params: Record<string, string | number> = {
			// visibility,
			limit,
		};

		if (cursor) {
			params.cursor = cursor;
		}

		const response = await api.get("/post", {
			params,
		});

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get posts failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getTrendingPostsService = async (limit: number = 10) => {
	try {
		const response = await api.get("/post/trending", {
			params: { limit },
		});

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get trending posts failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const uploadProfileImageService = async ({
	discordId,
	image,
	onUploadProgress,
}: UploadProfileImagePayload) => {
	try {
		const formData = new FormData();
		formData.append("file", image);

		const response = await api.post(
			`user/${discordId}/profile-image`,
			formData,
			{
				onUploadProgress,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Upload profile image failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const uploadBannerImageService = async ({
	discordId,
	image,
	onUploadProgress,
}: UploadBannerImagePayload) => {
	try {
		const formData = new FormData();
		formData.append("file", image);

		const response = await api.post(
			`user/${discordId}/profile-banner`,
			formData,
			{
				onUploadProgress,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Upload banner image failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const removeBannerImageService = async (id: string) => {
	try {
		const response = await api.delete(`/user/${id}/profile-banner`);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Remove banner image failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const removeProfileImageService = async (id: string) => {
	try {
		const response = await api.delete(`/user/${id}/profile-image`);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Remove banner image failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const createSubscriptionPlanService = async (
	discordId: string,
	payload: CreateSubscriptionPayload
) => {
	try {
		const response = await api.post(`/subscription/plan/${discordId}`, payload);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create pin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getSubscriptionPlansService = async (discordId: string) => {
	try {
		const response = await api.get(`/subscription/plans/${discordId}`);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get posts failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const editSubscriptionPlanService = async (
	payload: EditSubscriptionPayload
) => {
	try {
		const response = await api.patch(
			`/subscription/plan/${payload.id}`,
			payload
		);

		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create pin failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

interface LikePayload {
	discordID: string;
	targetId: string;
	targetType: string;
}

interface CommentPayload {
	authorId: string;
	postId: string;
	content: string;
	parentCommentId?: string;
}

export const createCommentService = async (payload: CommentPayload) => {
	try {
		const response = await api.post("/post/comment", payload);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Comment creation failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getCommentsService = async (postId: string) => {
	try {
		const response = await api.get(`/post/post-comments/${postId}`);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get comments failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const getRepliesService = async (commentId: string) => {
	try {
		const response = await api.get(`/post/replies/${commentId}`);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get comments failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const likePostService = async (payload: LikePayload) => {
	try {
		const response = await api.post(
			`/post/like/${payload.targetType.toLowerCase()}`,
			payload
		);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Like failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const unlikePostService = async (payload: LikePayload) => {
	try {
		const response = await api.post(
			`/post/unlike/${payload.targetType.toLowerCase()}`,
			payload
		);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Unlike failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const hasLikedService = async (
	targetType: string,
	targetId: string,
	signal?: AbortSignal
) => {
	try {
		const response = await api.get(
			`/post/has-liked/${targetType.toLowerCase()}/${targetId}`,
			{ signal }
		);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Check like status failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Get post by ID service
export const getPostByIdService = async (id: string) => {
	try {
		const response = await api.get(`/post/${id}`);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Get post failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Update post service
interface UpdatePostPayload {
	title?: string;
	content?: string;
	visibility?: "general" | "subscribers" | "premium";
	visibleToPlan?: string;
	priceToView?: string;
	tippingEnabled?: boolean;
	categories?: string[];
	scheduledPost?: {
		isScheduled: boolean;
		scheduledFor?: string;
	};
	isDraft?: boolean;
	mediaMeta?: Array<{
		type: "image" | "video";
		caption?: string;
	}>;
}

export const updatePostService = async (
	id: string,
	payload: UpdatePostPayload
) => {
	try {
		const response = await api.patch(`/post/${id}`, payload);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Update post failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Delete post service
export const deletePostService = async (id: string, discordId: string) => {
	try {
		const response = await api.delete(`/post/${id}?discordId=${discordId}`);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Delete post failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Admin: delete post by id
export const deleteAdminPostService = async (postId: string) => {
	try {
		const response = await api.delete(`/admin/posts/${postId}`);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to delete post",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getConversationsService = async () => {
	try {
		// Use uncached request for unread accuracy.
		const response = await axios.get(`${baseURL}/chat/conversations`, {
			withCredentials: true,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
			params: { _t: Date.now() },
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Failed to fetch conversations",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

const DEFAULT_CONVERSATION_LIMIT = 50;
const CONVERSATION_RESPONSE_TTL_MS = 5000;
const conversationRequestCache = new Map<
	string,
	{ expiresAt: number; data: any }
>();
const inFlightConversationRequests = new Map<string, Promise<any>>();

const pruneConversationRequestCache = (now: number) => {
	for (const [key, value] of conversationRequestCache.entries()) {
		if (value.expiresAt <= now) {
			conversationRequestCache.delete(key);
		}
	}
};

const buildConversationRequestKey = (
	id: string,
	params?: { from?: string; to?: string; limit?: number; force?: boolean }
) => {
	const normalizedLimit = params?.limit ?? DEFAULT_CONVERSATION_LIMIT;
	const normalizedFrom = params?.from ?? "";
	const normalizedTo = params?.to ?? "";
	return `${id}|${normalizedLimit}|${normalizedFrom}|${normalizedTo}`;
};

export const getConversationByIdService = async (
	id: string,
	params?: { from?: string; to?: string; limit?: number; force?: boolean }
) => {
	try {
		const requestKey = buildConversationRequestKey(id, params);
		const now = Date.now();
		pruneConversationRequestCache(now);
		const shouldBypassCache = params?.force === true;

		if (!shouldBypassCache) {
			const cached = conversationRequestCache.get(requestKey);
			if (cached && cached.expiresAt > now) {
				return cached.data;
			}

			const existingRequest = inFlightConversationRequests.get(requestKey);
			if (existingRequest) {
				return await existingRequest;
			}
		}

		const normalizedParams = {
			limit: params?.limit ?? DEFAULT_CONVERSATION_LIMIT,
			...(params?.from ? { from: params.from } : {}),
			...(params?.to ? { to: params.to } : {}),
			...(shouldBypassCache ? { _t: Date.now() } : {}),
		};

		const requestPromise = axios
			.get(`${baseURL}/chat/conversations/${id}`, {
				params: normalizedParams,
				withCredentials: true,
				headers: { "Content-Type": "application/json" },
			})
			.then((response) => {
				conversationRequestCache.set(requestKey, {
					data: response.data,
					expiresAt: Date.now() + CONVERSATION_RESPONSE_TTL_MS,
				});
				return response.data;
			})
			.finally(() => {
				inFlightConversationRequests.delete(requestKey);
			});

		inFlightConversationRequests.set(requestKey, requestPromise);

		return await requestPromise;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch conversation",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getConversationBetweenUsersService = async (
	discordIds: string[]
) => {
	try {
		// Build explicit query string to avoid passing through the cached client
		const qs = discordIds
			.map((id) => `discordIds=${encodeURIComponent(id)}`)
			.join("&");
		const response = await axios.get(
			`${baseURL}/chat/conversations-between?${qs}`,
			{ withCredentials: true }
		);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message ||
					"Failed to fetch conversation between users",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const sendMessageService = async (payload: FormData) => {
	try {
		const response = await api.post("/chat/messages", payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to send message",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Chat media assets service
interface CreateMediaAssetPayload {
	formData: FormData;
}

export const createMediaAssetService = async (
	payload: CreateMediaAssetPayload
) => {
	try {
		const response = await api.post("/chat/media-assets", payload.formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to create media asset",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getAllUsersService = async () => {
	try {
		const response = await api.get("/user/users");
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch users",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getBannedUsersService = async () => {
	try {
		const response = await api.get("/admin/users/banned");
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch banned users",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const banUserByDiscordIdService = async (
	discordId: string,
	payload: { reason: string }
) => {
	try {
		const response = await api.patch(`/admin/users/${discordId}/ban`, payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to ban user",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const unbanUserByDiscordIdService = async (discordId: string) => {
	try {
		const response = await api.patch(`/admin/users/${discordId}/unban`);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to unban user",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const deleteUserByDiscordIdService = async (discordId: string) => {
	try {
		const response = await api.delete(`/admin/users/${discordId}`);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to delete user",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getAdminChatsService = async (
	user1DiscordId: string,
	user2DiscordId: string
) => {
	try {
		const response = await api.get("/admin/chats", {
			params: { user1DiscordId, user2DiscordId },
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Failed to fetch conversation",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getNotificationsService = async ({
	userId,
	page = 1,
}: {
	userId: string;
	page?: number;
}): Promise<NotificationsResponseType> => {
	try {
		const response = await api.get(`/notification/${userId}`, {
			params: { page },
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Failed to fetch notifications",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const readNotificationService = async (
	payload: ReadNotificationPayload
) => {
	try {
		const response = await api.patch("/notification/read", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to read notification",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
export const getCreatorsService = async (): Promise<UserType[]> => {
	try {
		const response = await api.get("/user/creators");
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch users",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

interface CreateConversationPayload {
	participantId: string;
}

export const createConversationService = async (
	payload: CreateConversationPayload
) => {
	try {
		const response = await api.post("/chat/conversations", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create conversation failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Post creation service
interface CreatePostPayload {
	formData: FormData;
}

export const createPostService = async (payload: CreatePostPayload) => {
	try {
		return await api.post("/post", payload.formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		// return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create post failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Category creation service
interface CreateCategoryPayload {
	general: boolean;
	categories: string[];
	creator: string;
}

export const createCategoryService = async (payload: CreateCategoryPayload) => {
	try {
		const response = await api.post("/post/category", payload);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Create category failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Get general categories service
export const getGeneralCategoriesService = async () => {
	try {
		const response = await api.get("/post/category/general");
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Get general categories failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Get creator categories service
export const getCreatorCategoriesService = async (creatorId: string) => {
	try {
		const response = await api.get(`/post/category/${creatorId}`);
		return response;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Get creator categories failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getWalletService = async (discordId: string) => {
	try {
		const response = await api.get(`/wallet/${discordId}`);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch wallet",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getWalletTransactionsService = async (
	discordId: string,
	limit = 100
) => {
	if (!discordId) return [] as WalletTransactionType[];
	try {
		const response = await api.get(`/wallet/${discordId}/transactions`, {
			params: { limit },
		});
		return response.data as WalletTransactionType[];
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch wallet",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const fundWalletService = async ({ amount }: { amount: string }) => {
	try {
		const response = await api.post("/wallet/fund", { amount });
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch wallet",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const tipService = async (payload: TipPayload) => {
	try {
		const response = await api.post("/payment/tip", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Tip payment failed",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const unlockMessageAssetService = async (
	payload: UnlockMessageAssetPayload
) => {
	try {
		const response = await api.post("/payment/message-asset", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to unlock media",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getOnlineUsersService = async () => {
	try {
		const response = await api.get("/chat/online-users");
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch online users",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Call Services
interface StartCallPayload {
	callerId: string;
	calleeId: string;
	callType: "audio" | "video";
}

export const startCallService = async (payload: StartCallPayload) => {
	try {
		const response = await api.post("/chat/call", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to start call",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

interface SetOngoingCallPayload {
	callId: string;
}

export const setOngoingCallService = async (payload: SetOngoingCallPayload) => {
	try {
		const response = await api.patch("/chat/call", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to set ongoing call",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

interface EndCallPayload {
	callerId: string;
	calleeId: string;
	callId: string;
	callStatus: "ended";
	duration: number;
}

export const endCallService = async (payload: EndCallPayload) => {
	try {
		const response = await api.patch("/chat/call-end", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to end call",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
}; 



export const getFanInsightsService = async ({
	buyerId,
	sellerId,
}: {
	sellerId: string;
	buyerId: string;
}) => {
	try {
		const response = await api.get("/payment-analytics/fan-insight", {
			params: {
				buyerId,
				sellerId,
			},
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch fan insights",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Chat Note Services
interface CreateChatNotePayload {
	seller: string;
	buyer: string;
	note: string;
}

export const createChatNoteService = async (payload: CreateChatNotePayload) => {
	try {
		const response = await api.post("/chat/note", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to create/update note",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getChatNoteService = async ({
	seller,
	buyer,
}: {
	seller: string;
	buyer: string;
}) => {
	try {
		const response = await api.get("/chat/note", {
			params: {
				seller,
				buyer,
			},
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch note",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const deleteChatNoteService = async (id: string) => {
	try {
		const response = await api.delete(`/chat/note/${id}`);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to delete note",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Creator Race Services
interface SetRacePayload {
	race: string;
}

export const setCreatorRaceService = async (
	id: string,
	payload: SetRacePayload
) => {
	try {
		const response = await api.patch(`/creator/race/${id}`, payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to set race",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const editCreatorRaceService = async (
	id: string,
	payload: SetRacePayload
) => {
	try {
		const response = await api.patch(`/creator/race/edit/${id}`, payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to update race",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

export const getCreatorsByRaceService = async (race?: string) => {
	try {
		const response = await api.get("/creator/race", {
			params: race ? { race } : {},
		});
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message: error.response.data?.message || "Failed to fetch creators",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};

// Update seller's camera/call settings
interface CamSettingsPayload {
	sellerId: string;
	rate: number;
	minimumCallTime: number;
	takingCams: boolean;
	takingCalls: boolean;
}

export const updateCamSettingsService = async (payload: CamSettingsPayload) => {
	try {
		const response = await api.patch("/creator/cam-settings", payload);
		return response.data;
	} catch (error: any) {
		if (error.response) {
			throw {
				message:
					error.response.data?.message || "Failed to update cam settings",
				status: error.response.status,
				data: error.response.data,
			};
		}
		if (error.request) {
			throw { message: "No response from server", status: null };
		}
		throw { message: error.message || "Unexpected error", status: null };
	}
};
