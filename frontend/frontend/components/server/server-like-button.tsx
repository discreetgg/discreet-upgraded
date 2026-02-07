"use client";

import { useAuth } from "@/context/auth-context-provider";
import { useServerOptimisticLike } from "@/hooks/server/use-server-optimistic-like";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { AuthPromptDialog } from "../auth-prompt-dialog";
import { Icon } from "../ui/icons";
import Link from "next/link";

interface LikeButtonProps {
  targetId: string;
  targetType: "Server";
  initialLiked?: boolean;
  initialCount: number;
  className?: string;
  setShowAllLikes: (show: boolean) => void;
}

export const ServerLikeButton = ({
  targetId,
  targetType,
  initialLiked = false,
  initialCount,
  className,
  setShowAllLikes,
}: LikeButtonProps) => {
  const [initialLikeState] = useState({
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
  } = useServerOptimisticLike({
    serverId: targetId,
    initialLiked: initialLikeState.liked,
    initialCount: initialLikeState.count,
    onError: (error) => {
      toast.error("Failed to update like. Please try again.");
      console.error("Like error:", error);
    },
  });

  const LikeButton = () => (
    <button
      type="button"
      className={cn(
        "transition-all duration-300 ease-in-out",
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
          width={15}
          height={14}
          className={cn(
            "transition-all duration-200",
            isAnimating && "animate-pulse"
          )}
        />
      ) : (
        <Icon.like width={15} height={14} />
      )}
    </button>
  );

  return (
    <div>
      {!isAuthenticated ? (
        <Link
          href="/auth"
          className={cn(
            "flex items-center gap-1 cursor-pointer transition-all duration-200",
            className
          )}
        >
          <Icon.like />
          <button
            type="button"
            onClick={() => setShowAllLikes(true)}
            className="text-[10.5px] text-[#8A8C95] transition-colors duration-200 hover:text-[#D4D4D8]"
          >
            {likeCount}
          </button>
        </Link>
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
