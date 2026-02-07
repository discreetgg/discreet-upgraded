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
  onCancel?: () => void;
  onReplyAdded?: (parentCommentId: string, newReply: CommentType) => void;
  shouldFocus?: boolean;
}

export const FeedPostAddComment = ({
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
  onCancel,
  onReplyAdded,
  shouldFocus,
}: PostAddCommentProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();

  // Focus on textarea when entering reply mode or when shouldFocus changes
  useEffect(() => {
    if ((replyToUser || shouldFocus) && textareaRef.current) {
      // Scroll the form into view first
      if (formRef.current) {
        formRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      // Then focus the textarea after a short delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [replyToUser, shouldFocus]);

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

        // If this is a reply, notify the parent
        if (parentCommentId && onReplyAdded) {
          onReplyAdded(parentCommentId, res.data);
        }
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
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-[8px] bg-[#1F2227] md:py-6 md:px-4 px-2 py-1 md:space-y-6 space-y-3"
    >
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Icon.comment />
          <span className="text-[15px] text-[#D4D4D8] font-medium">
            {replyToUser ? (
              <>
                Replying{' '}
                <span className="text-[#FF007F]">@{replyToUser.username}</span>
              </>
            ) : (
              title
            )}
          </span>
          {replyToUser && (
            <button
              type="button"
              onClick={() => {
                onCancel?.();
                setContent('');
              }}
              className="ml-2 text-sm text-[#8A8C95] hover:text-[#FF007F] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="text-sm text-[#FF007F] font-light hover:font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed md:hidden"
        >
          {isSubmitting ? (
            <ComponentLoader className="!h-4" />
          ) : parentCommentId ? (
            'Post Reply'
          ) : (
            'Post Comment'
          )}
        </button>
      </div>

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          parentCommentId ? 'Write a reply...' : 'Write a comment...'
        }
        className="border-none px-0 !bg-transparent shadow-none resize-none focus:!outline-none focus:!ring-0 text-[15px] text-[#F8F8F8]"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="text-sm text-[#FF007F] font-light hover:font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed md:block hidden"
      >
        {isSubmitting ? (
          <ComponentLoader className="!h-4" />
        ) : parentCommentId ? (
          'Post Reply'
        ) : (
          'Post Comment'
        )}
      </button>
    </form>
  );
};
