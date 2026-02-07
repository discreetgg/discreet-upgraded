declare global {
	interface PostPerformanceType {
		totalViews: number;
		totalPosts: number;
		totalComments: number;
		totalEarnings: number;
		totalLikes: number;
		seller: string;
	}
	interface AllTimeEarningsType {
		totalEarnings: number;
		seller: string;
	}
	interface MonthlyEarningsType {
		totalMonthlyEarnings: number;
		month: number;
		year: number;
		seller: string;
		breakdown: {
			CALL_SESSION: number;
			MEDIA_PURCHASE: number;
			MENU_PURCHASE: number;
			SUBSCRIPTION: number;
			SUBSCRIPTION_RENEWAL: number;
			TIP: number;
		};
	}
	interface ReportPayload {
		reporterDiscordID: string;
		targetType: "User" | "Post" | "Comment";
		targetId: string;
		reason: string;
		description: string;
	}
	interface SubscribeResponseType {
		subscribedPlan: SubscribedPlan;
		message: string;
		tx: {
			amount: number;
			currency: string;
			createdAt: string;
			creditTx: string;
			debitTx: string;
			payer: string;
			receiver: string;
			type: string;
			status: string;
			updatedAt: string;
			id: string;
		};
		meta: SubscribedMeta;
	}
	interface SubscribedMeta {
		amount: number;
		endDate: string;
		fromUser: string;
		planDuration: string;
		planId: string;
		planName: string;
		startDate: string;
		subscriptionDuration: number;
		toUser: string;
		type: string;
	}
	interface SubscribedPlan {
		createdAt: string;
		durationInMonths: number;
		id: string;
		isActive: boolean;
		isAutoRenew: boolean;
		lastPayment: string;
		meta: SubscribedMeta;
		plan: string;
		renewCount: number;
		startDate: string;
		status: string;
		updatedAt: string;
		user: string;
	}
	interface SubscribePayload {
		planId: string;
		sellerId: string;
		buyerId: string;
		durationInMonths: number;
	}
	interface BuyMenuItemPayload {
		menuId: string;
		sellerId: string;
		buyerId: string;
		itemCount: number;
	}
	type SubscriptionType = {
		creator: {
			_id: string;
			discordId: string;
			displayName: string;
			discordAvatar: string;
			role: string;
			username: string;
		};
		plans: PlanType[];
	};
	type PlanType = {
		_id: string;
		amount: string;
		creator: string;
		description: string;
		icon: string;
		name: string;
		subscribersCount: number;
		isDeleted: boolean;
		isArchived: boolean;
		createdAt: string;
		updatedAt: string;
	};
	type PostMediaType = {
		postId: string;
		mediaUrl: string;
		type: "image" | "video";
	};
	type MenuItemType = {
		_id: string;
		author: AuthorType;
		title: string;
		description: string;
		priceToView: string;
		itemCount: number;
		itemSold: number;
		noteToBuyer: string;
		discount: string;
		canBeUpdated: boolean;
		collectionType: string;
		category: {
			_id: string;
			hashtag: string;
			category: string;
		};
		coverImage: {
			url: string;
			_id: string;
		};
		media: MenuMediaType[];
		type: "single" | "bundles";
		createdAt: string;
		updatedAt: string;
	};
	type MenuMediaType = {
		url: string;
		type: "image" | "video";
		_id: string;
		menu: string;
		owner: string;
	};
	type AuthorType = {
		_id: string;
		discordId: string;
		displayName: string;
		discordAvatar: string;
		profileImage: ProfileImageType | null;
		username: string;
		role: string;
	};
}

export {};
