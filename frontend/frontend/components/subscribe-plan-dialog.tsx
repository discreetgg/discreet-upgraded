"use client";

import {
	SubscribeDialog,
	SubscribeDialogClose,
	SubscribeDialogContent,
	SubscribeDialogDescription,
	SubscribeDialogTitle,
	SubscribeDialogTrigger,
} from "@/components/ui/subscribe-dialog";
import { UserType } from "@/types/global";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImageWithFallback } from "./miscellaneous/image-with-fallback";
import { SUBSCRIPTION_PLAN_ICONS } from "@/constants/constants";
import { Icon } from "./ui/icons";
import Link from "next/link";
import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";
import { subscribeToPlan } from "@/actions/subscriptions";
import { toast } from "sonner";

interface Props {
	children: React.ReactNode;
	creator: SubscriptionType["creator"];
	plan: SubscriptionType["plans"][number];
	color: string;
	currentUser: UserType;
	user: UserType;
	isGradient?: boolean;
}

export const SubscribePlanDialog = ({
	children,
	creator,
	plan,
	color,
	user,
	currentUser,
	isGradient = false,
}: Props) => {
	const queryClient = useQueryClient();

	const [open, setOpen] = useState(false);

	const creatorImage = user.profileImage
		? user.profileImage.url
		: `https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.discordAvatar}.png`;

	const SubIcon = SUBSCRIPTION_PLAN_ICONS.find((icon) => icon.id === plan.icon);

	const { mutateAsync: subscribeMutation, isPending } = useMutation({
		mutationKey: ["subscribe-to-plan", plan._id],
		mutationFn: async (payload: SubscribePayload) => {
			await subscribeToPlan(payload);
		},
		onSuccess: async () => {
			setOpen(false);
			await queryClient.invalidateQueries({
				queryKey: ["username_", creator.username],
			});
			await queryClient.invalidateQueries({
				queryKey: ["menu_item", creator.discordId],
			});
			await queryClient.invalidateQueries({
				queryKey: ["subscriptions", creator.discordId],
			});
		},
		onError: (error) => {
			toast.error("Error subscribing to plan. Please try again.");
			console.error("ERROR SUBSCRIBING TO PLAN:", error.message);
			setOpen(false);
		},
	});

	const handleSubscribe = async () => {
		const payload: SubscribePayload = {
			planId: plan._id,
			sellerId: user.discordId,
			buyerId: currentUser?.discordId || "",
			durationInMonths: 1,
		};
		await subscribeMutation(payload);
		setOpen(false);
	};
	return (
		<SubscribeDialog open={open} onOpenChange={setOpen}>
			<SubscribeDialogTrigger asChild>{children}</SubscribeDialogTrigger>
			<SubscribeDialogContent
				showCloseButton={false}
				tabIndex={-1}
				className="flex flex-col bg-medium-charcoal border-none w-full !ring-0 !outline-none justify-start  py-10 px-6 sm:px-24  gap-8 overflow-hidden rounded-xl"
			>
				<div
					className="absolute -right-0 size-[300px] rounded-fullx top-0 blur-3xl pointer-events-none z-0 opacity-50"
					style={{
						background: isGradient
							? "linear-gradient(45deg,transparent,#FFE50034,#00994734)"
							: ` linear-gradient(45deg,transparent,${color}44 100%)`,
					}}
				/>
				<SubscribeDialogClose className=" absolute top-6 left-6 flex items-center gap-x-2 cursor-pointer hover:underline text-accent-text text-xs font-inter">
					<span className="size-3 bg-accent-text text-black flex items-center justify-center rounded-[2px]">
						<ChevronLeft />
					</span>
					Back to profile
				</SubscribeDialogClose>
				<SubscribeDialogDescription className="sr-only">
					{" "}
					Add a subscription
				</SubscribeDialogDescription>
				<div className="flex flex-col gap-y-8 items-center font-inter pb-5 pt-10 z-10 relative">
					<SubscribeDialogTitle className="capitalize text-center text-2xl font-medium leading-[1.2]">
						You&apos;re about to subscribe to{" "}
						<span className="inline-block">{creator.displayName} </span>
						<span className="w-0.5 bg-white h-8 -mb-2 inline-block mr-1" />
						<b>{plan.name.replace(/ Plan$/i, "")} Plan</b>
					</SubscribeDialogTitle>
					<div className="flex -space-x-10 my-5">
						<ImageWithFallback
							src={creatorImage}
							width={200}
							height={200}
							priority
							alt={user.discordDisplayName}
							className="rounded-full object-contain size-[120px]"
						/>

						<div
							style={{
								background: isGradient
									? "linear-gradient(180deg,#FFE500,#009947)"
									: `${color}`,
							}}
							className="rounded-full   relative z-[1] size-[120px] flex items-center justify-center text-white shrink-0 shadow-[-6px_0px_0_0_#000] "
						>
							{SubIcon ? (
								<SubIcon.icon className="size-[44px]" />
							) : (
								<Icon.startSlash className="size-[44px]" />
							)}
						</div>
					</div>
					<p className="text-accent-text text-center text-2xl">
						{plan.description}
					</p>

					<p className="text-accent-text text-xs">
						By completing your purchase below, you agree to our{" "}
						<Link href="#" className="text-accent-color underline">
							Purchase Terms.
						</Link>
						Subscription renews automatically each month, and you may cancel
						anytime.
					</p>
					<Button
						type="button"
						onClick={handleSubscribe}
						className="rounded relative flex items-center  border hover:bg-transparent active:bg-transparent h-auto mt-5 py-2 text-[15px] font-medium cursor-pointer whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] text-lg px-3 gap-3 "
					>
						<span
							data-hidden={isPending}
							className="block payment_loader absolute  w-full data-[hidden=false]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=true]:opacity-100"
						/>

						<span
							data-hidden={isPending}
							className="data-[hidden=true]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=false]:opacity-100"
						>
							Subscribe <span>{formatSubAmount(plan.amount)}/month</span>
						</span>
					</Button>
				</div>
			</SubscribeDialogContent>
		</SubscribeDialog>
	);
};
function formatSubAmount(amount: string) {
	const intAmount = Number(amount);
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return formatter.format(intAmount);
}
