import { useAuth } from '@/context/auth-context-provider';
import type { CommentType, PostType } from '@/types/global';
import { useEffect, useState } from 'react';
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
import { useGlobal } from '@/context/global-context-provider';
import { PublicPostViewMore } from './public-post-view-more';

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

  return (
    <section className="flex md:flex-row flex-col gap-10">
      <article
        className="space-y-4 relative max-w-[527px] h-full w-full"
        aria-label={`Post by ${
          post?.author?.displayName
        }: ${post?.content?.substring(0, 100)}${
          post?.content?.length > 100 ? '...' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <PostAuthor
            author={post?.author}
            date={post?.createdAt}
            isAuthenticated={isAuthenticated}
          />
          {isAuthor ? <PostViewMore post={post} onPostDeleted={() => {}} /> : <PublicPostViewMore post={post} />}
        </div>
        <p className="max-w-[489.72px]  break-words text-[20px] text-[#F8F8F8]">
          {post?.content}
        </p>

        {post.media?.length > 0 && (
          <div className="relative w-full h-auto rounded-2xl overflow-hidden">
            <PostMedia content={post} media={post.media} />
          </div>
        )}
        <div className="flex items-center justify-between">
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
    </section>
  );
};
