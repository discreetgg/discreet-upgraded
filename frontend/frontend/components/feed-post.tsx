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
  } = usePostMenuUnlock(post, { originSurface: 'feed' });

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
  const authorClassName = 'min-w-0 gap-2.5 md:gap-3';
  const authorAvatarClassName = 'h-9 w-9 md:h-10 md:w-10 shrink-0';
  const authorTextClassName =
    'min-w-0 [&_p]:truncate [&_p]:text-[14px] md:[&_p]:text-[15px] [&_p]:font-semibold [&_p]:leading-tight [&_span]:text-[13px] [&_span]:leading-tight [&_span]:text-[#8A8C95]';
  const HEADER_DISPLAY_NAME_MAX_LENGTH = 28;
  const defaultPostAuthor = (
    <PostAuthor
      author={post?.author}
      date={post?.createdAt}
      isAuthenticated={isAuthenticated}
      maxDisplayNameLength={HEADER_DISPLAY_NAME_MAX_LENGTH}
      className={authorClassName}
      avatarClassName={authorAvatarClassName}
      usernameClassName={authorTextClassName}
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
    <div className="flex items-start justify-between gap-2.5 md:gap-3">
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
    <section className="flex md:flex-row flex-col gap-5 md:gap-8">
      <article
        className="relative w-full max-w-[680px] space-y-2 border-b border-[#1E2128] px-2 py-3 md:px-3 md:py-4"
        aria-label={`Post by ${
          post?.author?.displayName
        }: ${post?.content?.substring(0, 100)}${
          post?.content?.length > 100 ? '...' : ''
        }`}
      >
        {postHeader}
        {post?.content && (
          <p className="w-full break-words text-[15px] leading-6 text-[#E6E8EE]">
            {post?.content}
          </p>
        )}
        {hasMediaBlock && (
          <div className="overflow-hidden rounded-xl bg-[#0F1116]">
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
