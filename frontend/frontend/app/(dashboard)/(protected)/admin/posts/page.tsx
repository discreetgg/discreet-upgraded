'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import type { PostType } from '@/types/global';
import { useAllPosts } from '@/hooks/queries/use-all-posts';
import { deleteAdminPostService } from '@/lib/services';
import { useQueryClient } from '@tanstack/react-query';
import { ComponentLoader } from '@/components/ui/component-loader';
import { PostAuthor } from '@/components/post-author';
import { PostMedia } from '@/components/post-media';

export default function ManagePostsPage() {
  const queryClient = useQueryClient();
  const { data: postsFromApi = [], isLoading } = useAllPosts();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'reported' | 'normal'>('all');

  useEffect(() => {
    setPosts(postsFromApi);
  }, [postsFromApi]);

  const filteredPosts = posts.filter((post) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (post.title ?? '').toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.author.username.toLowerCase().includes(searchLower) ||
      post.author.displayName.toLowerCase().includes(searchLower);

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'reported' && (post as PostType & { isReported?: boolean }).isReported) ||
      (filterStatus === 'normal' && !(post as PostType & { isReported?: boolean }).isReported);

    return matchesSearch && matchesFilter;
  });

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      setDeletingPostId(selectedPost._id);
      await deleteAdminPostService(selectedPost._id);
      setPosts(posts.filter((post) => post._id !== selectedPost._id));
      await queryClient.invalidateQueries({ queryKey: ['all-posts-admin'] });
      toast.success('Post has been deleted');
      setDeleteDialogOpen(false);
      setSelectedPost(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to delete post';
      toast.error(message);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDismissReports = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post._id === postId
          ? { ...post, isReported: false, reportCount: 0, reportReasons: [] } as PostType & { isReported?: boolean; reportCount?: number; reportReasons?: string[] }
          : post
      )
    );
    toast.success('Reports dismissed');
  };

  const reportedCount = 0;

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] space-y-6">
        {/* Header */}
        <div className="max-w-[1200px] w-full space-y-1">
          <div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
            <Image
              src="/logo.png"
              height={41}
              width={41}
              alt="logo"
              className="md:hidden"
            />
            <h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8]">
              Manage Posts
            </h1>
            <div className="md:hidden" />
          </div>

          <p className="text-[#8A8C95] font-light text-[15px] md:block hidden">
            Review reported content and manage posts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-[1200px]">
          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Total Posts</p>
                {isLoading ? (
                  <ComponentLoader className="h-8 w-8 mx-auto" />
                ) : (
                  <p className="text-[#F8F8F8] text-2xl font-bold">{posts.length}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Reported Posts</p>
                <p className="text-[#FF007F] text-2xl font-bold">{reportedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1114] border-[#1E1E21]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-[#8A8C95] text-xs mb-2">Total Reports</p>
                <p className="text-[#F8F8F8] text-2xl font-bold">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title, content, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] placeholder:text-[#8A8C95]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className={
                    filterStatus === 'all'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'reported' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('reported')}
                  className={
                    filterStatus === 'reported'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Reported
                </Button>
                <Button
                  variant={filterStatus === 'normal' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('normal')}
                  className={
                    filterStatus === 'normal'
                      ? 'bg-[#FF007F] text-[#0F1114]'
                      : 'bg-[#15171B] border-[#1E1E21] text-[#F8F8F8]'
                  }
                >
                  Normal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 max-w-[1200px]">
            <ComponentLoader />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 max-w-[1200px]">
            {filteredPosts.map((post) => {
              const isReported = (post as PostType & { isReported?: boolean }).isReported;
              const reportCount = (post as PostType & { reportCount?: number }).reportCount ?? 0;
              const reportReasons = (post as PostType & { reportReasons?: string[] }).reportReasons ?? [];
              return (
                <article
                  key={post._id}
                  className={`border border-[#1E1E21] bg-background shadow-[2px_2px_0_0_#1E1E21] hover:shadow-[4px_4px_0_0_#1E1E21] hover:bg-[#1E1E21]/10 transition-all duration-200 p-4 rounded-[8px] space-y-4 relative ${isReported ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  {/* Post Header - same as Post/FeedPost */}
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

                  {/* Content - same styling as Post */}
                  <p className="max-w-[489.72px] break-words line-clamp-2 w-full text-[15px] text-[#F8F8F8] whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Media - same as Post (rounded-2xl) */}
                  {post.media?.length > 0 && (
                    <div className="relative w-full h-auto rounded-2xl overflow-hidden">
                      <PostMedia content={post} media={post.media} />
                    </div>
                  )}

                  {/* Report Reasons */}
                  {isReported && reportReasons.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                      <p className="text-red-500 text-xs font-medium mb-2">
                        Report Reasons:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {reportReasons.map((reason, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-red-500 text-red-500 text-xs"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats - same vibe as Post actions row */}
                  <div className="flex items-center gap-[17px] text-[#8A8C95] text-[15px]">
                    <span className="flex items-center gap-1">
                      <Icon.heart className="w-4 h-4" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon.comment className="w-4 h-4" />
                      {post.commentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon.calendar className="w-4 h-4" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1E1E21]">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="flex-1 bg-transparent border-[#1E1E21] text-[#F8F8F8] hover:bg-[#1E1E21]/50"
                    >
                      <Link href={`/admin/posts/${post._id}`}>View Details</Link>
                    </Button>
                    {isReported && (
                      <Button
                        size="sm"
                        onClick={() => handleDismissReports(post._id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        Dismiss Reports
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedPost(post);
                        setDeleteDialogOpen(true);
                      }}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && (
          <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Icon.image className="w-12 h-12 text-[#8A8C95] mx-auto mb-4" />
                <p className="text-[#8A8C95]">No posts found</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Post Dialog */}
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
            {selectedPost && (
              <div className="rounded-lg border border-[#1E1E21] bg-[#15171B] p-3">
                <p className="text-[#F8F8F8] text-sm font-medium line-clamp-2">
                  {selectedPost.title ?? selectedPost.content.slice(0, 80)}
                  {!selectedPost.title && selectedPost.content.length > 80 ? '…' : ''}
                </p>
                <p className="text-[#8A8C95] text-xs mt-1">
                  by @{selectedPost.author.username}
                </p>
              </div>
            )}
            <DialogFooter className="flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={!!deletingPostId}
                className="order-2 bg-[#15171B] border-[#1E1E21] text-[#F8F8F8] hover:bg-[#1E1E21]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePost}
                disabled={!!deletingPostId}
                className="order-1 bg-red-500 text-white hover:bg-red-600"
              >
                {deletingPostId ? 'Deleting…' : 'Delete post'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
