'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/auth-context-provider';
import { discordSigninService, getTrendingPostsService } from '@/lib/services';
import { PostType } from '@/types/global';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authPostSample } from '@/lib/data';
import { Post } from '@/components/post';

const Page = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<PostType[] | null>(null);
  const [trendingPostsLoading, setTrendingPostsLoading] = useState(true);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingPosts(authPostSample);
      setTrendingPostsLoading(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function onSubmit() {
    setIsLoading(true);
    try {
      await discordSigninService();
      toast.loading('Signing in with discord!');
    } catch (error: any) {
      toast.error('Login failed', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loading || isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="w-full flex  items-center justify-center">
      <div className="relative flex items-center md:flex-row flex-col gap-[65px] md:h-[644px] container mx-auto">
        <div className="md:space-y-[43px] space-y-[33px] max-w-[462px]">
          <div className="md:space-y-[26px] space-y-[20px]">
            <h2 className="md:text-[28px] text-[20px]  text-[#D4D4D8] text-center">
              Get Started with Discord
            </h2>
            <div className="w-full py-6 px-[18px] bg-[#5865F2] rounded-[16px] relative h-[189px]">
              <Icon.discord className="mx-auto mb-4 !size-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-[26px]">
              <Button
                type="submit"
                onClick={onSubmit}
                className="rounded w-full h-auto py-3.5 px-4 text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#8A8C95] shadow-[1px_2px_0_2px_#8A8C95] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out"
              >
                Sign in
              </Button>
              <Button
                type="submit"
                onClick={onSubmit}
                className="rounded w-full h-auto py-3.5 px-4 text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out"
              >
                Create account
              </Button>
            </div>
          </div>
          <footer className="text-[#B3B3B3] text-sm  text-center">
            By logging in and using{' '}
            <span className="text-[#FF007F]">Discreet</span>, you confirm that
            you’re at least 18 years old and agree to our{' '}
            <Link
              href="/terms-of-service"
              className="text-[#FF007F] hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="text-[#FF007F] hover:underline"
            >
              Privacy Policy.
            </Link>
          </footer>
        </div>
        <div className="md:rounded-[35px] rounded-[18.628px] md:p-[30px] p-[18px] border-[.5px] w-full h-full overflow-hidden relative border-[#FFFFFF4D] bg-[#0F1114]">
          <>
            <div className="rounded-full bg-[#FF007F] blur-[173px] size-[421px] absolute -bottom-1/2 left-1/2 -translate-x-1/2" />
            <Icon.logo className="absolute left-1/2 -translate-x-1/2 -bottom-1/5 w-[335.356px] h-[270.509px] text-[#FF007F]" />
          </>
          <h2 className="md:text-[23.136px] text-xs font-medium text-white after:content-[''] after:absolute after:left-0 md:after:top-1 after:top-[2px] after:bottom-0 md:after:w-[5px] after:w-[2.129px]  md:after:h-[24px] after:h-[12px] after:bg-[#FF007F] relative md:pl-4 pl-2">
            Feed
          </h2>
          <div className="max-w-[509px] mx-auto md:py-8 md:px-6 space-y-3">
            {trendingPostsLoading && (
              <Icon.logo className="text-white w-[62.473px] h-[50.392px] animate-[custom-ping_1.5s_ease-in-out_infinite] absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
            )}

            {trendingPosts?.map((post) => (
              <Post key={post._id} post={post} isPreview />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
