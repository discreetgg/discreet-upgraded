import api from "@/lib/axios";

export const getSubscriptions = async (discordId: string) => {
	if (!discordId) return [] as unknown as SubscriptionType;
	try {
		const response = await api.get(`/subscription/plans/${discordId}`);

		return response.data as unknown as SubscriptionType;
	} catch (error: any) {
		console.log("GET MENU ITEMS ERROR", error);
		return {} as unknown as SubscriptionType;
	}
};

export const subscribeToPlan = async (payload: SubscribePayload) => {
	try {
		const response = await api.post("/payment/subscribe", payload);
		console.log("SUBSCRIBE RESPONSE", response.data);
		return response.data;
	} catch (error) {
		console.log("ERROR:Unable to subscribe to plan", error);
		throw error;
	}
};
