'use client';

import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { createCommentService } from '@/lib/services';
import type { AuthorType, CommentType } from '@/types/global';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import { Icon } from './ui/icons';
import { Textarea } from './ui/textarea';

interface PostAddCommentProps {
  setShowAddComment?: (showAddComment: boolean) => void;
  postId: string;
  parentCommentId?: string;
  onCommentAdded?: () => void;
  allComments: CommentType[];
  setAllComments: (allComments: CommentType[]) => void;
  commentCount: number;
  setCommentCount: (count: number) => void;
  title: string;
  replyToUser?: AuthorType;
}

export const PostAddComment = ({
  setShowAddComment,
  postId,
  parentCommentId,
  onCommentAdded,
  allComments,
  setAllComments,
  setCommentCount,
  commentCount,
  title,
  replyToUser,
}: PostAddCommentProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();

  // Focus on textarea when entering reply mode
  useEffect(() => {
    if (replyToUser && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyToUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const payload = {
      authorId: user.discordId,
      postId: postId,
      content: content.trim(),
      ...(parentCommentId && { parentCommentId }),
    };

    setIsSubmitting(true);
    await createCommentService(payload)
      .then((res) => {
        toast.success('Comment posted successfully!');
        setContent('');
        setAllComments([{ ...res.data }, ...allComments]);
        onCommentAdded?.();
        setCommentCount(commentCount + 1);
        setShowAddComment?.(false);
      })
      .catch((error) => {
        console.error('Error posting comment:', error);
        toast.error('Failed to post comment. Please try again.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-[8px] bg-[#1F2227] py-6 px-4 space-y-6'
    >
      <div className='flex items-center justify-between'>
        <div className='flex gap-2 items-center'>
          <Icon.comment />
          <span className='text-[15px] text-[#D4D4D8] font-medium'>
            {replyToUser ? (
              <>
                Replying{' '}
                <span className='text-[#FF007F]'>@{replyToUser.username}</span>
              </>
            ) : (
              title
            )}
          </span>
        </div>
        <button
          type='button'
          onClick={() => setShowAddComment?.(false)}
          className='cursor-pointer'
        >
          <Icon.close />
        </button>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          parentCommentId ? 'Write a reply...' : 'Write a comment...'
        }
        className='border-none !bg-transparent shadow-none resize-none focus:!outline-none focus:!ring-0 text-[15px] text-[#F8F8F8]'
        disabled={isSubmitting}
      />
      <button
        type='submit'
        disabled={isSubmitting || !content.trim()}
        className='text-sm text-[#FF007F] font-light hover:font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isSubmitting ? (
          <ComponentLoader className='!h-4' />
        ) : parentCommentId ? (
          'Post Reply'
        ) : (
          'Post Comment'
        )}
      </button>
    </form>
  );
};
