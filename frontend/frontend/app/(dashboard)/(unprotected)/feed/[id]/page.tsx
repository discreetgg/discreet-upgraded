import { getPostByIdService } from '@/lib/services';
import { redirect } from 'next/navigation';
import PostViewComponent from './post-view-component';
import { PostType } from '@/types/global';
import { Suspense } from 'react';
import LoadingState from '@/components/shared/loading-state';
import ErrorBoundaryWrapper from '@/components/shared/error-boundary-wrapper';
import { generatePostMetadata } from '@/lib/seo/metadata';
import { generateArticleStructuredData, structuredDataToScript } from '@/lib/seo/structuredData';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const response = await getPostByIdService(id);
    const post = response.data as PostType;
    return generatePostMetadata(post);
  } catch (error) {
    // Fallback metadata if post fetch fails
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

const Page = async ({ params }: Props) => {
  const { id } = await params;

  if (!id) redirect('/');

  try {
    const response = await getPostByIdService(id);
    const post = response.data as PostType;

    // Generate structured data for the post
    const articleStructuredData = generateArticleStructuredData(post);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: structuredDataToScript(articleStructuredData),
          }}
        />
        <Suspense
          fallback={
            <LoadingState
              title={`Loading Post`}
              description="This may take a few seconds"
            />
          }
        >
          <ErrorBoundaryWrapper title="Error loading Post">
            <PostViewComponent post={post} />
          </ErrorBoundaryWrapper>
        </Suspense>
      </>
    );
  } catch (error) {
    console.log('ERROR FETCHING POST:', error);
    redirect('/');
  }
};

export default Page;
