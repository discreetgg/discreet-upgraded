"use client";

import { useGlobal } from "@/context/global-context-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Control, useForm } from "react-hook-form";
import { z } from "zod";
import { SettingsAlertPreferences } from "./settings-alert-preferences";
import { SettingsNotificationsGroup } from "./settings-notifications-group";
import { Form } from "./ui/form";

export const NotificationFormSchema = z.object({
	discordNotification: z.object({
		enabled: z.boolean(),
		newComment: z.boolean(),
		newFollower: z.boolean(),
		newLike: z.boolean(),
		newSubscriber: z.boolean(),
		tip: z.boolean(),
	}),
	emailNotification: z.object({
		enabled: z.boolean(),
		newSubscriber: z.boolean(),
		tip: z.boolean(),
	}),
	inAppNotification: z.object({
		enabled: z.boolean(),
		newComment: z.boolean(),
		newFollower: z.boolean(),
		newLike: z.boolean(),
		newSubscriber: z.boolean(),
		tip: z.boolean(),
	}),
});

export type NotificationSettingsType = z.infer<typeof NotificationFormSchema>;
export type NotificationControl = Control<NotificationSettingsType>;

export const SettingsNotificationsContent = () => {
	const { user, setNotificationForm } = useGlobal();

	const form = useForm<z.infer<typeof NotificationFormSchema>>({
		resolver: zodResolver(NotificationFormSchema),
		defaultValues: {
			discordNotification: user?.discordNotification || {
				enabled: false,
				newComment: false,
				newFollower: false,
				newLike: false,
				newSubscriber: false,
				tip: false,
			},
			emailNotification: user?.emailNotification || {
				enabled: false,
				newSubscriber: false,
				tip: false,
			},
			inAppNotification: user?.inAppNotification || {
				enabled: false,
				newComment: false,
				newFollower: false,
				newLike: false,
				newSubscriber: false,
				tip: false,
			},
		},
		mode: "onChange",
	});

	useEffect(() => {
		const subscription = form.watch(() => {
			setNotificationForm(form);
		});

		return () => subscription.unsubscribe();
	}, [form]);

	const isBuyer = user?.role === "buyer";

	const discordFields = [
		"newComment",
		"newFollower",
		"newLike",
		"newSubscriber",
		...(isBuyer ? [] : ["tip"]),
	];

	const emailFields = ["newSubscriber", ...(isBuyer ? [] : ["tip"])];
	const inAppFields = [
		"newComment",
		"newFollower",
		"newLike",
		"newSubscriber",
		...(isBuyer ? [] : ["tip"]),
	];

	return (
		<Form {...form}>
			<form
				onChange={() => setNotificationForm(form)}
				className="px-8 pt-[35px] pb-[106px] w-full rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-[38px]"
			>
				<SettingsNotificationsGroup
					control={form.control}
					name="discordNotification"
					title="Discord Notifications"
					description="Get push notifications to find out what's going on when you're not on discreet. You can turn them off anytime."
					fields={discordFields}
				/>

				<SettingsNotificationsGroup
					control={form.control}
					name="emailNotification"
					title="Email Notifications"
					description="Get push notifications to find out what's going on when you're not on discreet. You can turn them off anytime."
					fields={emailFields}
				/>

				<SettingsNotificationsGroup
					control={form.control}
					name="inAppNotification"
					title="In-App Notifications"
					description="Get push notifications to find out what's going on when you're not on discreet. You can turn them off anytime."
					fields={inAppFields}
				/>

				<SettingsAlertPreferences />
			</form>
		</Form>
	);
};
