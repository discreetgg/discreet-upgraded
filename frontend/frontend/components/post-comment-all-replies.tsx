'use client';

import { getRepliesService } from '@/lib/services';
import type { CommentType } from '@/types/global';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { PostComment } from './post-comment';
import { ComponentLoader } from './ui/component-loader';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';

interface PostCommentsProps {
  commentId: string;
  postId: string;
  allReplies: CommentType[];
  setAllReplies: (comments: CommentType[]) => void;
  setReplyToComment?: (comment: CommentType | null) => void;
  replyAddedToComment?: string | null;
}

export const PostCommentAllReplies = ({
  commentId,
  postId,
  allReplies,
  setAllReplies,
  setReplyToComment,
  replyAddedToComment,
}: PostCommentsProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await getRepliesService(commentId)
        .then((res) => {
          setAllReplies(res.data || []);
        })
        .catch((error) => {
          console.error('Error fetching comments:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    })();
  }, [commentId, setAllReplies]);

  const handleCommentAdded = () => {};

  return (
    <div className='space-y-10 pl-10'>
      {loading && <ComponentLoader />}

      {allReplies?.length === 0 && !loading && (
        <EmptyStates>
          <React.Fragment>
            <EmptyStates.Icon icon={Icon.comment}>
              No replies yet. Be the first to reply!
            </EmptyStates.Icon>
          </React.Fragment>
        </EmptyStates>
      )}

      {allReplies?.slice(0, 3)?.map((comment) => (
        <PostComment
          key={comment._id}
          comment={comment}
          postId={postId}
          onCommentAdded={handleCommentAdded}
          setReplyToComment={setReplyToComment}
          shouldShowReplies={replyAddedToComment === comment._id}
        />
      ))}

      {allReplies.length > 4 && (
        <Link href={`/posts/${postId}`} className='flex justify-center'>
          <button
            type='button'
            className='text-xs text-[#FF007F] font-light hover:font-bold transition-all duration-200'
          >
            View all replies
          </button>
        </Link>
      )}
    </div>
  );
};
