"use client";

import { useGlobal } from "@/context/global-context-provider";
import { updateUserService } from "@/lib/services";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import type { NotificationFormSchema } from "./settings-notifications-content";
import type { EditProfileFormSchema } from "./settings-profile-content";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Noop } from "react-hook-form";

export const SettingsSave = ({ className }: { className?: string }) => {
	const { profileSettingForm, notificationForm, user, setUser } = useGlobal();

	const [isLoading, setIsLoading] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [hasProfileChanges, setHasProfileChanges] = useState(false);
	const [hasNotificationChanges, setHasNotificationChanges] = useState(false);

	// Use useEffect to track form changes and compare with user data
	useEffect(() => {
		if (!profileSettingForm && !notificationForm) {
			setHasChanges(false);
			return;
		}

		// Subscribe to form changes
		const subscriptions: { unsubscribe: Noop }[] = [];

		if (profileSettingForm) {
			const profileSub = profileSettingForm.watch(() => {
				updateChangeStatus();
			});
			subscriptions.push(profileSub);
		}

		if (notificationForm) {
			const notificationSub = notificationForm.watch(() => {
				updateChangeStatus();
			});
			subscriptions.push(notificationSub);
		}

		const updateChangeStatus = () => {
			let profileHasChanges = false;
			let notificationHasChanges = false;

			if (profileSettingForm && user) {
				const formValues = profileSettingForm.getValues();
				// Normalize and compare profile form values with user data
				const normalizedUsername = formValues.username.replace(/^@/, "").trim();
				const normalizedDisplayName = formValues.displayName.trim();
				const normalizedBio = formValues.bio.trim();

				const userUsername = user.username || "";
				const userDisplayName = user.displayName || "";
				const userBio = user.bio || "";

				profileHasChanges =
					normalizedUsername !== userUsername ||
					normalizedDisplayName !== userDisplayName ||
					normalizedBio !== userBio;
			}

			if (notificationForm && user) {
				const formValues = notificationForm.getValues();
				const discordChanged =
					JSON.stringify(formValues.discordNotification) !==
					JSON.stringify(user.discordNotification);
				const emailChanged =
					JSON.stringify(formValues.emailNotification) !==
					JSON.stringify(user.emailNotification);
				const inAppChanged =
					JSON.stringify(formValues.inAppNotification) !==
					JSON.stringify(user.inAppNotification);
				notificationHasChanges = discordChanged || emailChanged || inAppChanged;
			}

			setHasProfileChanges(profileHasChanges);
			setHasNotificationChanges(notificationHasChanges);
			setHasChanges(profileHasChanges || notificationHasChanges);
		};

		// Initial check
		updateChangeStatus();

		return () => {
			subscriptions.forEach((sub) => sub.unsubscribe());
		};
	}, [profileSettingForm, notificationForm, user]);

	const onEditProfileSubmit = async (
		data: z.infer<typeof EditProfileFormSchema>
	) => {
		setIsLoading(true);
		await updateUserService({
			payload: data,
			discordId: user?.discordId ?? "",
		})
			.then((response) => {
				if (user) {
					const updatedUser = {
						...user,
						...response.data.user,
					};
					setUser(updatedUser);
					// Reset form with new values from server response
					profileSettingForm?.reset({
						username: `${updatedUser.username}` || "",
						displayName: updatedUser.displayName || "",
						bio: updatedUser.bio || "",
					});
				}
				toast.success("Profile updated successfully!");
			})
			.catch((error) => {
				toast.error("Failed to Update Profile", { description: error.message });
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const onNotificationSubmit = async (
		data: z.infer<typeof NotificationFormSchema>
	) => {
		setIsLoading(true);
		await updateUserService({
			payload: data,
			discordId: user?.discordId ?? "",
		})
			.then((response) => {
				if (user) {
					const updatedUser = {
						...user,
						...response.data.user,
					};
					setUser(updatedUser);

					// Reset form with new values from server response
					notificationForm?.reset({
						discordNotification: updatedUser.discordNotification || {
							enabled: false,
							newComment: false,
							newFollower: false,
							newLike: false,
							newSubscriber: false,
							tip: false,
						},
						emailNotification: updatedUser.emailNotification || {
							enabled: false,
							newSubscriber: false,
							tip: false,
						},
						inAppNotification: updatedUser.inAppNotification || {
							enabled: false,
							newComment: false,
							newFollower: false,
							newLike: false,
							newSubscriber: false,
							tip: false,
						},
					});
				}
				toast.success("Notifications updated successfully!");
			})
			.catch((error) => {
				toast.error("Failed to Update Notifications", {
					description: error.message,
				});
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	return (
		<Button
			onClick={() => {
				if (hasProfileChanges && profileSettingForm) {
					profileSettingForm.handleSubmit(onEditProfileSubmit)();
				}
				if (hasNotificationChanges && notificationForm) {
					notificationForm.handleSubmit(onNotificationSubmit)();
				}
			}}
			disabled={!hasChanges || isLoading} // Disable if no changes in either form—shadow mode engaged!
			className={cn(
				"rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] absolutex right-4 -top-2",
				className
			)}
		>
			Sav{isLoading ? "ing..." : "e"}
		</Button>
	);
};
