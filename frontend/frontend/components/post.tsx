import { useAuth } from '@/context/auth-context-provider';
import type { CommentType, PostType } from '@/types/global';
import { useRouter } from '@bprogress/next/app';
import { useState } from 'react';
import { AuthPromptDialog } from './auth-prompt-dialog';
import { PostAddComment } from './post-add-comment';
import { PostAllComments } from './post-all-comments';
import { PostAllLikes } from './post-all-likes';
import { PostAuthor } from './post-author';
import { PostCommentButton } from './post-comment-button';
import { PostLikeButton } from './post-like-button';
import { PostMedia } from './post-media';
import { PostViewMore } from './post-view-more';
import { Icon } from './ui/icons';
import TipDialog from './tip-modal';
import { usePathname } from 'next/navigation';
import BookmarkButton from './shared/bookmark-button';
import { useGlobal } from '@/context/global-context-provider';
import { useIsBookmarked } from '@/hooks/mutations/use-bookmark-mutation';
import { PublicPostViewMore } from './public-post-view-more';

export const Post = ({
  post,
  isBookmarkPage,
  isPreview,
}: {
  post: PostType;
  isBookmarkPage?: boolean;
  isPreview?: boolean;
}) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(post?.commentsCount || 0);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const { user: currentUser } = useGlobal();
  const { isAuthenticated } = useAuth();
  const { data: initialBookmark, isLoading: bookmarkLoading } = useIsBookmarked(
    {
      discordId: currentUser?.discordId ?? '',
      postId: post._id,
    },
  );
  const router = useRouter();
  const pathname = usePathname();

  const isAuthor = post?.author?.discordId === currentUser?.discordId;

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest(
      'button, a, p, [role="button"], input, textarea, select, img, video, [data-state="open"], [data-slot="dialog"], [data-slot="dialog-overlay"], [data-slot="dialog-content"]',
    );

    if (!isInteractiveElement) {
      router.push(`/feed/${post._id}`);
    }
  };
  const SHOW_SUBSCRIBE_BUTTON =
    pathname.startsWith('/profile') ||
    pathname.startsWith(`/${post?.author?.username}`);
  const handleSubscribe = () => {
    if (!isAuthenticated) {
      AuthPromptDialog;
      return;
    }

    router.push(`/${post.author.username}?menuTab=subscription`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigate on Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const isInteractiveElement = target.closest(
        'button, a, [role="button"], input, textarea, select',
      );

      if (!isInteractiveElement) {
        router.push(`/feed/${post._id}`);
      }
    }
  };

  const TipButton = () => (
    <button
      onClick={() => setTipDialogOpen(!tipDialogOpen)}
      type="button"
      className="flex items-center gap-2 cursor-pointer text-accent-text"
    >
      <Icon.tip />
      <span className="text-[15px] text-[#8A8C95]">send tip</span>
    </button>
  );

  if (!post) return null;

  return (
    <article
      className="border-[#1E1E21] bg-background border shadow-[2px_2px_0_0_#1E1E21] hover:shadow-[4px_4px_0_0_#1E1E21] hover:bg-[#1E1E21]/10 transition-all duration-200 delay-75  p-4 rounded-[8px] space-y-4 relative cursor-pointer"
      aria-label={`Post by ${
        post?.author?.displayName
      }: ${post?.content?.substring(0, 100)}${
        post?.content?.length > 100 ? '...' : ''
      }`}
    >
      <div className="flex items-center justify-between relative ">
        {isPreview ? (
          <PostAuthor
            isAuthenticated={isAuthenticated}
            author={post?.author}
            date={post?.createdAt}
            isPreview={isPreview}
          />
        ) : (
          <div
            onClick={handlePostClick}
            onKeyDown={handleKeyDown}
            className="w-full"
          >
            <PostAuthor
              isAuthenticated={isAuthenticated}
              author={post?.author}
              date={post?.createdAt}
            />
          </div>
        )}
        {isAuthenticated && (
          <>
            {isAuthor ? (
              <PostViewMore post={post} onPostDeleted={() => {}} />
            ) : (
              <PublicPostViewMore post={post} />
            )}
          </>
        )}
      </div>
      <div className="max-w-[489.72px] xl:max-w-[600px] w-full overflow-hidden">
        <p
          onClick={handlePostClick}
          onKeyDown={handleKeyDown}
          className={`cursor-auto w-full text-[15px] text-[#F8F8F8] whitespace-pre-line break-words overflow-wrap-anywhere ${
            !isContentExpanded ? 'line-clamp-4' : ''
          }`}
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {post?.content}
        </p>
        {post?.content &&
          (post.content.length > 280 ||
            post.content.split('\n').length > 4) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsContentExpanded(!isContentExpanded);
              }}
              className="text-[#8A8C95] text-sm mt-1 hover:text-white transition-colors"
            >
              {isContentExpanded ? 'See less' : 'See more'}
            </button>
          )}
      </div>

      {post?.media?.length > 0 && (
        <div className="relative w-full h-auto rounded-2xl overflow-hidden">
          <PostMedia content={post} media={post.media} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-[17px] items-center">
          <PostLikeButton
            targetId={post?._id}
            targetType="Post"
            initialCount={post?.likesCount}
            setShowAllLikes={setShowAllLikes}
          />
          <PostCommentButton
            setShowAddComment={setShowAddComment}
            initialCount={commentCount}
            setShowAllComments={setShowAllComments}
          />
          {isAuthenticated && post?._id && (
            <BookmarkButton
              postId={post?._id}
              isBookmarkPage={isBookmarkPage}
              initialBookmarked={bookmarkLoading ? false : initialBookmark}
            />
          )}
        </div>
        <div className="flex gap-4 items-center relative">
          {isPreview ? (
            <TipButton />
          ) : (
            post.tippingEnabled &&
            (!isAuthenticated ? (
              <AuthPromptDialog>
                <TipDialog
                  receiverId={post.author.discordId}
                  open={tipDialogOpen}
                  onOpenChange={setTipDialogOpen}
                >
                  <TipButton />
                </TipDialog>
              </AuthPromptDialog>
            ) : (
              <TipDialog
                receiverId={post.author.discordId}
                open={tipDialogOpen}
                onOpenChange={setTipDialogOpen}
              >
                <TipButton />
              </TipDialog>
            ))
          )}

          {!SHOW_SUBSCRIBE_BUTTON && (
            <div className="hidden">
              <div className="w-px bg-[#8A8C95] h-[18px]" />
              <button
                type="button"
                onClick={handleSubscribe}
                className="flex items-center gap-2 cursor-pointer hover:underline transition-all duration-200  text-sm text-[#FF007F] font-light"
              >
                Subscribe
              </button>
            </div>
          )}
        </div>
      </div>
      {showAddComment && (
        <div className="mt-4">
          <PostAddComment
            title="Add a comment"
            setShowAddComment={setShowAddComment}
            postId={post?._id}
            allComments={allComments}
            setAllComments={setAllComments}
            commentCount={commentCount}
            setCommentCount={setCommentCount}
          />
        </div>
      )}
      {/* Comments Section */}
      {showAllComments && (
        <PostAllComments
          postId={post?._id}
          allComments={allComments}
          setAllComments={setAllComments}
        />
      )}

      {/* Old Add Comment Form - keeping for backward compatibility */}

      {showAllLikes && <PostAllLikes />}
    </article>
  );
};
