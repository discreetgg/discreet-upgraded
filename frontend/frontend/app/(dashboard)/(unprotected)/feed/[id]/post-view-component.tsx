'use client';

import { FeedPost } from '@/components/feed-post';
import { FeedPostNotFound } from '@/components/feed-post-not-found';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import type { PostType } from '@/types/global';
import { useRouter } from '@bprogress/next/app';

const PostViewComponent = ({ post }: { post: PostType }) => {
  const router = useRouter();

  if (!post) {
    return <FeedPostNotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1027px] px-4 py-4">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-[#8A8C95] hover:text-[#F8F8F8] hover:bg-[#1E1E21] p-2"
          >
            <Icon.arrrowLeft className="w-4 h-4 mr-2" />
            Post
          </Button>
        </div>

        <div className="space-y-6">
          <FeedPost post={post} />
        </div>
      </main>
    </div>
  );
};

export default PostViewComponent;
