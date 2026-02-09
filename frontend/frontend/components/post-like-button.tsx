"use client";

import { useAuth } from "@/context/auth-context-provider";
import { useOptimisticLike } from "@/hooks/use-optimistic-like";
import { hasLikedService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthPromptDialog } from "./auth-prompt-dialog";
import { Icon } from "./ui/icons";

interface LikeButtonProps {
	targetId: string;
	targetType: "Post" | "Comment";
	initialLiked?: boolean;
	initialCount: number;
	className?: string;
	setShowAllLikes: (show: boolean) => void;
	deferStatusFetch?: boolean;
	autoResolveOnVisible?: boolean;
}

export const PostLikeButton = ({
	targetId,
	targetType,
	initialLiked = false,
	initialCount,
	className,
	setShowAllLikes,
	deferStatusFetch = true,
	autoResolveOnVisible = true,
}: LikeButtonProps) => {
	const [initialLikeState, setInitialLikeState] = useState({
		liked: initialLiked,
		count: initialCount,
	});
	const [isStatusEnabled, setIsStatusEnabled] = useState(!deferStatusFetch);
	const [isResolvingInitialStatus, setIsResolvingInitialStatus] =
		useState(false);
	const [pendingToggle, setPendingToggle] = useState(false);
	const likeButtonRef = useRef<HTMLButtonElement | null>(null);
	const queryClient = useQueryClient();

	const { isAuthenticated } = useAuth();

	const {
		isLiked,
		likeCount,
		isLoading,
		isAnimating,
		toggleLike,
		updateFromExternal,
	} = useOptimisticLike({
		targetId,
		targetType,
		initialLiked: initialLikeState.liked,
		initialCount: initialLikeState.count,
		onError: (error) => {
			toast.error("Failed to update like. Please try again.");
			console.error("Like error:", error);
		},
	});

	// Fetch initial like status and cache it to avoid repeated status storms.
	useEffect(() => {
		if (!isAuthenticated || !isStatusEnabled) {
			return;
		}

		let mounted = true;
		setIsResolvingInitialStatus(true);

		queryClient
			.fetchQuery({
				queryKey: ["likes", "has-liked", targetType, targetId],
				queryFn: async ({ signal }) => {
					const response = await hasLikedService(targetType, targetId, signal);
					return Boolean(response.data?.liked);
				},
				staleTime: 5 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			})
			.then((liked) => {
				if (!mounted) return;
				setInitialLikeState({
					liked,
					count: initialCount,
				});
				updateFromExternal(liked, initialCount);
			})
			.catch((error) => {
				const code = (error as any)?.code;
				const name = (error as any)?.name;
				const message = String((error as any)?.message || "").toLowerCase();
				if (
					code === "ERR_CANCELED" ||
					name === "CanceledError" ||
					message.includes("canceled") ||
					message.includes("aborted")
				) {
					return;
				}
				console.error("Error checking like status:", error);
			})
			.finally(() => {
				if (mounted) {
					setIsResolvingInitialStatus(false);
				}
			});

		return () => {
			mounted = false;
		};
	}, [
		targetId,
		targetType,
		isAuthenticated,
		initialCount,
		updateFromExternal,
		isStatusEnabled,
		queryClient,
	]);

	useEffect(() => {
		if (!deferStatusFetch || !autoResolveOnVisible || isStatusEnabled) {
			return;
		}

		if (!isAuthenticated) {
			return;
		}

		const target = likeButtonRef.current;
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
					threshold: 0.2,
					rootMargin: "120px 0px",
				}
			);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [
		deferStatusFetch,
		autoResolveOnVisible,
		isStatusEnabled,
		isAuthenticated,
	]);

	useEffect(() => {
		if (!pendingToggle || isResolvingInitialStatus || !isStatusEnabled) {
			return;
		}

		toggleLike();
		setPendingToggle(false);
	}, [pendingToggle, isResolvingInitialStatus, isStatusEnabled, toggleLike]);

	const handleLikeClick = () => {
		if (!isStatusEnabled) {
			setIsStatusEnabled(true);
			setPendingToggle(true);
			return;
		}
		toggleLike();
	};

	const LikeButton = () => (
		<button
			ref={likeButtonRef}
			type="button"
			className={cn(
				"transition-all duration-300 ease-in-out text-accent-text",
				isAnimating && "scale-125",
				isLiked && "text-red-500",
				(isLoading || (pendingToggle && isResolvingInitialStatus)) &&
					"cursor-wait"
			)}
			onClick={isAuthenticated ? handleLikeClick : undefined}
			disabled={isLoading || (pendingToggle && isResolvingInitialStatus)}
			aria-label={isLiked ? "Unlike" : "Like"}
		>
			{isLiked ? (
				<Icon.likeFilled
					className={cn(
						"transition-all duration-200",
						isAnimating && "animate-pulse"
					)}
				/>
			) : (
				<Icon.like />
			)}
		</button>
	);

	return (
		<div>
			{!isAuthenticated ? (
				<AuthPromptDialog>
					<div
						className={cn(
							"flex items-center gap-2 cursor-pointer transition-all duration-200",
							className
						)}
					>
						<Icon.like />
						<button
							type="button"
							onClick={() => setShowAllLikes(true)}
							className="text-[15px] text-[#8A8C95] transition-colors duration-200 hover:text-[#D4D4D8]"
						>
							{likeCount}
						</button>
					</div>
				</AuthPromptDialog>
			) : (
				<div
					className={cn(
						"flex items-center gap-2 transition-all duration-200",
						className
					)}
				>
					<LikeButton />
					<button
						type="button"
						onClick={() => setShowAllLikes(true)}
						className="text-[15px] text-[#8A8C95] transition-colors duration-200 hover:text-[#D4D4D8]"
					>
						{likeCount}
					</button>
				</div>
			)}
		</div>
	);
};
