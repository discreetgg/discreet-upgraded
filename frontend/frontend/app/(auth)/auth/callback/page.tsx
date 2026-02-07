'use client';

import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getUserService } from '@/lib/services';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * OAuth Callback Handler
 * 
 * This page handles the redirect from Discord OAuth on mobile devices.
 * Mobile browsers (especially iOS Safari) have strict cookie policies that can
 * prevent authentication cookies from being set properly during OAuth redirects.
 * 
 * This handler:
 * 1. Receives the redirect from Discord OAuth
 * 2. Checks if the user is authenticated by fetching user data
 * 3. Sets the authentication state in the app
 * 4. Redirects to the original page or home
 */
const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIsAuthenticated } = useAuth();
  const { setUser } = useGlobal();
  const [error, setError] = useState<string | null>(null);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuthAndRedirect = async () => {
      try {
        // Check if there's an error from OAuth provider
        const errorParam = searchParams.get('error');
        if (errorParam) {
          const errorDescription = searchParams.get('error_description');
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || 'Authentication failed');
          toast.error('Authentication failed', {
            description: errorDescription || 'Please try again',
          });
          
          // Redirect to auth page after showing error
          setTimeout(() => {
            router.replace('/auth');
          }, 2000);
          return;
        }

        // Attempt to fetch user data to verify authentication
        // The backend should have set the authentication cookie
        const response = await getUserService();
        
        if (response?.data) {
          // Successfully authenticated
          setUser(response.data);
          setIsAuthenticated(true);
          
          toast.success('Successfully signed in!');
          
          // Try to get the original page from sessionStorage
          const originalPage = sessionStorage.getItem('discord_signin_source');
          sessionStorage.removeItem('discord_signin_source');
          
          // Redirect to original page or home
          const redirectTo = originalPage && originalPage !== '/auth' 
            ? originalPage 
            : '/';
          
          router.replace(redirectTo);
        } else {
          throw new Error('No user data received');
        }
      } catch (error: any) {
        console.error('Authentication callback error:', error);
        
        // If we can't verify authentication, there might be a cookie issue
        setError('Authentication verification failed');
        toast.error('Authentication failed', {
          description: 'Please try signing in again. If the issue persists, try clearing your browser cache.',
        });
        
        // Redirect to auth page after showing error
        setTimeout(() => {
          router.replace('/auth');
        }, 3000);
      }
    };

    checkAuthAndRedirect();
  }, [router, searchParams, setIsAuthenticated, setUser]);

  if (error) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#050505] px-5">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-semibold text-[#F8F8F8]">
            Authentication Error
          </h1>
          <p className="text-[#8A8C95]">{error}</p>
          <p className="text-sm text-[#737682]">
            Redirecting you back to the sign in page...
          </p>
        </div>
      </main>
    );
  }

  return <PageLoader />;
};

export default Page;
