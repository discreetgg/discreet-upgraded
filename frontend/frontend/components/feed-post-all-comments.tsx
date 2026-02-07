'use client';

import { getCommentsService } from '@/lib/services';
import type { CommentType } from '@/types/global';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { PostComment } from './post-comment';
import { ComponentLoader } from './ui/component-loader';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';

interface PostCommentsProps {
  postId: string;
  viewAllComments: boolean;
  allComments: CommentType[];
  setAllComments: (comments: CommentType[]) => void;
  setReplyToComment?: (comment: CommentType | null) => void;
  replyAddedToComment?: string | null;
}

export const FeedPostAllComments = ({
  postId,
  allComments,
  setAllComments,
  viewAllComments,
  setReplyToComment,
  replyAddedToComment,
}: PostCommentsProps) => {
  const [loading, setLoading] = useState(false);

  const commentsToShow = viewAllComments
    ? allComments
    : allComments.slice(0, 3);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await getCommentsService(postId)
        .then((res) => {
          setAllComments(res.data || []);
        })
        .catch((error) => {
          console.error('Error fetching comments:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    })();
  }, [postId, setAllComments]);

  const handleCommentAdded = () => {};

  return (
    <div className='space-y-10'>
      {loading && <ComponentLoader />}

      {allComments?.length === 0 && !loading && (
        <EmptyStates>
          <React.Fragment>
            <EmptyStates.Icon icon={Icon.comment}>
              No comments yet. Be the first to comment!
            </EmptyStates.Icon>
          </React.Fragment>
        </EmptyStates>
      )}

      {commentsToShow.map((comment) => (
        <PostComment
          key={comment._id}
          comment={comment}
          postId={postId}
          onCommentAdded={handleCommentAdded}
          setReplyToComment={setReplyToComment}
          shouldShowReplies={replyAddedToComment === comment._id}
        />
      ))}

      {!viewAllComments && allComments.length > 4 && (
        <Link href={`/feed/${postId}`} className='flex justify-center'>
          <button
            type='button'
            className='text-xs text-[#FF007F] font-light hover:font-bold transition-all duration-200'
          >
            View all comments
          </button>
        </Link>
      )}
    </div>
  );
};
