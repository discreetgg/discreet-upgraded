import { useGlobal } from "@/context/global-context-provider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "./ui/icons";
import { ProfileHeaderDetailBannerImage } from "./profile-header-detail-banner-image";
import { ProfileHeaderDetailProfileImage } from "./profile-header-detail-profile-image";
import { buttonVariants } from "./ui/button";

export const ProfileHeaderDetailSection = ({
	className,
	showEditButton = true,
}: {
	className?: string;
	showEditButton?: boolean;
}) => {
	const { user } = useGlobal();
	const isSeller = user?.role === "seller";
	const hasBannerImage = !!user?.profileBanner?.url;
	const [copied, setCopied] = useState(false);

	const handleShareProfile = async () => {
		// Only use native share (mobile only)
		if (navigator.share) {
			const profileUrl = `${window.location.origin}/${user?.username}`;
			try {
				await navigator.share({
					title: `${user?.displayName}'s Profile`,
					text: `Check out ${user?.displayName}'s profile on Discreet`,
					url: profileUrl,
				});
			} catch (error) {
				// User cancelled share or error occurred
				console.log("Share cancelled");
			}
		}
	};

	const handleShareProfileLink = async () => {
		const profileUrl = `${window.location.origin}/${user?.username}`;

		try {
			await navigator.clipboard.writeText(profileUrl);
			setCopied(true);
			toast.success("Profile link copied");
			setTimeout(() => setCopied(false), 1500);
		} catch (error) {
			toast.error("Failed to copy profile link");
			console.error("Failed to copy profile link", error);
		}
	};

	return (
		<div className={cn("  relative", className)}>
			<ProfileHeaderDetailBannerImage />
			<div className="w-full relative -mt-1.5">
				{hasBannerImage && (
					<Image
						src={user?.profileBanner?.url ?? ""}
						alt=""
						className="size-full inset-0 absolute z-0 object-cover object-center "
						width={1000}
						height={500}
					/>
				)}
				<div className="w-full flex flex-col gap-y-5 bg-gradient-to-b from-main-bg/50 to-70% to-main-bg relative  backdrop-blur-xl">
					<ProfileHeaderDetailProfileImage />

					<div className="ml-4  ">
						<div className="flex items-center justify-between">
							<div className="flex flex-col ">
								<span className="text-lg text-[#D4D4D8] font-medium">
									{user?.displayName}
								</span>
								<span className="text-sm text-[#8A8C95] font-medium">
									@{user?.username}
								</span>
							</div>
							{showEditButton && (
								<div className="flex items-center gap-2">
									<Link
										href="/settings?tab=profile"
										className={cn(
											buttonVariants(),
											"border rounded-full bg-transparent text-[#8A8C95] hover:bg-white/10 text-sm py-2.5 px-5 font-medium"
										)}
									>
										Edit Profile
									</Link>
									<button
										onClick={handleShareProfile}
										className={cn(
											buttonVariants(),
											"border rounded-full bg-transparent md:hidden text-[#8A8C95] hover:bg-white/10 text-sm p-2.5 font-medium "
										)}
										title={copied ? "Copied!" : "Share profile"}
									>
										{copied ? (
											<Icon.tickCircle className="w-4 h-4" />
										) : (
											<Icon.share className="w-4 h-4" />
										)}
									</button>

									<button
										onClick={handleShareProfileLink}
										className={cn(
											buttonVariants(),
											"border rounded-full bg-transparent text-[#8A8C95] md:block hidden hover:bg-white/10 text-sm p-2.5 font-medium"
										)}
										title={copied ? "Copied!" : "Share profile"}
									>
										{copied ? (
											<Icon.tickCircle className="w-4 h-4" />
										) : (
											<Icon.share className="w-4 h-4" />
										)}
									</button>
								</div>
							)}
						</div>
					</div>
					<div className="divide-x space-x-3 text-xs font-inter font-light text-[#8A8C95] ml-4">
						<span className="pr-3">{user?.followerCount} Followers</span>

						<span>{user?.followingCount} Following</span>
						{/*TODO: Add subscribers from API */}
						{/* {user?.role === "seller" && <span>0 Subscribers</span>} */}
					</div>
					{isSeller && (
						<p className=" ml-4 text-xs text-[#737682] font-inter">
							{user?.bio}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};
