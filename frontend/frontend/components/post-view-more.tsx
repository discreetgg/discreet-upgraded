'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from './ui/icons';
import { PostType } from '@/types/global';
import { useGlobal } from '@/context/global-context-provider';
import { usePostOperations } from '@/hooks/use-post-operations';

interface Props {
  post?: PostType;
  onPostDeleted?: () => void;
}

export const PostViewMore = ({ post, onPostDeleted }: Props) => {
  const { user } = useGlobal();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { deletePost, isDeleting } = usePostOperations({
    onPostDeleted: () => {
      setShowDeleteDialog(false);
      if (onPostDeleted) {
        onPostDeleted();
      }
    },
  });

  const handleDeletePost = async () => {
    if (!user?.discordId || !post?._id) {
      return;
    }

    await deletePost(post._id, user.discordId);
  };

  if (!post) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="text-accent-text">
          <Icon.more />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
            <Icon.viewAnalytics />
            View Insights
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />
          {/* <DropdownMenuItem className='flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4'>
          <Icon.subscription />
          Add to a subscription plan
        </DropdownMenuItem> */}
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Icon.repostContent />
            Unpublish
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4">
            <Icon.archive />
            Archive
          </DropdownMenuItem>
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
