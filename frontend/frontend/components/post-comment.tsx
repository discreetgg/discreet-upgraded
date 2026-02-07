'use client';

import type { CommentType } from '@/types/global';
import { useEffect, useRef, useState } from 'react';
import { PostAuthor } from './post-author';
import { PostCommentAllReplies } from './post-comment-all-replies';
import { PostCommentButton } from './post-comment-button';
import { PostLikeButton } from './post-like-button';
import { PostMedia } from './post-media';

interface PostCommentProps {
  comment: CommentType;
  postId: string;
  onCommentAdded?: () => void;
  setReplyToComment?: (comment: CommentType | null) => void;
  shouldShowReplies?: boolean;
}

export const PostComment = ({
  comment,
  postId,
  setReplyToComment,
  shouldShowReplies,
}: PostCommentProps) => {
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [allReplies, setAllReplies] = useState<CommentType[]>([]);
  const [repliesCount] = useState(comment?.repliesCount || 0);
  const repliesRef = useRef<HTMLDivElement>(null);

  // Effect to handle shouldShowReplies prop
  useEffect(() => {
    if (shouldShowReplies && !showAllReplies) {
      setShowAllReplies(true);
      // Scroll to the replies section after a short delay to allow rendering
      setTimeout(() => {
        if (repliesRef.current) {
          repliesRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }, 300);
    }
  }, [shouldShowReplies, showAllReplies]);

  return (
    <div className='space-y-3'>
      <div className=' rounded-lg space-y-2'>
        <PostAuthor
          author={comment?.author}
          date={comment?.createdAt}
          avatarClassName='size-6'
          usernameClassName='flex items-center gap-4'
        />

        <p className='text-[15px] text-[#F8F8F8] leading-relaxed'>
          {comment?.content}
        </p>

        {comment.media?.length > 0 && (
          <div className='relative w-full h-auto rounded-2xl overflow-hidden'>
            <PostMedia content={comment} media={comment.media} />
          </div>
        )}

        <div className='flex items-center justify-between'>
          <div className='flex gap-4 items-center'>
            <PostLikeButton
              targetId={comment._id}
              targetType='Comment'
              initialCount={comment?.likesCount ?? 0}
              className='scale-90'
              setShowAllLikes={setShowAllLikes}
            />

            <PostCommentButton
              setShowAddComment={(show) => {
                if (show && setReplyToComment) {
                  setReplyToComment(comment);
                }
              }}
              initialCount={repliesCount}
              setShowAllComments={setShowAllReplies}
            />
          </div>
        </div>
      </div>

      {showAllReplies && (
        <div ref={repliesRef}>
          <PostCommentAllReplies
            postId={postId}
            commentId={comment._id}
            allReplies={allReplies}
            setAllReplies={setAllReplies}
            setReplyToComment={setReplyToComment}
            replyAddedToComment={shouldShowReplies ? comment._id : null}
          />
        </div>
      )}
    </div>
  );
};
