"use client";

import { Suspense } from "react";
import { ComponentLoader } from "@/components/ui/component-loader";
import { BuyerProfilePostsSection } from "@/components/buyer-profile-posts-section";
import { SellerProfilePostsSection } from "@/components/seller-profile-posts-section";
import { PublicProfileHeaderSection } from "@/components/public-profile-header-section";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useGlobal } from "@/context/global-context-provider";
import type { UserType } from "@/types/global";
import { useRouter } from "@bprogress/next/app";
import { PublicProfileSideMenu } from "@/components/public-profile-side-menu";

interface UserProfileViewProps {
	data: UserType;
}

export default function UserProfileView({ data }: UserProfileViewProps) {
	const { user: currentUser } = useGlobal();
	const router = useRouter();

	const isSeller = data?.role === "seller";

	const isOwnProfile = currentUser?.username === data.username;

	return (
		<div className="flex flex-col w-full gap-y-5">
			<div className="flex w-full justify-between  items-center px-2 md:px-0">
				<div className="flex items-center gap-x-2 md:gap-x-4 ">
					<Button
						onClick={() => router.back()}
						variant="ghost"
						size={"ghost"}
						className="p-0 group hover:!bg-transparent"
					>
						<Icon.arrrowLeft
							className="group-hover:-translate-x-3 duration-300 ease-in-out delay-100 size-6 md:size-4"
							strokeclassName="group-hover:stroke-white transition-colors duration-300 ease-in-out"
						/>
						<span className="font-inter text-lg text-accent-text group-hover:text-neutral-300 transition-colors duration-300 ease-in-out">
							{data.displayName}
						</span>
					</Button>
				</div>
				<GlobalSearch
					placeholder="Search"
					className="max-w-[411px] dark:bg-transparent rounded-full h-[42px]"
				/>
			</div>
			<div className="flex w-full justify-between gap-x-5">
				<div className="flex flex-col w-full max-w-[566px]x">
					<PublicProfileHeaderSection
						user={data}
						showEditButton={isOwnProfile}
						isSeller={isSeller}
					/>
					<Suspense
						fallback={
							<div className="w-full flex justify-center py-10">
								<ComponentLoader />
							</div>
						}
					>
						{isSeller ? (
							<SellerProfilePostsSection user={data} />
						) : (
							<BuyerProfilePostsSection
								currentUser={currentUser!}
								user={data}
							/>
						)}
					</Suspense>
				</div>
				{isSeller && <PublicProfileSideMenu user={data} />}
			</div>
		</div>
	);
}
