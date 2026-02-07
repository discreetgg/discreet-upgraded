'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { PostType } from '@/types/global';
import { getPostByIdService, deleteAdminPostService } from '@/lib/services';
import { ComponentLoader } from '@/components/ui/component-loader';
import { PostAuthor } from '@/components/post-author';
import { PostMedia } from '@/components/post-media';

export default function AdminPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Invalid post ID');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPostByIdService(id)
      .then((res) => {
        if (!cancelled && res?.data) setPost(res.data as PostType);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load post');
          toast.error('Failed to load post');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!post) return;
    try {
      setDeleting(true);
      await deleteAdminPostService(post._id);
      toast.success('Post deleted');
      setDeleteDialogOpen(false);
      router.push('/admin/posts');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to delete post';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-2">
        <main className="relative md:pt-[88px] flex items-center justify-center min-h-[400px]">
          <ComponentLoader />
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-6 px-2">
        <main className="relative md:pt-[88px] max-w-[1200px] space-y-4">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 text-[#8A8C95] hover:text-[#F8F8F8] text-sm"
          >
            <Icon.arrowLeft className="w-4 h-4" />
            Back to posts
          </Link>
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <p className="text-[#8A8C95]">{error ?? 'Post not found'}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isReported = (post as PostType & { isReported?: boolean }).isReported;
  const reportCount = (post as PostType & { reportCount?: number }).reportCount ?? 0;
  const reportReasons = (post as PostType & { reportReasons?: string[] }).reportReasons ?? [];

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] max-w-[800px] space-y-6">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 text-[#8A8C95] hover:text-[#F8F8F8] text-sm transition-colors"
        >
          <Icon.arrowLeft className="w-4 h-4" />
          Back to posts
        </Link>

        <article className="border border-[#1E1E21] bg-background shadow-[2px_2px_0_0_#1E1E21] p-4 rounded-[8px] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <PostAuthor
              author={post.author}
              date={post.createdAt}
              isAuthenticated
              isPreview
            />
            {isReported && (
              <Badge
                variant="destructive"
                className="bg-red-500/10 text-red-500 border-red-500 shrink-0"
              >
                {reportCount} Reports
              </Badge>
            )}
          </div>

          <div>
            {post.title && (
              <h1 className="text-[#F8F8F8] font-semibold text-lg mb-2">{post.title}</h1>
            )}
            <p className="max-w-[600px] break-words w-full text-[15px] text-[#F8F8F8] whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {post.media?.length > 0 && (
            <div className="relative w-full rounded-2xl overflow-hidden">
              <PostMedia content={post} media={post.media} />
            </div>
          )}

          <div className="flex items-center gap-[17px] text-[#8A8C95] text-[15px]">
            <span className="flex items-center gap-1">
              <Icon.heart className="w-4 h-4" />
              {post.likesCount} likes
            </span>
            <span className="flex items-center gap-1">
              <Icon.comment className="w-4 h-4" />
              {post.commentsCount} comments
            </span>
            <Badge variant="outline" className="border-[#8A8C95] text-[#8A8C95]">
              {post.visibility}
            </Badge>
          </div>

          {isReported && reportReasons.length > 0 && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <p className="text-red-500 font-medium mb-2">
                This post has been reported {reportCount} times
              </p>
              <div className="flex flex-wrap gap-2">
                {reportReasons.map((reason, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="border-red-500 text-red-500"
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-[#1E1E21]">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete post
            </Button>
          </div>
        </article>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#0F1114] border border-red-500/30 rounded-[14.6px] shadow-[4px_4px_0_0_rgba(239,68,68,0.2)] max-w-[420px] p-6 gap-6">
          <DialogHeader className="space-y-4 text-center sm:text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Icon.deleteContent className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-[#F8F8F8] text-lg font-semibold">
              Delete post?
            </DialogTitle>
            <DialogDescription asChild>
              <p className="text-[#8A8C95] text-sm leading-relaxed">
                This post will be permanently removed. This cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="order-2 bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] hover:bg-[#1E1E21]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="order-1 bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? 'Deleting…' : 'Delete post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
