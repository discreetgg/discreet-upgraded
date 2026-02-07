import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useIsFollowing } from "@/hooks/queries/use-is-following";
import { useFollowAndUnfollowMutation } from "@/hooks/mutations/use-follow-mutation";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useGlobal } from "@/context/global-context-provider";

interface Props {
	className?: string;
	discordId: string;
	username: string;
	isMessage?: boolean;
}

export default function FollowButton({
	className,
	discordId,
	username,
	isMessage = false,
}: Props) {
	const { data: followStatus, isLoading } = useIsFollowing(discordId);
	const { user } = useGlobal();
	const [isHovered, setIsHovered] = useState(false);
	const followMutation = useFollowAndUnfollowMutation({
		username,
		discordId,
	});

	const handleFollow = () => {
		if (!followStatus) return;

		followMutation.mutate({ isFollowing: followStatus.isFollowing });
	};

	if (isLoading) {
		return <Skeleton className="h-9 w-[100px] rounded-full animate-pulse" />;
	}

	const showFollowText =
		isHovered && followStatus?.isFollowing && !followMutation.isPending;
	const showUnFollowText =
		isHovered && !followStatus?.isFollowing && !followMutation.isPending;

	if (user?.discordId === discordId) {
		return null;
	}
	return (
		<Button
			variant="outline"
			size={"ghost"}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			data-message={isMessage}
			className={cn(
				"rounded-full text-accent-text h-6 md:h-[44px] data-[message=true]:h-8 px-2 md:px-4 md:data-[message=false]:px-6 data-[following=true]:text-black data-[following=true]:bg-white data-[message=true]:text-xs data-[message=true]:px-3",

				className
			)}
			onClick={handleFollow}
			data-following={!followStatus?.isFollowing}
			disabled={followMutation.isPending || isLoading}
		>
			{showFollowText ? (
				<span>Unfollow</span>
			) : showUnFollowText ? (
				<span>Follow</span>
			) : (
				<span>{followStatus?.isFollowing ? "Following" : "Follow"}</span>
			)}
		</Button>
	);
}
