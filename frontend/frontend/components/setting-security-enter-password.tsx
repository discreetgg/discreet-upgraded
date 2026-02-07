'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useSecurityDialogStepNavigation } from '@/hooks/use-step-navigation';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Input } from './ui/input';

const FormSchema = z.object({
  password: z.string({ required_error: 'Pin is required' }),
});

export const SettingSecurityEnterPassword = () => {
  const { goToStep } = useSecurityDialogStepNavigation();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const onSubmit = async () => {
    goToStep('details');
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-[51px] !max-w-[479px] w-full'
      >
        <div className='space-y-10'>
          <div className='space-y-[26px]'>
            <h1 className='text-[32px] font-semibold  text-[#F8F8F8] '>
              Enter your password
            </h1>
            <p className='text-[15px] font-light'>
              To get started, first enter your Discreet password to confirm it's
              really you.
            </p>
          </div>
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='relative'>
                <Icon.eyeOn className='absolute -translate-y-1/2 top-1/2 right-4' />
                <FormControl>
                  <Input
                    placeholder='Enter Password'
                    className='!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          disabled={!form.formState.isValid}
          className={cn(
            'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
            'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
          )}
        >
          Next
        </Button>
      </form>
    </Form>
  );
};
