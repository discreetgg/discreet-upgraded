"use client";

import { Icon } from "@/components/ui/icons";
import type { UserType } from "@/types/global";
import Image from "next/image";
import Link from "next/link";
import { useSocket } from "@/context/socket-context";
import { useState } from "react";

interface SellerCardProps {
	creator: UserType;
}

export const SellerCard = ({ creator }: SellerCardProps) => {
	const { isUserOnline } = useSocket();
	const isOnline = isUserOnline(creator.discordId);
	const [imageError, setImageError] = useState(false);

	// Check if we should show placeholder
	const showPlaceholder = imageError || (!creator.profileImage?.url && !creator.discordAvatar);

	return (
		<Link
			href={`/${creator.username}`}
			className="rounded-[8.13px]  border-[1.016px] border-[#1E1E21] relative overflow-hidden h-[224.603px]"
		>
			<div className="z-1 absolute bottom-3 px-3 py-2.5 mt-auto w-full">
				<span className="flex items-center justify-between w-full">
					<span className="flex items-center gap-2">
						<span className="text-[15px] font-medium">
							{creator.displayName}
						</span>
						<div
							className={`size-[8px] rounded-full ${isOnline ? 'bg-[#32D583]' : 'bg-gray-500'
								}`}
						/>
					</span>
				</span>
			</div>
			<div className="">
				<div className="absolute inset-0">
					{showPlaceholder ? (
						// Placeholder with Discreet logo
						<div className="w-full h-full bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center">
							<Image
								src="/logo.png"
								alt="Discreet"
								width={100}
								height={100}
								className="opacity-40"
							/>
						</div>
					) : (
						<Image
							src={
								creator?.profileImage?.url ??
								`https://cdn.discordapp.com/avatars/${creator.discordId}/${creator.discordAvatar}.png`
							}
							height={302.035}
							width={453.272}
							className="object-cover aspect-[302.03/453.27] h-full w-full"
							alt=""
							onError={() => setImageError(true)}
						/>
					)}
					<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_5.81%,#000_58.63%)] opacity-85" />
				</div>
			</div>
		</Link>
	);
};

