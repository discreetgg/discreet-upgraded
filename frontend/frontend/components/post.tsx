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
import FollowButton from './shared/follow-button';
import { useGlobal } from '@/context/global-context-provider';
import { PublicPostViewMore } from './public-post-view-more';
import { usePostMenuUnlock } from '@/hooks/use-post-menu-unlock';
import { PostMenuUnlockDialog } from './post-menu-unlock-dialog';
import { Button } from './ui/button';

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

  const { user: currentUser } = useGlobal();
  const { isAuthenticated } = useAuth();
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
  const unlockOriginSurface: 'feed' | 'profile' | 'unknown' =
    pathname.startsWith('/feed')
      ? 'feed'
      : SHOW_SUBSCRIBE_BUTTON
        ? 'profile'
        : 'unknown';
  const {
    unlockOverlay,
    linkedMenu,
    menuPricing,
    menuSummary,
    isConfirmOpen,
    setIsConfirmOpen,
    dialogState,
    isResolvingConversation,
    openUnlockedConversation,
    confirmUnlock,
    isUnlocking,
  } = usePostMenuUnlock(post, {
    originSurface: unlockOriginSurface,
  });
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
  const hasMediaBlock = post?.media?.length > 0 || Boolean(post?.linkedMenu);
  const authorDiscordId = post?.author?.discordId ?? '';
  const authorUsername = post?.author?.username ?? '';
  const postActions = isAuthenticated ? (
    <>
      {isAuthor ? (
        <PostViewMore post={post} onPostDeleted={() => {}} />
      ) : (
        <PublicPostViewMore post={post} />
      )}
    </>
  ) : null;
  const authorClassName = 'min-w-0 gap-2.5 md:gap-3';
  const authorAvatarClassName = 'h-9 w-9 md:h-10 md:w-10 shrink-0';
  const authorTextClassName =
    'min-w-0 [&_p]:truncate [&_p]:text-[14px] md:[&_p]:text-[15px] [&_p]:font-semibold [&_p]:leading-tight [&_span]:text-[13px] [&_span]:leading-tight [&_span]:text-[#8A8C95]';
  const HEADER_DISPLAY_NAME_MAX_LENGTH = 28;
  const defaultPostAuthor = isPreview ? (
    <PostAuthor
      isAuthenticated={isAuthenticated}
      author={post?.author}
      date={post?.createdAt}
      isPreview={isPreview}
      maxDisplayNameLength={HEADER_DISPLAY_NAME_MAX_LENGTH}
      className={authorClassName}
      avatarClassName={authorAvatarClassName}
      usernameClassName={authorTextClassName}
    />
  ) : (
    <div onClick={handlePostClick} onKeyDown={handleKeyDown} className="w-full">
      <PostAuthor
        isAuthenticated={isAuthenticated}
        author={post?.author}
        date={post?.createdAt}
        maxDisplayNameLength={HEADER_DISPLAY_NAME_MAX_LENGTH}
        className={authorClassName}
        avatarClassName={authorAvatarClassName}
        usernameClassName={authorTextClassName}
      />
    </div>
  );
  const canShowHeaderFollow = Boolean(
    !isPreview && !isAuthor && authorDiscordId && authorUsername
  );
  const headerFollowControl = canShowHeaderFollow ? (
    isAuthenticated ? (
      <FollowButton
        discordId={authorDiscordId}
        username={authorUsername}
        deferStatusFetch
        autoResolveOnVisible
        className="h-7 md:h-8 rounded-full border border-transparent bg-[#171A20] px-3 md:px-4 text-[11px] md:text-[12px] font-semibold text-[#D5D9E2] ring-1 ring-white/10 shadow-none transition-colors hover:bg-[#1D2129] data-[message=true]:h-7 md:data-[message=true]:h-8 data-[message=true]:px-3 md:data-[message=true]:px-4 data-[following=true]:border-transparent data-[following=true]:bg-[#171A20] data-[following=true]:text-[#D5D9E2] data-[following=false]:border-transparent data-[following=false]:bg-[#171A20] data-[following=false]:text-[#D5D9E2]"
      />
    ) : (
      <AuthPromptDialog>
        <Button
          type="button"
          variant="ghost"
          size="ghost"
          className="h-7 md:h-8 rounded-full border border-transparent bg-[#171A20] px-3 md:px-4 text-[11px] md:text-[12px] font-semibold text-[#D5D9E2] ring-1 ring-white/10 shadow-none hover:bg-[#1D2129]"
        >
          Follow
        </Button>
      </AuthPromptDialog>
    )
  ) : null;
  const postHeader = (
    <div className="relative flex items-start justify-between gap-2.5 md:gap-3">
      <div className="min-w-0 flex-1">{defaultPostAuthor}</div>
      {(headerFollowControl || postActions) && (
        <div className="flex shrink-0 items-center gap-2">
          {headerFollowControl}
          {postActions && (
            <div className="shrink-0 rounded-full bg-[#171A20] px-2 py-1 text-[#D5D9E2] ring-1 ring-white/10 [&_button]:p-0 [&_svg]:size-[16px] md:[&_svg]:size-[18px]">
              {postActions}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <article
      className="relative cursor-pointer space-y-2 border-b border-[#1E2128] px-2 py-3 md:px-3 md:py-4 transition-colors duration-200 hover:bg-[#14171D]/58"
      aria-label={`Post by ${
        post?.author?.displayName
      }: ${post?.content?.substring(0, 100)}${
        post?.content?.length > 100 ? '...' : ''
      }`}
    >
      {postHeader}
      {post?.content && (
        <p
          onClick={handlePostClick}
          onKeyDown={handleKeyDown}
          className="cursor-auto w-full text-[15px] leading-6 text-[#E6E8EE] whitespace-pre-line break-words overflow-wrap-anywhere"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {post?.content}
        </p>
      )}
      {hasMediaBlock && (
        <div
          onClick={handlePostClick}
          onKeyDown={handleKeyDown}
          className="overflow-hidden rounded-xl bg-[#0F1116]"
        >
          <PostMedia
            content={post}
            media={post.media || []}
            unlockOverlay={unlockOverlay}
            embeddedInPostBody
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-1.5">
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
              initialBookmarked={Boolean(isBookmarkPage)}
              skipInitialFetch={Boolean(isBookmarkPage)}
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

      {showAllLikes && (
        <PostAllLikes
          likeCount={post?.likesCount ?? 0}
          onClose={() => setShowAllLikes(false)}
        />
      )}

      {linkedMenu && menuPricing && (
        <PostMenuUnlockDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          onConfirm={confirmUnlock}
          isPending={isUnlocking}
          state={dialogState}
          isResolvingConversation={isResolvingConversation}
          onOpenMessages={openUnlockedConversation}
          menuTitle={linkedMenu.title}
          itemCount={menuSummary.totalCount}
          compositionLabel={menuSummary.compositionLabel}
          totalPriceLabel={formatPostCurrency(menuPricing.effectiveUnitPrice)}
        />
      )}
    </article>
  );
};

const formatPostCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
