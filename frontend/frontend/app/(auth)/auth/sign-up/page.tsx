'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Icon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getUserService, guestSignupService } from '@/lib/services';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const SignUpSchema = z
  .object({
    username: z.string().min(2, {
      message: 'Username must be at least 2 characters.',
    }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string().min(6, {
      message: 'Confirm password must be at least 6 characters.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const Page = () => {
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
  const { setIsAuthenticated } = useAuth();
  const { setUser } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<'buyer' | 'seller'>(
    searchParams.get('role') === 'seller' ? 'seller' : 'buyer'
  );

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: z.infer<typeof SignUpSchema>) {
    setIsLoading(true);

    try {
      const response = await guestSignupService({
        username: data.username,
        password: data.password,
        isSeller: accountType === 'seller',
      });

      if (!response?.data?.authenticated) {
        toast.error(response?.data?.message || 'Could not create account');
        return;
      }

      if (response?.data?.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      setIsAuthenticated(true);
      localStorage.removeItem('manual_logout');
      document.cookie = 'manual_logout=; max-age=0; path=/; samesite=lax';
      if (response?.data?.user) {
        setUser(response.data.user);
      }

      try {
        const userResponse = await getUserService();
        if (userResponse?.data) {
          setUser(userResponse.data);
        }
      } catch (error) {
        // User context hydration can be retried by global providers on app load.
        console.error('Failed to fetch user after sign up:', error);
      }

      toast.success(response?.data?.message || 'Account created successfully');

      const redirectUrl = response?.data?.redirect;
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
        return;
      }

      router.replace(redirectHref);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-[462px] mx-auto px-5 py-8 md:py-[100px] space-y-6 md:space-y-[36px]"
      >
        <Link href={`/auth${redirectQuery}`} className="flex gap-2 items-center">
          <Icon.arrowRight className="" />
          <span className="text-[#8A8C95] font-medium text-sm md:text-[15px]">
            Back
          </span>
        </Link>

        <div className="space-y-4 md:space-y-[26px]">
          <h2 className="text-[#F8F8F8] text-2xl md:text-[32px] font-semibold">
            Create account
          </h2>
          <p className="text-[#737682] text-base md:text-lg font-medium">
            Sign up with username and password without Discord OAuth.
          </p>
        </div>

        <div className="space-y-6 md:space-y-[30px]">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[#737682]">
              Account type
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#14171B] border border-[#2B2F36] p-1">
              <button
                type="button"
                onClick={() => setAccountType('buyer')}
                className={cn(
                  'h-10 rounded-lg text-sm font-medium transition-colors',
                  accountType === 'buyer'
                    ? 'bg-[#FF007F] text-white'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                )}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setAccountType('seller')}
                className={cn(
                  'h-10 rounded-lg text-sm font-medium transition-colors',
                  accountType === 'seller'
                    ? 'bg-[#FF007F] text-white'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
                )}
              >
                Seller
              </button>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Username"
                      className="py-2.5 md:py-3.5 px-4 h-auto font-medium text-sm md:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      className="py-2.5 md:py-3.5 px-4 h-auto font-medium text-sm md:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      className="py-2.5 md:py-3.5 px-4 h-auto font-medium text-sm md:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-base md:text-lg font-medium text-[#D4D4D8] hover:bg-transparent border-2 border-[#FF007F] bg-[#0A0A0B] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-sm text-center text-[#8A8C95]">
            Already have an account?{' '}
            <Link
              href={`/auth/sign-in${redirectQuery}`}
              className="text-[#FF007F] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
};

export default Page;
