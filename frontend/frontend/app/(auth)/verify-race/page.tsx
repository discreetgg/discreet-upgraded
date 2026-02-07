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
import { PageLoader } from '@/components/ui/page-loader';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '@bprogress/next/app';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { raceOptionsWithLabels } from '@/lib/data';
import { setCreatorRaceService } from '@/lib/services';
import { toast } from 'sonner';

const schema = z.object({
  race: z.string({ required_error: 'Race is required.' }),
});

type SchemaType = z.infer<typeof schema>;

const Page = () => {
  const { isAuthenticated, loading } = useAuth();
  const { user, setUser } = useGlobal();
  const router = useRouter();

  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
  });

  const [isLoading, setIsLoading] = useState(false);

  const motionVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  useEffect(() => {
    if (!loading && isAuthenticated && user?.race) {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  const onSubmit = async (data: SchemaType) => {
    if (!user?.discordId) {
      toast.error('User information not found');
      return;
    }

    setIsLoading(true);

    setCreatorRaceService(user.discordId, { race: data.race })
      .then((response) => {
        toast.success('Race set successfully');
        // Update user context if needed
        if (setUser && response.user) {
          setUser(response.user);
        }
        // Redirect to home or next step
        router.push('/');
      })
      .catch((error) => {
        console.error('Failed to set race:', error);
        toast.error(error.message || 'Failed to set race');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  if (loading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
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
                What race are you?
              </h1>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="w-full space-y-8 md:space-y-[126px]"
                >
                  <FormField
                    control={form.control}
                    name="race"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <div className="rounded-[8px] text-[#FF007F] !border-[#0F1114] border !bg-[#0F1114] w-full relative !p-3 md:!p-4">
                              <Icon.race className="absolute !size-4 md:!size-5" />
                              <SelectTrigger className="border-none !bg-transparent !p-0 !h-auto w-full !pl-6 text-sm md:text-base">
                                <SelectValue placeholder="Select race" asChild>
                                  <span>
                                    {raceOptionsWithLabels.find(
                                      (race) => race.value === field.value
                                    )?.label || 'Select race'}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent className="rounded shadow-[2px_2px_0_0_#1F2227] p-4 border-[#1F2227] border !bg-[#0F1114]">
                            {raceOptionsWithLabels.map((race) => (
                              <SelectItem
                                key={race.value}
                                className="py-3 md:py-4 first:pt-0 last:pb-0 last:border-none text-sm md:text-[15px] text-[#D4D4D8] hover:text-white border-b rounded-none"
                                value={race.value}
                              >
                                {race.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
