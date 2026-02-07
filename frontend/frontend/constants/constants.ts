import { Icon } from "../components/ui/icons";

export const FALLBACK_IMAGE = "/logo.png";
export const SUBSCRIPTION_PLAN_ICONS = [
	{
		id: "1",

		icon: Icon.startSlash,
	},
	{
		id: "2",
		icon: Icon.premiumSubscriptionPlan,
	},
	{
		id: "3",

		icon: Icon.heart,
	},
	{
		id: "4",
		icon: Icon.freeSubscriptionPlan,
	},
	{
		id: "5",
		icon: Icon.infinity,
	},
	{
		id: "6",
		icon: Icon.nebulas,
	},
];
export const SETTINGS_TABS = [
	{
		label: "Profile",
		value: "profile",
		icon: Icon.profile,
		iconActive: Icon.profileActive,
	},
	{
		label: "Security",
		value: "security",
		icon: Icon.security,
		iconActive: Icon.securityActive,
	},
	{
		label: "Notifications",
		value: "notifications",
		icon: Icon.notifications,
		iconActive: Icon.notificationsActive,
	},
	// {
	// 	label: "Subscriptions",
	// 	value: "subscriptions",
	// 	icon: Icon.subscription,
	// 	iconActive: Icon.subscriptionActive,
	// },
];

export const PROFILE_SIDE_TABS = [
	{
		label: "Subscriptions",
		value: "subscriptions",
		icon: Icon.star,
		iconActive: Icon.subscriptionActive,
	},
	{
		label: "Menu",
		value: "menu",
		icon: Icon.menu,
		iconActive: Icon.menuActive,
	},
];
