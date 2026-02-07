"use client";

import { useAuth } from "@/context/auth-context-provider";
import { useOptimisticLike } from "@/hooks/use-optimistic-like";
import { hasLikedService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
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
}

export const PostLikeButton = ({
	targetId,
	targetType,
	initialLiked = false,
	initialCount,
	className,
	setShowAllLikes,
}: LikeButtonProps) => {
	const [initialLikeState, setInitialLikeState] = useState({
		liked: initialLiked,
		count: initialCount,
	});

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

	// Fetch initial like status for authenticated users only once
	useEffect(() => {
		if (!isAuthenticated) {
			return;
		}

		const checkLikeStatus = async () => {
			try {
				const response = await hasLikedService(targetType, targetId);
				const liked = response.data?.liked;

				setInitialLikeState({
					liked,
					count: initialCount,
				});

				updateFromExternal(liked, initialCount);
			} catch (error) {
				console.error("Error checking like status:", error);
			}
		};

		checkLikeStatus();
	}, [targetId, targetType, isAuthenticated, initialCount, updateFromExternal]);

	const LikeButton = () => (
		<button
			type="button"
			className={cn(
				"transition-all duration-300 ease-in-out text-accent-text",
				isAnimating && "scale-125",
				isLiked && "text-red-500",
				isLoading && "cursor-wait"
			)}
			onClick={isAuthenticated ? toggleLike : undefined}
			disabled={isLoading}
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
