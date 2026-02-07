import { useAuth } from "@/context/auth-context-provider";
import { cn } from "@/lib/utils";
import { AuthPromptDialog } from "./auth-prompt-dialog";
import { Icon } from "./ui/icons";

interface PostCommentButtonProps {
	setShowAddComment?: (show: boolean) => void;
	initialCount: number;
	setShowAllComments?: (show: boolean) => void;
}

export const PostCommentButton = ({
	setShowAddComment,
	initialCount,
	setShowAllComments,
}: PostCommentButtonProps) => {
	const { isAuthenticated } = useAuth();

	const CommentContent = ({
		onCommentClick,
		onCountClick,
	}: {
		onCommentClick?: () => void;
		onCountClick?: () => void;
	}) => (
		<div className="flex items-center gap-2 cursor-pointer">
			<span
				onClick={onCommentClick}
				onKeyDown={onCommentClick}
				className="text-accent-text"
			>
				<Icon.comment />
			</span>
			<span
				onClick={onCountClick}
				onKeyDown={onCountClick}
				className={cn(
					"hover:underline transition-all duration-200",
					onCountClick && "hover:no-underline"
				)}
			>
				<span className="text-[15px] text-[#8A8C95]">{initialCount}</span>
			</span>
		</div>
	);

	if (!isAuthenticated) {
		return (
			<AuthPromptDialog>
				<CommentContent />
			</AuthPromptDialog>
		);
	}

	return (
		<CommentContent
			onCommentClick={() => setShowAddComment?.(true)}
			onCountClick={() => setShowAllComments?.(true)}
		/>
	);
};
