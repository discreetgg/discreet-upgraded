'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useGlobal } from '@/context/global-context-provider';
import { createPinService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Input } from './ui/input';
import { PageLoader } from './ui/page-loader';

const FormSchema = z
  .object({
    pin: z.string({ required_error: 'Pin is required' }).min(4, {
      message: 'Pin has to be at least 4 characters long',
    }),
    confirm_pin: z.string({ required_error: 'Please confirm pin' }),
  })
  .refine((data) => data.pin === data.confirm_pin, {
    message: "Pins don't match",
    path: ['confirm_pin'],
  });

export const SettingsCreatePinDialog = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const { user, setUser } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const EyeComponent = isPasswordVisible ? Icon.eyeOff : Icon.eyeOn;

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const { pin } = data;

    try {
      setIsLoading(true);
      toast.loading('Creating pin...', {
        id: 'create-pin',
      });
      await createPinService({ discordId: user?.discordId ?? '', pin });
      toast.success('Pin created successfully!', {
        id: 'create-pin',
      });

      if (user) {
        setUser({
          ...user,
          hasAuthPin: true,
        });
      }
    } catch (error: any) {
      toast.error(`Failed to create pin: ${error.message}`, {
        id: 'create-pin',
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      form.reset();
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] absolutex right-4 -top-2">
          Create
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-[26px] !max-w-[479px] w-full"
          >
            <h1 className="text-[32px] font-semibold  text-[#F8F8F8] ">
              Create pin
            </h1>
            <p className="text-[15px] font-light">
              This pin would be use to access your account
            </p>

            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem className="relative">
                  <EyeComponent
                    onClick={() => {
                      setIsPasswordVisible((prev) => !prev);
                    }}
                    className="absolute -translate-y-1/2 top-1/2 right-4"
                  />
                  <FormControl>
                    <Input
                      type={isPasswordVisible ? 'text' : 'password'}
                      placeholder="Enter Pin"
                      className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_pin"
              render={({ field }) => (
                <FormItem className="relative">
                  <EyeComponent
                    onClick={() => {
                      setIsPasswordVisible((prev) => !prev);
                    }}
                    className="absolute -translate-y-1/2 top-1/2 right-4"
                  />
                  <FormControl>
                    <Input
                      type={isPasswordVisible ? 'text' : 'password'}
                      placeholder="Re-Enter Pin"
                      className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={!form.formState.isValid || isLoading}
              className={cn(
                'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
                'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
              )}
            >
              Create
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
