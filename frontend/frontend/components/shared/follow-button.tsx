import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useIsFollowing } from "@/hooks/queries/use-is-following";
import { useFollowAndUnfollowMutation } from "@/hooks/mutations/use-follow-mutation";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useGlobal } from "@/context/global-context-provider";

interface Props {
	className?: string;
	discordId: string;
	username: string;
	isMessage?: boolean;
	deferStatusFetch?: boolean;
	autoResolveOnVisible?: boolean;
}

export default function FollowButton({
	className,
	discordId,
	username,
	isMessage = false,
	deferStatusFetch = false,
	autoResolveOnVisible = false,
}: Props) {
	const [isStatusEnabled, setIsStatusEnabled] = useState(!deferStatusFetch);
	const [pendingToggle, setPendingToggle] = useState(false);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const { data: followStatus, isLoading } = useIsFollowing(
		discordId,
		isStatusEnabled
	);
	const { user } = useGlobal();
	const [isHovered, setIsHovered] = useState(false);
	const followMutation = useFollowAndUnfollowMutation({
		username,
		discordId,
	});

	const handleFollow = () => {
		if (!isStatusEnabled) {
			setIsStatusEnabled(true);
			setPendingToggle(true);
			return;
		}

		if (isLoading || !followStatus) return;

		followMutation.mutate({ isFollowing: followStatus.isFollowing });
	};

	useEffect(() => {
		if (!pendingToggle || !isStatusEnabled || isLoading || !followStatus) {
			return;
		}

		followMutation.mutate({ isFollowing: followStatus.isFollowing });
		setPendingToggle(false);
	}, [pendingToggle, isStatusEnabled, isLoading, followStatus, followMutation]);

	useEffect(() => {
		if (!deferStatusFetch || !autoResolveOnVisible || isStatusEnabled) {
			return;
		}

		const target = buttonRef.current;
		if (!target || typeof IntersectionObserver === "undefined") {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;
				setIsStatusEnabled(true);
				observer.disconnect();
			},
			{
				root: null,
				threshold: 0.85,
				rootMargin: "0px",
			}
		);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [deferStatusFetch, autoResolveOnVisible, isStatusEnabled]);

	if (isLoading && isStatusEnabled && !deferStatusFetch) {
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
			ref={buttonRef}
			variant="outline"
			size={"ghost"}
			onMouseEnter={() => {
				setIsHovered(true);
			}}
			onMouseLeave={() => setIsHovered(false)}
			data-message={isMessage}
			className={cn(
				"rounded-full text-accent-text h-6 md:h-[44px] data-[message=true]:h-8 px-2 md:px-4 md:data-[message=false]:px-6 data-[following=true]:text-black data-[following=true]:bg-white data-[message=true]:text-xs data-[message=true]:px-3 transition-all duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_0_2px_rgba(255,255,255,0.18)]",
				deferStatusFetch && isStatusEnabled && isLoading && "animate-pulse",

				className
			)}
			onClick={handleFollow}
			data-following={!followStatus?.isFollowing}
			disabled={followMutation.isPending || (pendingToggle && isLoading)}
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
