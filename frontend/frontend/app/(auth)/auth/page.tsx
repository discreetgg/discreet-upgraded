'use client';

import { Post } from '@/components/post';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/auth-context-provider';
import { authPostSample } from '@/lib/data';
import { discordSigninService } from '@/lib/services';
import { PostType } from '@/types/global';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Page = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const redirectHref =
    redirectTarget &&
    redirectTarget.startsWith('/') &&
    !redirectTarget.startsWith('/auth')
      ? redirectTarget
      : '/';
  const redirectQuery = redirectTarget
    ? `?redirect=${encodeURIComponent(redirectTarget)}`
    : '';

  const [isLoading, setIsLoading] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<PostType[] | null>(null);
  const [trendingPostsLoading, setTrendingPostsLoading] = useState(true);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectHref);
    }
  }, [isAuthenticated, loading, router, redirectHref]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingPosts(authPostSample);
      setTrendingPostsLoading(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function onDiscordSubmit() {
    setIsLoading(true);
    try {
      await discordSigninService();
      toast.loading('Signing in with Discord...');
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
    <main className="w-full flex items-center justify-center">
      <div className="relative flex items-center md:flex-row flex-col gap-[65px] md:h-[644px] container mx-auto">
        <div className="md:space-y-[43px] space-y-[33px] max-w-[462px] w-full">
          <div className="md:space-y-[26px] space-y-[20px]">
            <div className="space-y-3 text-center">
              <h2 className="md:text-[28px] text-[20px] text-[#D4D4D8]">
                Sign in to Discreet
              </h2>
              <p className="text-[#8A8C95] text-sm md:text-base">
                Use Discord OAuth or continue with username and password.
              </p>
            </div>

            <Button
              type="button"
              onClick={onDiscordSubmit}
              className="w-full h-auto py-4 px-5 rounded-[16px] bg-[#5865F2] hover:bg-[#4956DF] text-[#F8F8F8] border-0 shadow-[0_8px_30px_rgba(88,101,242,0.35)] flex items-center justify-center gap-3 text-base md:text-lg font-semibold"
            >
              <span className="inline-flex items-center justify-center size-8 rounded-full bg-white/95">
                <Icon.discordIcon className="size-5 text-[#5865F2]" />
              </span>
              Continue with Discord
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#2A2D33]" />
              <span className="text-xs uppercase tracking-[0.2em] text-[#737682]">
                or
              </span>
              <span className="h-px flex-1 bg-[#2A2D33]" />
            </div>

            <div className="space-y-[14px]">
              <Button
                asChild
                className="rounded w-full h-auto py-3.5 px-4 text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#8A8C95] shadow-[1px_2px_0_2px_#8A8C95] hover:shadow-[4px_4px_0_2px_#8A8C95] transition-all duration-300 ease-in-out"
              >
                <Link href={`/auth/sign-in${redirectQuery}`}>
                  Sign in with username
                </Link>
              </Button>

              <Button
                asChild
                className="rounded w-full h-auto py-3.5 px-4 text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 ease-in-out"
              >
                <Link href={`/auth/sign-up${redirectQuery}`}>
                  Create account with username
                </Link>
              </Button>
            </div>
          </div>

          <footer className="text-[#B3B3B3] text-sm text-center">
            By logging in and using{' '}
            <span className="text-[#FF007F]">Discreet</span>, you confirm that
            you're at least 18 years old and agree to our{' '}
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
          <h2 className="md:text-[23.136px] text-xs font-medium text-white after:content-[''] after:absolute after:left-0 md:after:top-1 after:top-[2px] after:bottom-0 md:after:w-[5px] after:w-[2.129px] md:after:h-[24px] after:h-[12px] after:bg-[#FF007F] relative md:pl-4 pl-2">
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
