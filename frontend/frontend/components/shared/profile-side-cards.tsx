"use client";

import ProfileSideAdCard from "../cards/profile-side-ad-card";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useMemo } from "react";
import EmptySkeletonCard from "../ui/empty-skeleton-card";
import { useMenuItemFilters } from "@/hooks/filters/menu-item-filters";
import { useGlobal } from "@/context/global-context-provider";
import { toast } from "sonner";
import { useRouter } from "@bprogress/next/app";

interface Props {
	menuItems: MenuItemType[];
	isLoading: boolean;
}

export default function ProfileSideAdCards({ isLoading, menuItems }: Props) {
	const { user: currentUser } = useGlobal();
	const [activeTag, setActiveTag] = useMenuItemFilters();
	const router = useRouter();

	const extractTags = useMemo(() => {
		const tags = menuItems.map((item) => item.category.category);

		return Array.from(new Set(["all", ...tags]));
	}, [menuItems]);

	const filteredAds = useMemo(() => {
		if (activeTag.hashtag === "all") return menuItems;

		return menuItems.filter(
			(item) => item.category.category.toLowerCase() === activeTag.hashtag,
		);
	}, [activeTag, menuItems]);

	if (isLoading) {
		return (
			<div className="space-y-[18px] animate-pulse">
				<EmptySkeletonCard />
				<EmptySkeletonCard />
			</div>
		);
	}
	if (!isLoading && menuItems.length === 0) {
		return (
			<div className="space-y-[18px]">
				<EmptySkeletonCard />
				<EmptySkeletonCard />
			</div>
		);
	}
	if (!currentUser) {
		toast.error("UNAUTHORIZED: You are not logged in");
		router.push("/");
		return null;
	}
	return (
		<div className="w-full flex flex-col  ">
			<ScrollArea data-horizontal-mask className="w-full">
				<div className="flex w-full  px-2 gap-x-2 pt-1 pb-3">
					{extractTags.map((tag) => (
						<Button
							key={tag}
							onClick={() => setActiveTag({ hashtag: tag.toLowerCase() })}
							data-active={activeTag.hashtag === tag}
							className="px-4 w-fit text-sm text-accent-text capitalize  py-1 rounded-2xl border-none data-[active=true]:bg-accent-gray data-[active=true]:text-off-white"
							variant={"ghost"}
							size={"ghost"}
						>
							{tag === "all" ? "All" : <span>#{tag}</span>}
						</Button>
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>

			<ScrollArea
				data-vertical-mask
				className="w-full  h-[calc(100vh-12rem)] lg:h-[calc(180px*4)] "
			>
				<div className="flex flex-col pt-4 gap-y-2 w-full pb-10 md:pb-8">
					{filteredAds.length === 0 && (
						<p className="text-sm text-accent-text/80 line-clamp-2 text-center">
							No ads found
						</p>
					)}

					{filteredAds.map((ad) => (
						<ProfileSideAdCard
							key={ad._id}
							currentUser={currentUser}
							defaultValues={ad}
							{...ad}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
