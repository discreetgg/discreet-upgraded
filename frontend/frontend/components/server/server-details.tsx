"use client";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../user-avatar";
import { useState } from "react";
import { ServerType } from "@/types/server";
import JoinServerButton from "./join-server-button";
import { Icon } from "../ui/icons";
import { ServerLikeButton } from "./server-like-button";
import { useAuth } from "@/context/auth-context-provider";
import { AuthPromptDialog } from "../auth-prompt-dialog";
import { Loader2 } from "lucide-react";
import { serverService } from "@/lib/server-service";
import { toast } from "sonner";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

export const ServerDetails = ({
  server,
  className,
  avatarClassName,
  usernameClassName,
  onEdit,
  onDelete,
}: {
  server: ServerType;
  className?: string;
  avatarClassName?: string;
  usernameClassName?: string;
  onEdit?: (server: ServerType) => void;
  onDelete?: () => void;
}) => {
  const [shouldFetchLikeState, setShouldFetchLikeState] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAuthenticated } = useAuth();
  const visibilityRef = useIntersectionObserver({
    onIntersect: () => setShouldFetchLikeState(true),
    rootMargin: "200px",
    enabled: !shouldFetchLikeState,
  });

  const handleShare = (link: string) => {
    navigator.share({
      title: server.name,
      text: server.bio,
      url: link,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await serverService.deleteServer(server.id);
      toast.success("Server deleted successfully");
      onDelete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete server");
    } finally {
      setIsDeleting(false);
    }
  };

  const ShareIcons = () => (
    <button
      type="button"
      className="flex items-center gap-2 cursor-pointer"
      onClick={() => handleShare(server.link)}
    >
      <Icon.share />
    </button>
  );
  const DeleteIcon = () => (
    <button
      type="button"
      className="flex items-center gap-2 cursor-pointer disabled:opacity-50"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon.deleteContent />
      )}
    </button>
  );
  const EditIcon = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer"
    >
      <Icon.editContent />
    </button>
  );

  return (
    <div
      ref={visibilityRef}
      className={cn(
        "border-[#1E1E21] font-inter 2xl:w-[515px] sm:w-[300px] w-full lg:w-[350px] min-h-[193px] bg-background border shadow-[2px_2px_0_0_#1E1E21] hover:shadow-[4px_4px_0_0_#1E1E21] hover:bg-[#1E1E21]/10 transition-all duration-200  p-4 rounded-[8px] gap-y-[12.9px] justify-between flex flex-col relative cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <button className={cn("flex items-center gap-4  ")}>
          <UserAvatar
            profileImage={server.creatorProfileImage}
            discordId={server.creatorId ?? ""}
            discordAvatar={server.creatorDiscordAvatar ?? ""}
            className={cn("", avatarClassName)}
          />
          <div className={cn("", usernameClassName)}>
            <p className="text-[13px] font-bold mb-2 text-start leading-[100%] hover:underline">
              {server.name}
            </p>
            <div className="flex items-start gap-1 text-[11px]">
              <>
                <span className="leading-[13.8px] flex items-center gap-0.5 text-[#8A8C95] font-light">
                  <Icon.active />
                  {server.activeMemberCount ??
                    0}{" "}
                  Active
                </span>
                <div className="rounded-full bg-[#8A8C95] w-[1px] h-full" />
              </>

              <span className="leading-[13.8px] text-[#8A8C95] font-light">
                {server.totalMemberCount ?? 0} Members
              </span>
            </div>
          </div>
        </button>
        <JoinServerButton link={server.link} />
        {/* {!isLoggedInUser && creator?.discordId ? (
          <JoinServerButton link={server.link} />
        ) : (
          <div className="flex items-center gap-2">
            <DeleteIcon />
            <EditIcon onClick={() => onEdit?.(server)} />
            <a href={server.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 text-[#8A8C95] " />
            </a>
          </div>
        )}
      </div> */}
      </div>
      <p className="text-accent-text line-clamp-3 text-[12px] leading-[14px]">
        {server.bio}
      </p>
      {server.tags.length > 0 && (
        <div className="flex items-center gap-2">
          {server.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-[#1F2227]/60 leading-[13.8px] rounded-[6.12px] text-[#8A8C95] font-light p-[6.2px] text-[9.20px]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <hr className="border-[#1E1E21] w-full" />
      <div className="flex items-center justify-between">
        {isAuthenticated ? (
          <ServerLikeButton
            targetId={server.id}
            targetType="Server"
            initialCount={server.likesCount ?? 0}
            checkLikedOnMount={shouldFetchLikeState}
            setShowAllLikes={() => {}}
          />
        ) : (
          <AuthPromptDialog>
            <ServerLikeButton
              targetId={server.id}
              targetType="Server"
              initialCount={server.likesCount ?? 0}
              checkLikedOnMount={false}
              setShowAllLikes={() => {}}
            />
          </AuthPromptDialog>
        )}
        <ShareIcons />
      </div>
    </div>
  );
};
