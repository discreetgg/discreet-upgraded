'use client';
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
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { verifyAgeService } from '@/lib/services';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type SdkLanguage,
  // type SdkOnSuccessResult,
  // type SdkOnCloseResult,
  type SdkLoadResult,
  SdkMode,
  type SdkOnFailureResult,
  load,
} from '@ondato-public/idv-sdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '@bprogress/next/app';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { inDevEnvironment } from '@/lib/utils';

const schema = z.object({
  age: z.coerce.number().min(18, { message: 'You are below the required age' }),
});

type SchemaType = z.infer<typeof schema>;

const Page = () => {
  const { isAuthenticated, loading } = useAuth();
  const { user, setUser } = useGlobal();
  const router = useRouter();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const [hasLaunchedSDK, setHasLaunchedSDK] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sdk, setSdk] = useState<SdkLoadResult | null>(null);

  const motionVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.isAgeVerified) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    if (!hasLaunchedSDK) {
      setHasLaunchedSDK(true);

      const sdk = load({
        mode: inDevEnvironment ? SdkMode.Sandbox : SdkMode.Production,
      });
      setSdk(sdk);
    }
  }, [hasLaunchedSDK]);

  const onSubmit = async (data: SchemaType) => {
    if (!sdk) {
      return;
    }
    if (!data.age || Number.isNaN(data.age) || data.age < 18) {
      toast.error('You must be at least 18 years old to proceed.');
      return;
    }

    setIsLoading(true);
    sdk.onAge.begin({
      onAgeSetupId: process.env.NEXT_PUBLIC_ON_AGE_SETUP_ID || '',
      language: (process.env.NEXT_PUBLIC_ON_AGE_LANGUAGE ||
        'en-GB') as SdkLanguage,
      onSuccess: async () => {
        await verifyAgeService({
          discordId: user?.discordId || '',
        })
          .then((response) => {
            toast.success(response.data.message);
            if (user) {
              setUser({ ...user, isAgeVerified: response.data.isAgeVerified });
            }
            router.push('/verify-race');
          })
          .catch(() => {
            toast.error('Age verification failed.');
          })
          .finally(() => {
            setIsLoading(false);
          });
      },
      onFailure: (props: SdkOnFailureResult) => {
        console.error('Failure', props);
        toast.error(`Verification failed: ${props.reason}`);
        setIsLoading(false);
      },
      onClose: () => {
        //props: SdkOnCloseResult
        toast.info('Verification cancelled.');
        setIsLoading(false);
      },
    });
  };
  if (loading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || user?.isAgeVerified) {
    return null;
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#050505] px-5 py-8 md:py-0">
      <div className="relative w-full">
        <div className="blur-[50px] rounded-4xl opacity-20 bg-[#FF007F] h-[391px] w-[379px] absolute -translate-y-1/2 top-[55%] -translate-x-1/2 left-1/2" />
        <div className="w-full max-w-[542px] rounded-[28px] bg-[#0A0A0B] shadow-[2px_2px_0_0_#0F1114] p-6 md:p-10 space-y-6 md:space-y-10 relative overflow-hidden mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="step2"
              {...motionVariants}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="space-y-10 w-full"
            >
              <h1 className="text-center text-2xl md:text-[32px] font-semibold text-[#D4D4D8]">
                What is your age?
              </h1>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="w-full space-y-4 md:space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative w-full">
                            <Icon.ageIcon className="absolute -translate-y-1/2 top-1/2 left-4" />
                            <Input
                              className="pl-12 py-2.5 md:py-4 h-auto text-sm md:text-base w-full"
                              type="number"
                              placeholder="Enter your age"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[#B42318]" />
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={isLoading}
                    type="submit"
                    className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-base md:text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out"
                  >
                    Continue
                  </Button>
                </form>
              </Form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default Page;
