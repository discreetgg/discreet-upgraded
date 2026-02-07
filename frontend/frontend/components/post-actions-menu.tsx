"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { usePostOperations } from "@/hooks/use-post-operations";
import type { PostType } from "@/types/global";
import { useRouter } from "@bprogress/next/app";
import { useState } from "react";

interface PostActionsMenuProps {
	post: PostType;
	onPostUpdated?: (post: PostType) => void;
	onPostDeleted?: () => void;
	showEditOption?: boolean;
	showDeleteOption?: boolean;
}

export const PostActionsMenu = ({
	post,
	onPostUpdated,
	onPostDeleted,
	showEditOption = true,
	showDeleteOption = true,
}: PostActionsMenuProps) => {
	const { isAuthenticated } = useAuth();
	const { user } = useGlobal();
	const router = useRouter();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const { deletePost, isDeleting } = usePostOperations({
		onPostUpdated,
		onPostDeleted: () => {
			setShowDeleteDialog(false);
			if (onPostDeleted) {
				onPostDeleted();
			}
		},
	});

	const canModifyPost =
		isAuthenticated &&
		user &&
		(post.author.discordId === user.discordId ||
			post.author._id === user.discordId);

	if (!canModifyPost) {
		return null;
	}

	const handleDeletePost = async () => {
		if (!user?.discordId) {
			return;
		}

		await deletePost(post._id, user.discordId);
	};

	const handleEditPost = () => {
		router.push(`/feed/${post._id}/edit`);
	};

	const handleViewPost = () => {
		router.push(`/feed/${post._id}`);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 text-[#8A8C95] hover:text-[#F8F8F8] hover:bg-[#1E1E21]"
					>
						<Icon.more className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={handleViewPost} className="cursor-pointer">
						<Icon.profile className="mr-2 h-4 w-4" />
						View Post
					</DropdownMenuItem>

					{showEditOption && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleEditPost}
								className="cursor-pointer"
							>
								<Icon.settings className="mr-2 h-4 w-4" />
								Edit Post
							</DropdownMenuItem>
						</>
					)}

					{showDeleteOption && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setShowDeleteDialog(true)}
								className="cursor-pointer text-red-500 hover:text-red-400"
							>
								<Icon.close className="mr-2 h-4 w-4" />
								Delete Post
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Post</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this post? This action cannot be
							undone. All comments and media associated with this post will be
							permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeletePost}
							disabled={isDeleting}
							className="bg-red-500 hover:bg-red-600"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

// Simplified version for quick actions
interface PostQuickActionsProps {
	post: PostType;
	onPostDeleted?: () => void;
}

export const PostQuickActions = ({
	post,
	onPostDeleted,
}: PostQuickActionsProps) => {
	const { isAuthenticated } = useAuth();
	const { user } = useGlobal();
	const router = useRouter();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const { deletePost, isDeleting } = usePostOperations({
		onPostDeleted: () => {
			setShowDeleteDialog(false);
			if (onPostDeleted) {
				onPostDeleted();
			}
		},
	});

	// Check if current user can edit/delete the post
	const canModifyPost =
		isAuthenticated &&
		user &&
		(post.author.discordId === user.discordId ||
			post.author._id === user.discordId);

	if (!canModifyPost) {
		return null;
	}

	const handleDeletePost = async () => {
		if (!user?.discordId) {
			return;
		}

		await deletePost(post._id, user.discordId);
	};

	const handleEditPost = () => {
		router.push(`/feed/${post._id}/edit`);
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleEditPost}
					className="text-[#8A8C95] hover:text-[#F8F8F8] hover:bg-[#1E1E21]"
				>
					<Icon.settings className="h-4 w-4 mr-1" />
					Edit
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowDeleteDialog(true)}
					className="text-red-500 hover:text-red-400 hover:bg-[#1E1E21]"
				>
					<Icon.close className="h-4 w-4 mr-1" />
					Delete
				</Button>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Post</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this post? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeletePost}
							disabled={isDeleting}
							className="bg-red-500 hover:bg-red-600"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
