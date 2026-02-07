"use client";

import { BookmarkPosts } from "./bookmark-posts";
import { useGlobal } from "@/context/global-context-provider";
import { inDevEnvironment } from "@/lib/utils";
import { useAuth } from "@/context/auth-context-provider";
import Image from "next/image";
import dynamic from "next/dynamic";

// Lazy load heavy components to improve initial page load
const TopCreators = dynamic(
	() =>
		import("@/components/top-creators").then((mod) => ({
			default: mod.TopCreators,
		})),
	{
		ssr: true,
		loading: () => (
			<div className="h-[400px] animate-pulse bg-muted rounded-lg" />
		),
	},
);

export default function BookmarkContent() {
	const { user } = useGlobal();
	const { isAuthenticated } = useAuth();

	return (
		<div className="w-full flex gap-x-5 pt-6 justify-between px-4 ">
			<div className="flex flex-col w-full max-w-[560px] xl:max-w-full ">
				<div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
					<Image
						src="/logo.png"
						height={41}
						width={41}
						alt="logo"
						className="md:hidden"
					/>
					<h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8] ">
						Bookmarks
					</h1>
					<div className="md:hidden" />
				</div>
				{user?.discordId ? (
					<BookmarkPosts discordId={user.discordId} />
				) : (
					<p>You need to be logged in</p>
				)}
			</div>
			<div className="w-full hidden md:block max-w-[376px] shrink-0 space-y-6 sticky top-7 h-max transition-[width] mt-10 duration-300 ease-linear overflow-hidden">
				<TopCreators />
				{/* {isAuthenticated && inDevEnvironment && <PartnerDiscordServers />} */}
			</div>
		</div>
	);
}
