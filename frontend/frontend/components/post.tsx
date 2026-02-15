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
  } = usePostMenuUnlock(post);
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
  const defaultPostAuthor = isPreview ? (
    <PostAuthor
      isAuthenticated={isAuthenticated}
      author={post?.author}
      date={post?.createdAt}
      isPreview={isPreview}
    />
  ) : (
    <div onClick={handlePostClick} onKeyDown={handleKeyDown} className="w-full">
      <PostAuthor
        isAuthenticated={isAuthenticated}
        author={post?.author}
        date={post?.createdAt}
      />
    </div>
  );
  const mediaPostAuthor = isPreview ? (
    <PostAuthor
      isAuthenticated={isAuthenticated}
      author={post?.author}
      date={post?.createdAt}
      isPreview={isPreview}
      className="min-w-0 gap-2 md:gap-2.5"
      avatarClassName="h-8 w-8 md:h-10 md:w-10 shrink-0 ring-1 ring-white/35 shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
      usernameClassName="min-w-0 [&_p]:truncate [&_p]:text-[13px] md:[&_p]:text-[14px] [&_p]:font-semibold [&_p]:leading-tight [&_p]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_span]:text-[11px] md:[&_span]:text-[12px] [&_span]:text-[#D8DEEA] [&_span]:leading-tight [&_span]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_div]:hidden sm:[&_div]:flex [&_div]:mt-0.5 [&_div]:gap-1.5 [&_div>div]:bg-white/35"
    />
  ) : (
    <div
      onClick={handlePostClick}
      onKeyDown={handleKeyDown}
      className="w-full min-w-0"
    >
      <PostAuthor
        isAuthenticated={isAuthenticated}
        author={post?.author}
        date={post?.createdAt}
        className="min-w-0 gap-2 md:gap-2.5"
        avatarClassName="h-8 w-8 md:h-10 md:w-10 shrink-0 ring-1 ring-white/35 shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
        usernameClassName="min-w-0 [&_p]:truncate [&_p]:text-[13px] md:[&_p]:text-[14px] [&_p]:font-semibold [&_p]:leading-tight [&_p]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_span]:text-[11px] md:[&_span]:text-[12px] [&_span]:text-[#D8DEEA] [&_span]:leading-tight [&_span]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_div]:hidden sm:[&_div]:flex [&_div]:mt-0.5 [&_div]:gap-1.5 [&_div>div]:bg-white/35"
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
        className="h-7 md:h-8 rounded-full border border-white/45 bg-white/95 px-3 md:px-4 text-[11px] md:text-[12px] font-semibold text-[#10151F] shadow-[0_10px_22px_rgba(0,0,0,0.42)] backdrop-blur-md hover:bg-white data-[message=true]:h-7 md:data-[message=true]:h-8 data-[message=true]:px-3 md:data-[message=true]:px-4 data-[following=true]:border-white/45 data-[following=true]:bg-white data-[following=true]:text-[#10151F] data-[following=false]:border-white/30 data-[following=false]:bg-[#0B101A]/74 data-[following=false]:text-[#E4EBF8]"
      />
    ) : (
      <AuthPromptDialog>
        <Button
          type="button"
          variant="ghost"
          size="ghost"
          className="h-7 md:h-8 rounded-full border border-white/35 bg-[#0B101A]/72 px-3 md:px-4 text-[11px] md:text-[12px] font-semibold text-[#E4EBF8] shadow-[0_10px_22px_rgba(0,0,0,0.42)] backdrop-blur-md hover:bg-[#0B101A]/80"
        >
          Follow
        </Button>
      </AuthPromptDialog>
    )
  ) : null;

  return (
    <article
      className="relative cursor-pointer space-y-4 rounded-2xl border border-[#1E2430] bg-[linear-gradient(180deg,rgba(14,16,24,0.98)_0%,rgba(8,10,16,0.98)_100%)] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.24)] transition-all duration-200 hover:border-[#2A3242]"
      aria-label={`Post by ${
        post?.author?.displayName
      }: ${post?.content?.substring(0, 100)}${
        post?.content?.length > 100 ? '...' : ''
      }`}
    >
      {hasMediaBlock ? (
        <>
          <div className="relative h-auto w-full overflow-hidden rounded-2xl border border-[#273044] bg-[linear-gradient(180deg,rgba(12,15,24,0.92)_0%,rgba(8,11,18,0.96)_100%)]">
            <div className="relative">
              <PostMedia
                content={post}
                media={post.media || []}
                unlockOverlay={unlockOverlay}
                embeddedInPostBody
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-1.5 sm:p-2 md:p-3">
                <div className="absolute inset-x-0 top-0 h-16 sm:h-20 md:h-24 bg-[linear-gradient(180deg,rgba(4,8,16,0.62)_0%,rgba(4,8,16,0)_100%)]" />
                <div className="pointer-events-auto relative flex items-start justify-between gap-1.5 sm:gap-2.5">
                  <div className="min-w-0 max-w-[50%] sm:max-w-[58%] md:max-w-[66%] pt-0.5">
                    {mediaPostAuthor}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {headerFollowControl}
                    {postActions && (
                      <div className="shrink-0 rounded-full border border-white/22 bg-[#080B13]/72 p-1.5 md:p-2 text-[#DAE1EE] shadow-[0_10px_22px_rgba(0,0,0,0.45)] backdrop-blur-md [&_button]:p-0 [&_svg]:size-[16px] md:[&_svg]:size-[18px]">
                        {postActions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {post?.content && (
              <p
                onClick={handlePostClick}
                onKeyDown={handleKeyDown}
                className="cursor-auto w-full px-3 pb-3 pt-2 text-[15px] text-[#E7ECF6] whitespace-pre-line break-words overflow-wrap-anywhere"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {post?.content}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">{defaultPostAuthor}</div>
            {(headerFollowControl || postActions) && (
              <div className="flex shrink-0 items-center gap-2">
                {headerFollowControl}
                {postActions}
              </div>
            )}
          </div>
          <div className="w-full overflow-hidden">
            <p
              onClick={handlePostClick}
              onKeyDown={handleKeyDown}
              className="cursor-auto w-full text-[15px] text-[#F8F8F8] whitespace-pre-line break-words overflow-wrap-anywhere"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
              {post?.content}
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-[#202632] pt-3">
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
