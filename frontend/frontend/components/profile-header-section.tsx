"use client";

import { cn } from "@/lib/utils";
import { ProfileHeaderDetailSection } from "./profile-header-detail-section";
import { SellerProfilePostsSection } from "./seller-profile-posts-section";
import { useGlobal } from "@/context/global-context-provider";
import type { UserType } from "@/types/global";

export const ProfileHeaderSection = ({
	className,
	user: serverUser,
}: {
	className?: string;
	user?: UserType | null;
}) => {
	const { user: contextUser } = useGlobal();
	// Use server-provided user if available, otherwise fall back to context
	const user = serverUser || contextUser;

	return (
		<section className={cn("w-full relative h-full ", className)}>
			<ProfileHeaderDetailSection />
			{user?.discordId && <SellerProfilePostsSection user={user} />}
		</section>
	);
};
