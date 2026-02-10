"use client";

import { cn } from "@/lib/utils";
import type { UserType } from "@/types/global";
import Image from "next/image";
import Link from "next/link";
import { PublicProfileBannerImage } from "./public-profile-banner-image";
import { PublicProfileProfileImage } from "./public-profile-profile-image";
import { buttonVariants } from "./ui/button";
import FollowButton from "./shared/follow-button";
import TipDialog from "./tip-modal";
import { useState, type TouchEvent } from "react";
import { Icon } from "./ui/icons";
import { useRouter } from "next/navigation";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet";
import { ProfileSideMenuMenuContent } from "./profile-side-menu-menu-content";
import { useMessage } from "@/context/message-context";
import { useGlobal } from "@/context/global-context-provider";
import { getConversationBetweenUsersService } from "@/lib/services";

interface Props {
	user: UserType;
	className?: string;
	bodyClassName?: string;
	showEditButton?: boolean;
	isSeller?: boolean;
	isMessage?: boolean;
}

export const PublicProfileHeaderSection = ({
	className,
	bodyClassName,
	showEditButton = true,
	user,
	isSeller = false,
	isMessage = false,
}: Props) => {
	const [tipDialogOpen, setTipDialogOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isOpeningMessage, setIsOpeningMessage] = useState(false);
	const [sheetTouchStartX, setSheetTouchStartX] = useState<number | null>(null);
	const router = useRouter();
	const { setReceiver, conversations } = useMessage();
	const { user: currentUser } = useGlobal();

	const hasBannerImage = !!user?.profileBanner?.url;
	const handleOpenMessage = async () => {
		if (isOpeningMessage) return;
		setIsOpeningMessage(true);

		setReceiver(user);
		const existingConversation = conversations?.find((conversation) =>
			conversation.participants.some(
				(participant) => participant.discordId === user.discordId
			)
		);

		if (existingConversation?._id) {
			router.push(`/messages/${existingConversation._id}`);
			setIsOpeningMessage(false);
			return;
		}

		try {
			if (currentUser?.discordId) {
				const conversation = await getConversationBetweenUsersService([
					currentUser.discordId,
					user.discordId,
				]);
				const conversationId =
					(conversation as { _id?: string })?._id ||
					(conversation as { id?: string })?.id ||
					(conversation as { conversationId?: string })?.conversationId ||
					(conversation as { conversation?: { _id?: string; id?: string } })
						?.conversation?._id ||
					(conversation as { conversation?: { _id?: string; id?: string } })
						?.conversation?.id;

				if (conversationId) {
					router.push(`/messages/${conversationId}`);
					return;
				}
			}
		} catch (error) {
			console.error("Failed to resolve conversation", error);
		}

		router.push("/messages?chat=new");
		setIsOpeningMessage(false);
	};

	const handleSheetTouchStart = (event: TouchEvent<HTMLDivElement>) => {
		setSheetTouchStartX(event.touches[0]?.clientX ?? null);
	};

	const handleSheetTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
		if (sheetTouchStartX === null) {
			return;
		}

		const touchEndX = event.changedTouches[0]?.clientX ?? sheetTouchStartX;
		const deltaX = touchEndX - sheetTouchStartX;
		setSheetTouchStartX(null);

		// Right-swipe to close on mobile.
		if (deltaX > 70) {
			setMobileMenuOpen(false);
		}
	};

	return (
		<div className={cn("  relative", className)}>
			<PublicProfileBannerImage user={user} />
			<PublicProfileProfileImage user={user} />
			<div className="w-full relative -mt-12">
				{hasBannerImage && (
					<Image
						src={user?.profileBanner?.url ?? ""}
						alt=""
						className="size-full inset-0 absolute z-0 object-cover object-center "
						width={1000}
						height={500}
					/>
				)}
				<div
					className={cn(
						"w-full flex flex-col gap-y-5 bg-gradient-to-b from-main-bg/50 via-main-bg to-main-bg relative  backdrop-blur-xl pt-13",
						bodyClassName
					)}
				>
					<div className="mx-4  ">
						<div className="flex items-center justify-between">
							<div className="flex flex-col ">
								<span className="text-lg text-[#D4D4D8] font-medium">
									{user?.displayName}
								</span>
								<span className="text-xs md:text-sm text-[#8A8C95] font-medium">
									@{user?.username}
								</span>
							</div>
							<div className="flex items-center gap-x-2">
								{/* Mobile Menu Button - Only visible on smaller screens */}
								<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
									<SheetTrigger asChild>
										<button
											className="lg:hidden bg-accent-color  px-2 md:px-4 font-medium text-white md:text-gray-100 text-xs h-6 md:h-[44px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
											aria-label="Open menu"
										>
											My Menu
										</button>
									</SheetTrigger>
									<SheetContent
										side="right"
										onTouchStart={handleSheetTouchStart}
										onTouchEnd={handleSheetTouchEnd}
										className="bg-dark-charcoal/90 backdrop-blur-2xl border-charcoal w-full max-w-[380px] px-4 pt-4 outline-none"
									>
										<SheetHeader className="p-0 flex-row items-center justify-between border-b border-charcoal pb-3">
											<SheetTitle className="text-left uppercase text-[#D4D4D8]">
												Profile Menu
											</SheetTitle>
											<SheetClose asChild>
												<button
													type="button"
													className="inline-flex items-center gap-1 text-xs text-[#8A8C95] hover:text-[#D4D4D8] transition-colors"
													aria-label="Close profile menu"
												>
													<Icon.left className="size-3.5 rotate-180" />
													Close
												</button>
											</SheetClose>
										</SheetHeader>
										<div className="mt-4">
											<ProfileSideMenuMenuContent user={user} />
										</div>
									</SheetContent>
								</Sheet>
								{showEditButton ? (
									<Link
										href="/settings?tab=profile"
										className={cn(
											buttonVariants(),
											"border rounded-full h-6 md:h-[44px] bg-transparent text-[#8A8C95] hover:bg-white/10 text-sm py-2.5 px-5 font-medium"
										)}
									>
										Edit Profile
									</Link>
								) : (
									<>
										{isSeller && (
											<TipDialog
												receiverId={user.discordId}
												open={tipDialogOpen}
												onOpenChange={setTipDialogOpen}
											>
												<button
													data-message={isMessage}
													className="bg-white/5 size-7 md:size-[44px] data-[message=true]:size-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
												>
													<Icon.tip
														data-message={isMessage}
														className="data-[message=true]:size-4  size-4 md:size-6 text-[#8A8C95] hover:text-white"
													/>
												</button>
											</TipDialog>
										)}

										<button
											type="button"
											onClick={handleOpenMessage}
											disabled={isOpeningMessage}
											data-message={isMessage}
											className="bg-white/5 size-7 md:size-[44px] disabled:opacity-60 disabled:cursor-not-allowed data-[message=true]:hidden rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
										>
											<Icon.messages className="md:size-6 size-4 text-[#8A8C95] hover:text-white" />
										</button>
										<FollowButton
											username={user?.username}
											discordId={user?.discordId}
											isMessage={isMessage}
										/>
									</>
								)}
							</div>
						</div>
					</div>
					<div className="divide-x space-x-3 text-xs font-inter font-light text-[#8A8C95] ml-4">
						<span className="pr-3">{user.followerCount} Followers</span>
						{user?.role === "seller" && (
							<span>{user.followingCount} Following</span>
						)}
					</div>
					{isSeller && (
						<p className=" ml-4 text-sm text-[#737682] font-inter">
							{user.bio}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};
