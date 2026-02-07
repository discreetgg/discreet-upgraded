'use client';

import { Icon } from '@/components/ui/icons';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { guestSigninService, guestSignupService, getUserService } from '@/lib/services';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';

const FormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

const Page = () => {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();
  const { setUser } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    await guestSigninService({ ...data, isSeller: true })
      .then(async (res) => {
        console.log('Response from signin:', res);
        if (res?.data?.authenticated) {
          // Save auth state to localStorage
          if (res?.data?.token) {
            localStorage.setItem('auth_token', res.data.token);
          }

          // Update auth context immediately
          setIsAuthenticated(true);

          // Fetch user data and set in global context
          try {
            const response = await getUserService();
            if (response?.data) {
              setUser(response.data);
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }

          toast.success(
            res?.data?.message || 'Successfully signed in as guest!'
          );

          // Navigate to home
          router.push('/');
          return;
        }

        toast.error(res?.data?.message || 'Error signing in as guest!');

        // Auto-signup only in development mode
        if (process.env.NODE_ENV === 'development') {
          // If signin fails, try to signup with the same credentials
          await guestSignupService({ ...data, isSeller: true })
            .then((res) => {
              console.log('Response from signup:', res);
              if (res?.data?.authenticated) {
                toast.success(
                  res?.data?.message || 'Successfully signed in as guest!'
                );
                const redirectUrl =
                  res?.data?.redirect || 'https://discreet-mocha.vercel.app/';
                if (typeof window !== 'undefined')
                  window.location.href = redirectUrl;
                return;
              }

              toast.error(res?.data?.message || 'Error signing in as guest!');
            })
            .catch((signupError) => {
              toast.error(signupError.message || 'Failed to create account');
            });
        }
      })
      .catch(async (error) => {
        toast.error(error.message || 'Failed to sign in');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-[462px] mx-auto px-5 py-8 md:py-[100px] space-y-6 md:space-y-[36px]"
      >
        <Link href="/auth" className="flex gap-2 items-center">
          <Icon.arrowRight className="" />
          <span className="text-[#8A8C95] font-medium text-sm md:text-[15px] ">
            Back
          </span>
        </Link>
        <div className="space-y-4 md:space-y-[26px]">
          <h2 className="text-[#F8F8F8] text-2xl md:text-[32px] font-semibold">
            Guest Seller Sign in
          </h2>
          <p className="text-[#737682] text-base md:text-lg font-medium">
            Temporary account
          </p>
        </div>
        <div className="space-y-6 md:space-y-[30px]">
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
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-base md:text-lg font-medium text-[#D4D4D8] hover:bg-transparent border-2 border-[#1F2227] bg-[#0A0A0B] shadow-[1px_2px_0_2px_#1F2227] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default Page;
