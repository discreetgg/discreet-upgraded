import { useAuth } from '@/context/auth-context-provider';
import type { CommentType, PostType } from '@/types/global';
import { useRouter } from '@bprogress/next/app';
import { useState } from 'react';
import { PostAuthor } from '../post-author';
import { PostLikeButton } from '../post-like-button';
import { Icon } from '../ui/icons';

export const Post = ({
  post,
  isPreview = false,
}: {
  post: PostType;
  isPreview?: boolean;
}) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(post?.commentsCount || 0);

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest(
      'button, a, p, [role="button"], input, textarea, select, img, [data-state="open"], [data-slot="dialog"], [data-slot="dialog-overlay"], [data-slot="dialog-content"]'
    );

    if (!isInteractiveElement && !isPreview) {
      router.push(`/feed/${post._id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigate on Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const isInteractiveElement = target.closest(
        'button, a, [role="button"], input, textarea, select'
      );

      if (!isInteractiveElement) {
        router.push(`/feed/${post._id}`);
      }
    }
  };

  const BookmarkButton = () => (
    <button type="button" className="flex items-center gap-2 cursor-pointer">
      <Icon.bookmark />
    </button>
  );

  return (
    <article
      className="border-[#1E1E21] bg-background border shadow-[2px_2px_0_0_#1E1E21] hover:shadow-[4px_4px_0_0_#1E1E21] hover:bg-[#1E1E21]/10 transition-all duration-200  p-4 rounded-[8px] space-y-4 relative cursor-pointer"
      onClick={handlePostClick}
      onKeyDown={handleKeyDown}
      aria-label={`Post by ${
        post?.author?.displayName
      }: ${post?.content?.substring(0, 100)}${
        post?.content?.length > 100 ? '...' : ''
      }`}
    >
      <div className="flex items-center justify-between relative">
        <PostAuthor author={post?.author} date={post?.createdAt} />
        {/* <PostViewMore /> */}
      </div>
      <p className="max-w-[489.72px] text-[15px] text-[#F8F8F8]">
        {post?.content}
      </p>

      {/* {post.media?.length > 0 && (
        <div className='relative w-full h-auto rounded-2xl overflow-hidden'>
          <PostMedia content={post} media={post.media} />
        </div>
      )} */}
      <div className="flex items-center justify-between">
        <div className="flex gap-[17px] items-center">
          <PostLikeButton
            targetId={post._id}
            targetType="Post"
            initialCount={post?.likesCount}
            setShowAllLikes={setShowAllLikes}
          />
          <BookmarkButton />
        </div>
      </div>
    </article>
  );
};
