import { PostsContainer } from '@/components/posts-container';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { generateHomeMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generateHomeMetadata();

export default function Home() {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsContainer />
    </HydrationBoundary>
  );
}
