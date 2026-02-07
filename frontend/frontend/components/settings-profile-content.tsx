"use client";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGlobal } from "@/context/global-context-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProfileHeaderDetailSection } from "./profile-header-detail-section";
import { SettingsProfileRemoveBannerImageDialog } from "./settings-profile-remove-banner-image-dialog";
import { SettingsProfileRemoveProfileImageDialog } from "./settings-profile-remove-profile-image-dialog";
import { Textarea } from "./ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { raceOptionsWithLabels } from "@/lib/data";
import { editCreatorRaceService } from "@/lib/services";
import { toast } from "sonner";
import { useWallet } from "@/context/wallet-context-provider";

const MAX_BIO_LENGTH = 120;
export const EditProfileFormSchema = z.object({
	username: z.string({ required_error: "Username is required." }),
	displayName: z.string({ required_error: "Display name is required." }),
	bio: z
		.string({ required_error: "Bio is required." })
		.trim()
		.max(120, {
			message: `Bio must be at most ${MAX_BIO_LENGTH} characters.`,
		}),
});

export const SettingsProfileContent = () => {
	const { user, setProfileSettingForm, setUser } = useGlobal();
	const { wallet, setWallet } = useWallet();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Mock user data - replace with real data
	const userWalletBalance = wallet?.balance ?? 0;

	const isSeller = user?.role === "seller";
	const form = useForm<z.infer<typeof EditProfileFormSchema>>({
		resolver: zodResolver(EditProfileFormSchema),
		defaultValues: {
			username: `@${user?.username}` || "@",
			displayName: user?.displayName || "",
			bio: (isSeller && user?.bio) || "",
		},
		mode: "onChange",
	});
	const [bioCounter, setBioCounter] = useState(user?.bio ? user.bio.length : 0);
	const [selectedRace, setSelectedRace] = useState<string>(user?.race || "");
	const [isUpdatingRace, setIsUpdatingRace] = useState(false);

	useEffect(() => {
		const subscription = form.watch(() => {
			setProfileSettingForm(form);
		});

		return () => subscription.unsubscribe();
	}, [form, setProfileSettingForm]);
	const formBio = form.watch("bio");
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const bioLength = form.getValues("bio")?.trim().length || 0;
		setBioCounter(bioLength);
	}, [formBio]);

	// Update race when user changes
	useEffect(() => {
		if (user?.race) {
			setSelectedRace(user.race);
		}
	}, [user?.race]);

	const handleRaceChange = (race: string) => {
		if (!user?.discordId) {
			toast.error("User information not found");
			return;
		}

		setSelectedRace(race);
		setIsUpdatingRace(true);

		editCreatorRaceService(user.discordId, { race })
			.then((response) => {
				toast.success("Race updated successfully");
				// Update user context if needed
				if (setUser && response.user) {
					setUser(response.user);
				}
			})
			.catch((error) => {
				console.error("Failed to update race:", error);
				toast.error(error.message || "Failed to update race");
				// Revert to previous value on error
				setSelectedRace(user?.race || "");
			})
			.finally(() => {
				setIsUpdatingRace(false);
			});
	};

	return (
		<div className="w-full flex flex-col  justify-between  gap-y-10 md:gap-y-20">
			<div className="flex gap-8 flex-col-reverse lg:flex-row">
				<Form {...form}>
					<form className="p-4 md:px-8 md:py-6 w-full rounded-lg border shadow-[4px_4px_0_0_#1E1E21] space-y-10">
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem className="gap-4">
									<FormLabel className="text-[#8A8C95] font-medium">
										Username
									</FormLabel>
									<FormControl>
										<Input
											disabled
											placeholder={`@${user?.username}`}
											className="rounded !bg-[#0F1114] border-[#1F2227] py-3.5 px-4 h-auto"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="displayName"
							render={({ field }) => (
								<FormItem className="gap-4">
									<FormLabel className="text-[#8A8C95] font-medium">
										Display Name
									</FormLabel>
									<FormControl>
										<Input
											placeholder={user?.displayName}
											className="rounded !bg-[#0F1114] border-[#1F2227] py-3.5 px-4 h-auto"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Race field - updates immediately on change, not part of the form */}
						{isSeller && (
							<div className="gap-4 flex flex-col">
								<label className="text-[#8A8C95] font-medium text-sm">
									Race
								</label>
								<Select
									value={selectedRace}
									onValueChange={handleRaceChange}
									disabled={isUpdatingRace}
								>
									<SelectTrigger className="rounded !bg-[#0F1114] border-[#1F2227] py-3.5 px-4 h-auto disabled:opacity-50 w-full">
										<SelectValue placeholder="Select race">
											{raceOptionsWithLabels.find(
												(race) => race.value === selectedRace
											)?.label || "Select race"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent className="rounded shadow-[2px_2px_0_0_#1F2227] p-4 border-[#1F2227] border !bg-[#0F1114]">
										{raceOptionsWithLabels.map((race) => (
											<SelectItem
												key={race.value}
												className="py-4 first:pt-0 last:pb-0 last:border-none text-[15px] text-[#D4D4D8] hover:text-white border-b rounded-none"
												value={race.value}
											>
												{race.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{isUpdatingRace && (
									<span className="text-[#8A8C95] text-xs">Updating...</span>
								)}
							</div>
						)}

						{isSeller && (
							<FormField
								control={form.control}
								name="bio"
								render={({ field }) => (
									<FormItem className="gap-4 relative">
										<FormLabel className="text-[#8A8C95] font-medium flex items-center gap-1.5">
											Bio{" "}
											<span className="text-[#8A8C95] text-[10px]">
												* 120 Characters Max
											</span>
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={"Tell us about yourself..."}
												maxLength={MAX_BIO_LENGTH}
												className="rounded font-inter font-light !bg-[#0F1114] resize-none h-[185px]  border-[#1F2227] py-3.5 px-4 peer"
												{...field}
											/>
										</FormControl>
										<div
											data-valid={bioCounter <= MAX_BIO_LENGTH}
											className="opacity-0 peer-focus:opacity-100 flex w-full items-center justify-end gap-x-4 data-[valid=false]:justify-between"
										>
											<FormMessage />
											<span className=" text-[#8A8C95] text-[11px] justify-self-end ">
												<span
													data-valid={bioCounter <= MAX_BIO_LENGTH}
													className="  data-[valid=false]:text-destructive"
												>
													{bioCounter}
												</span>
												/{MAX_BIO_LENGTH}
											</span>
										</div>
									</FormItem>
								)}
							/>
						)}
					</form>
				</Form>
				<div className="lg:max-w-[344px] w-full space-y-[22px]">
					<ProfileHeaderDetailSection showEditButton={false} />
					<div className="flex items-center gap-8">
						<SettingsProfileRemoveBannerImageDialog />
						<SettingsProfileRemoveProfileImageDialog />
					</div>
				</div>
			</div>
		</div>
	);
};
