import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Icon } from './ui/icons';
import { Input } from './ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { tipService } from '@/lib/services';
import { useGlobal } from '@/context/global-context-provider';
import { useChat } from '@/hooks/use-chat';
import { QuickAmounts } from '@/lib/data';
import TipAmountCard from './cards/tip-amount-card';
import Image from 'next/image';
import TipButton from './cards/tip-button';

const formSchema = z.object({
  amount: z
    .string({ required_error: 'Please provide an amount' })
    .refine(
      (val) =>
        !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0,
      {
        message: 'Please enter a valid amount greater than 0',
      }
    ),
});

interface MessageSendTipProps {
  receiverId: string;
  onClose?: () => void;
  sendTipMessage?: (amount: number, receiverId: string) => Promise<void>;
}

export const MessageSendTip = ({
  receiverId,
  onClose,
  sendTipMessage: sendTipMessageProp,
}: MessageSendTipProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useGlobal();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // Use chat hook to get sendTipMessage function if not provided as prop
  const { sendTipMessage: sendTipMessageFromHook } = useChat(user, receiverId);
  
  // Use prop if provided, otherwise use from hook
  const sendTipMessage = sendTipMessageProp || sendTipMessageFromHook;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const sendTip = async (amount: number) => {
    if (!user?.discordId) {
      toast.error('You must be logged in to send tips.');
      return;
    }

    setIsLoading(true);
    setSelectedAmount(amount);
    tipService({
      tipperId: user?.discordId,
      receiverId,
      amount,
    })
      .then(async () => {
        toast.success(`Successfully sent $${amount.toFixed(2)} tip!`);
        
        // Emit tip message to conversation
        console.log('🔵 Calling sendTipMessage from component:', { amount, receiverId });
        try {
          await sendTipMessage(amount, receiverId);
          console.log('✅ sendTipMessage completed');
        } catch (error) {
          console.error('❌ Error calling sendTipMessage:', error);
        }
        
        form.reset();
        setSelectedAmount(null);
        if (onClose) {
          onClose();
        }
      })
      .catch((error: any) => {
        const errorMessage =
          error?.message || 'Failed to send tip. Please try again.';
        toast.error(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!user?.discordId) {
      toast.error('You must be logged in to send tips.');
      return;
    }

    const amount = Number.parseFloat(data.amount);

    sendTip(amount);
  };

  return (
    <div className="mb-3 animate-slide-up">
      <Form {...form}>
        <form
          className="rounded-[14.41px] p-2.5 bg-[#15171B] border border-[#73819712] w-max space-y-3 relative"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid grid-cols-2 gap-2">
            {QuickAmounts.map((amount) => (
              <TipAmountCard
                key={amount.amount}
                amount={amount.amount.toString()}
                isLoading={isLoading}
                isSelected={selectedAmount === amount.amount}
                onClick={() => sendTip(amount.amount)}
                className="w-[139px] h-[99.4px] [&>span]:text-[31.049px] [&>button]:!size-[23px]"
                iconClassName="!size-[12px]"
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="relative isolate">
                <Image
                  src="/glass-input.png"
                  alt="glass input"
                  fill
                  className="-z-10"
                />
                <Icon.moneySendOutline className="absolute -translate-y-1/2 top-1/2 left-3 size-[14.519px]" />
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    placeholder="amount"
                    className="!bg-[#15171B] border-[#0F1114] h-auto p-[9.68px] pl-8 placeholder:text-[#9E9E9E] rounded-[8px] !text-[9.68px]"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      const formatted = raw
                        ? new Intl.NumberFormat('en-US').format(Number(raw))
                        : '';
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>

                <TipButton
                  type="submit"
                  isLoading={isLoading}
                  isSelected={selectedAmount === Number.parseFloat(field.value)}
                  className="absolute -translate-y-1/2 top-1/2 right-3 size-[14.519px]"
                  iconClassName="!size-[8px]"
                />

                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
