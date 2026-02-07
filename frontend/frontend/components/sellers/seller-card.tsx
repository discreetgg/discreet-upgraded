"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/context/socket-context";
import { getUserDiscordAvatar } from "@/lib/utils";
import type { UserType } from "@/types/global";
import Image from "next/image";
import Link from "next/link";

interface SellerCardProps {
	creator: UserType;
}

export const SellerCard = ({ creator }: SellerCardProps) => {
	const { isUserOnline } = useSocket();
	const isOnline = isUserOnline(creator.discordId);
	const avatarSrc =
		creator.profileImage?.url ??
		getUserDiscordAvatar({
			discordId: creator.discordId,
			discordAvatar: creator.discordAvatar,
		});
	const bannerSrc = creator.profileBanner?.url || "/post-image.png";

	return (
		<Link
			href={`/${creator.username}`}
			aria-label={`View ${creator.displayName} profile`}
			className="group relative isolate block w-full overflow-hidden rounded-2xl border border-[#252A35] bg-[#101318] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#FF007F]/40 hover:shadow-[0_24px_48px_-24px_rgba(255,0,127,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/70"
		>
			<div className="relative aspect-[3/1] w-full overflow-hidden">
				<Image
					src={bannerSrc}
					alt={`${creator.displayName} banner`}
					fill
					sizes="(max-width: 768px) 100vw, 760px"
					className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/70"
				/>
			</div>

			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(180deg,rgba(16,19,24,0)_0%,rgba(16,19,24,0.72)_42%,#101318_100%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -right-12 bottom-2 size-44 rounded-full bg-[#48A8FF]/16 blur-3xl transition-opacity duration-300 group-hover:opacity-90"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -left-12 bottom-0 size-48 rounded-full bg-[#FF007F]/20 blur-3xl transition-opacity duration-300 group-hover:opacity-95"
			/>

			<div className="relative z-10 px-4 pb-4">
				<div className="relative -mt-8 flex items-end gap-3 md:-mt-9">
					<div className="relative shrink-0">
						<div className="absolute -inset-2 rounded-full bg-[#FF007F]/20 blur-2xl opacity-20 transition-opacity duration-300 group-hover:opacity-75" />
						<Avatar className="size-[96px] border-2 border-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.03] md:size-[104px]">
							<AvatarImage
								src={avatarSrc}
								alt={`${creator.displayName} profile photo`}
								className="object-cover"
							/>
							<AvatarFallback>
								<Image
									src="/user.svg"
									width={104}
									height={104}
									className="size-full rounded-full object-cover"
									alt=""
								/>
							</AvatarFallback>
						</Avatar>
					</div>
					<div className="min-w-0 pb-1">
						<p className="truncate text-[18px] font-semibold leading-[1.06] text-white">
							{creator.displayName}
						</p>
						<p className="mt-0.5 truncate text-[14px] font-medium leading-[1.06] text-[#D89CC4]">
							@{creator.username}
						</p>
					</div>
				</div>

				<div className="mt-2.5">
					<span className="inline-flex items-center gap-2">
						<span
							className={`relative size-2.5 rounded-full ${
								isOnline
									? "bg-[#32D583] shadow-[0_0_0_4px_rgba(50,213,131,0.18)]"
									: "bg-[#6B7280]"
							}`}
						>
							{isOnline && (
								<span className="absolute inset-0 rounded-full bg-[#32D583] opacity-70 animate-ping" />
							)}
						</span>
						<span className="text-[12px] text-[#A2A8B4]">
							{isOnline ? "Online" : "Offline"}
						</span>
					</span>
				</div>
			</div>
		</Link>
	);
};
