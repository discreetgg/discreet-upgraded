'use client';
import React from 'react';
import TipAmountCard from './cards/tip-amount-card';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { serverService } from '@/lib/server-service';
import { useGlobal } from '@/context/global-context-provider';
import { useState } from 'react';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import Image from 'next/image';
import { useTipMutation } from '@/hooks/mutations/use-tip-mutation';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from './ui/form';
import { useForm } from 'react-hook-form';
import { Icon } from './ui/icons';
import { QuickAmounts } from '@/lib/data';
import TipButton from './cards/tip-button';
import { Dialog, DialogContent } from './ui/tipping-dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { useWallet } from '@/context/wallet-context-provider';
import { toastPresets } from '@/lib/toast-presets';

const FormSchema = z.object({
  tipAmount: z
    .string({ required_error: 'Tip amount is required' })
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Please enter a valid amount greater than 0',
    }),
});

export const TipDialog = ({
  children,
  open = false,
  onOpenChange,
  receiverId,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiverId: string;
}) => {
  const tipMutation = useTipMutation();
  const { user } = useGlobal();
  const { setIsFundWalletDialogOpen } = useWallet();

  const [isSelected, setIsSelected] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tipAmount: '',
    },
  });

  // Sync external open state if controlled

  const sendTip = async (amount: number) => {
    if (!user?.discordId) {
      toast.error('You must be logged in to send tips.', {
        ...toastPresets.error,
      });
      return;
    }

    setIsSelected(true);
    setSelectedAmount(amount);

    tipMutation.mutate(
      {
        tipperId: user.discordId,
        receiverId: receiverId,
        amount: amount,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          setIsSelected(false);
          setSelectedAmount(null);
        },
        onError: (error: any) => {
          console.log('FAILED TO SEND TIPP', error);
          if (
            error?.data?.message === 'Insufficient funds' ||
            error?.message === 'Insufficient funds'
          ) {
            setIsFundWalletDialogOpen(true);
          }
        },
        onSettled: () => {
          setIsSelected(false);
          setSelectedAmount(null);
        },
      }
    );
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!user?.discordId) {
      toast.error('You must be logged in to send tips.', {
        ...toastPresets.error,
      });
      return;
    }

    const tipAmount = parseFloat(data.tipAmount);

    sendTip(tipAmount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex items-center !p-3 sm:!p-[18.36px] border relative border-[#202026] bg-black rounded-[14.6px] justify-center !w-full max-w-[calc(100vw-2rem)] sm:max-w-[562px] py-4 px-3 sm:py-10 sm:px-6 mx-4 sm:mx-0 max-h-[calc(100dvh-6rem)] sm:max-h-none overflow-y-auto">
        <div className="w-full h-full absolute top-0 left-0" />{' '}
        <div className="w-full space-y-3 sm:space-y-6">
          <div className="grid grid-cols-2 items-center justify-center gap-2 sm:gap-3.5">
            {QuickAmounts.map((amount) => (
              <TipAmountCard
                key={amount.amount}
                amount={amount.amount.toString()}
                isLoading={tipMutation.isPending}
                isSelected={selectedAmount === amount.amount}
                onClick={() => sendTip(amount.amount)}
              />
            ))}
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4 sm:space-y-[27px]"
            >
              <FormField
                control={form.control}
                name="tipAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="!relative w-full mx-auto lg:w-[525px] h-[56px] sm:h-[69px] isolate">
                        <Image
                          src="/glass-input.png"
                          alt="glass input"
                          fill
                          className="-z-10 object-cover rounded-[10px]"
                        />
                        <Icon.money className="absolute -translate-y-1/2 top-1/2 left-3 sm:left-6 z-10" />
                        <Input
                          {...field}
                          placeholder="Enter tip amount"
                          className="!bg-transparent !border-0 p-3 sm:p-4 pl-10 sm:pl-[64px] pr-12 sm:pr-16 placeholder:text-[#9E9E9E] w-full h-full text-white relative rounded-[10px] flex items-center justify-center cursor-pointer hover:bg-[#0F111433]/40 transition-colors text-sm sm:text-base"
                        />

                        <TipButton
                          type="submit"
                          isLoading={tipMutation.isPending}
                          isSelected={
                            selectedAmount === parseFloat(field.value)
                          }
                          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <Button
                type="submit"
                disabled={tipMutation.isPending}
                className="rounded border hover:bg-transparent active:bg-transparent h-auto px-3 py-2 text-sm lg:px-4 lg:py-3.5 lg:text-lg  font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] lg:w-[525px]  lg:h-[69px] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full"
              >
                {tipMutation.isPending ? (
                  <>
                    <ComponentLoader />
                    Sending...
                  </>
                ) : (
                  "Send Tip"
                )}
              </Button> */}
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipDialog;
