import { useAuth } from '@/context/auth-context-provider';
import type { CommentType, PostType } from '@/types/global';
import { useState } from 'react';
import { AuthPromptDialog } from './auth-prompt-dialog';
import { FeedPostAddComment } from './feed-post-add-comment';
import { FeedPostAllComments } from './feed-post-all-comments';
import { PostAllLikes } from './post-all-likes';
import { PostAuthor } from './post-author';
import { PostCommentButton } from './post-comment-button';
import { PostLikeButton } from './post-like-button';
import { PostMedia } from './post-media';
import { PostViewMore } from './post-view-more';
import { Icon } from './ui/icons';
import TipDialog from './tip-modal';
import BookmarkButton from './shared/bookmark-button';
import FollowButton from './shared/follow-button';
import { useGlobal } from '@/context/global-context-provider';
import { PublicPostViewMore } from './public-post-view-more';
import { usePostMenuUnlock } from '@/hooks/use-post-menu-unlock';
import { PostMenuUnlockDialog } from './post-menu-unlock-dialog';
import { Button } from './ui/button';

export const FeedPost = ({ post }: { post: PostType }) => {
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [commentCount, setCommentCount] = useState(post?.commentsCount || 0);
  const [replyToComment, setReplyToComment] = useState<CommentType | null>(
    null
  );
  const [replyAddedToComment, setReplyAddedToComment] = useState<string | null>(
    null
  );
  const [shouldFocusComment, setShouldFocusComment] = useState(false);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const { user: currentUser } = useGlobal();

  const isAuthor = post?.author?.discordId === currentUser?.discordId;
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

  // Handle when someone clicks reply on a comment
  const handleSetReplyToComment = (comment: CommentType | null) => {
    setReplyToComment(comment);
    if (comment) {
      setShouldFocusComment(true);
      // Reset focus trigger after a short delay
      setTimeout(() => {
        setShouldFocusComment(false);
      }, 500);
    }
  };

  // Handle when a reply is added to a specific comment
  const handleReplyAdded = (
    parentCommentId: string,
    _newReply: CommentType
  ) => {
    setReplyAddedToComment(parentCommentId);
    // Reset after a short delay to allow the UI to update
    setTimeout(() => {
      setReplyAddedToComment(null);
    }, 100);
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
  const hasMediaBlock = post.media?.length > 0 || Boolean(post?.linkedMenu);
  const authorDiscordId = post?.author?.discordId ?? '';
  const authorUsername = post?.author?.username ?? '';
  const postActions = isAuthenticated ? (
    isAuthor ? (
      <PostViewMore post={post} onPostDeleted={() => {}} />
    ) : (
      <PublicPostViewMore post={post} />
    )
  ) : null;
  const defaultPostAuthor = (
    <PostAuthor
      author={post?.author}
      date={post?.createdAt}
      isAuthenticated={isAuthenticated}
    />
  );
  const mediaPostAuthor = (
    <PostAuthor
      author={post?.author}
      date={post?.createdAt}
      isAuthenticated={isAuthenticated}
      className="min-w-0 gap-2 md:gap-2.5"
      avatarClassName="h-8 w-8 md:h-10 md:w-10 shrink-0 ring-1 ring-white/35 shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
      usernameClassName="min-w-0 [&_p]:truncate [&_p]:text-[13px] md:[&_p]:text-[14px] [&_p]:font-semibold [&_p]:leading-tight [&_p]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_span]:text-[11px] md:[&_span]:text-[12px] [&_span]:text-[#D8DEEA] [&_span]:leading-tight [&_span]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] [&_div]:hidden sm:[&_div]:flex [&_div]:mt-0.5 [&_div]:gap-1.5 [&_div>div]:bg-white/35"
    />
  );
  const canShowHeaderFollow = Boolean(!isAuthor && authorDiscordId && authorUsername);
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
    <section className="flex md:flex-row flex-col gap-5 md:gap-8">
      <article
        className="relative w-full max-w-[680px] space-y-4 rounded-2xl border border-[#1E2430] bg-[linear-gradient(180deg,rgba(15,17,24,0.98)_0%,rgba(10,11,18,0.98)_100%)] p-4 md:p-5 shadow-[0_14px_32px_rgba(0,0,0,0.24)]"
        aria-label={`Post by ${
          post?.author?.displayName
        }: ${post?.content?.substring(0, 100)}${
          post?.content?.length > 100 ? '...' : ''
        }`}
      >
        {hasMediaBlock ? (
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
              <p className="w-full break-words px-3 pb-3 pt-2 text-[17px] leading-7 text-[#E7ECF6]">
                {post?.content}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">{defaultPostAuthor}</div>
              {(headerFollowControl || postActions) && (
                <div className="flex shrink-0 items-center gap-2">
                  {headerFollowControl}
                  {postActions}
                </div>
              )}
            </div>
            <p className="w-full break-words text-[17px] leading-7 text-[#F8F8F8]">
              {post?.content}
            </p>
          </>
        )}
        <div className="flex items-center justify-between border-t border-[#202632] pt-3">
          <div className="flex gap-[17px] items-center">
            <PostLikeButton
              targetId={post._id}
              targetType="Post"
              initialCount={post?.likesCount}
              setShowAllLikes={setShowAllLikes}
            />
            <PostCommentButton initialCount={commentCount} />
            {isAuthenticated && post?._id && (
              <BookmarkButton
                postId={post?._id}
              />
            )}
          </div>
          <div className="flex gap-4 items-center relative">
            {post.tippingEnabled &&
              (!isAuthenticated ? (
                <AuthPromptDialog>
                  <TipDialog
                    open={tipDialogOpen}
                    onOpenChange={setTipDialogOpen}
                    receiverId={post.author.discordId}
                  >
                    <TipButton />
                  </TipDialog>
                </AuthPromptDialog>
              ) : (
                <TipDialog
                  open={tipDialogOpen}
                  onOpenChange={setTipDialogOpen}
                  receiverId={post.author.discordId}
                >
                  <TipButton />
                </TipDialog>
              ))}
            {/* <div className="w-px bg-[#8A8C95] h-[18px]" />
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-sm text-[#FF007F] font-light">
                Subscribe
              </span>
            </button> */}
          </div>
        </div>
      </article>
      <div className="max-w-[461px] max-h-max w-full rounded-[8px] border border-[#1E1E21] md:p-[19px_27px_32px_31px]  p-[8px_6px]">
        <div className="flex items-center justify-between mb-4 border-b border-[#1E1E21] pb-[23px]">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] text-[#F8F8F8] flex items-center gap-2">
              <Icon.comment />
              Comments
            </h3>
            <span className="text-[15px] text-[#8A8C95]">{commentCount}</span>
          </div>
          {/* <div className='flex items-center gap-2'>
            <Icon.close />
          </div> */}
        </div>
        <div className="pt-[23px] overflow-scroll max-h-[450px]">
          <FeedPostAllComments
            postId={post._id}
            allComments={allComments}
            setAllComments={setAllComments}
            viewAllComments
            setReplyToComment={handleSetReplyToComment}
            replyAddedToComment={replyAddedToComment}
          />
        </div>
        <div className="mt-4">
          <FeedPostAddComment
            title={replyToComment ? 'Reply to a comment' : 'Add Comment'}
            postId={post._id}
            allComments={allComments}
            setAllComments={setAllComments}
            commentCount={commentCount}
            setCommentCount={setCommentCount}
            replyToUser={replyToComment?.author}
            parentCommentId={replyToComment?._id}
            onCommentAdded={() => setReplyToComment(null)}
            onCancel={() => setReplyToComment(null)}
            onReplyAdded={handleReplyAdded}
            shouldFocus={shouldFocusComment}
          />
        </div>
      </div>
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
    </section>
  );
};

const formatPostCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
