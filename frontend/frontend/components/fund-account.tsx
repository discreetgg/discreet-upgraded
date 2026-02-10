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
import { cards } from '@/lib/data';
import React from 'react';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { NumericFormat } from 'react-number-format';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { fundWalletService } from '@/lib/services';
import { useWallet } from '@/context/wallet-context-provider';
import { toast } from 'sonner';
import { toastPresets } from '@/lib/toast-presets';

const formSchema = z.object({
  amount: z.string({
    required_error: 'Please enter an amount to fund your account.',
  }),
  source: z.string({
    required_error: 'Please select a funding source.',
  }),
});

export const FundAccount = () => {
  const { setWallet, setLoading, setStep } = useWallet();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const parsedAmount = Number.parseFloat(data.amount);
    const normalizedAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    setStep('loading');
    setLoading(true);
    await fundWalletService({ amount: data.amount })
      .then(() => {
        if (setWallet) {
          setWallet((previousWallet) => {
            if (!previousWallet) {
              return previousWallet;
            }

            return {
              ...previousWallet,
              balance: previousWallet.balance + normalizedAmount,
            };
          });
        }

        setStep('message');
        toast.success('Funds added to wallet', {
          ...toastPresets.revenue,
          description: `+$${normalizedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        });
      })
      .catch((e) => {
        console.error('Fund wallet error:', e);
        
        // Handle Anchor/Solana IDL errors
        const errorMessage = e?.message || e?.response?.data?.message || '';
        const errorString = JSON.stringify(e).toLowerCase();
        
        if (
          errorMessage.includes('Account size calculation failed') ||
          errorMessage.includes('Cannot read properties') ||
          errorMessage.includes('IDL') ||
          errorMessage.includes('Anchor') ||
          errorString.includes('anchor') ||
          errorString.includes('idl')
        ) {
          toast.error('Wallet service configuration error', {
            ...toastPresets.error,
            description: 'The payment service is currently misconfigured. Please contact support or try again later.',
            duration: 10000,
          });
          setStep('form'); // Return to form instead of showing success message
        } else {
          toast.error('Failed to fund wallet', {
            ...toastPresets.error,
            description: errorMessage || 'An unexpected error occurred. Please try again.',
            duration: 5000,
          });
          setStep('form'); // Return to form on error
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Form {...form}>
      <form className="space-y-48" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-[26px]">
          <div className="space-y-1 md:max-w-[413px]">
            <h1 className="text-[32px] font-semibold  text-[#F8F8F8] ">
              Fund account
            </h1>
            <p className="text-[15px] font-light">
              Select the amount you want to add to your wallet. The value will
              be converted to credits automatically
            </p>
          </div>

          <div
            style={{
              background:
                'linear-gradient(0deg, #0f1114 0%, #0f1114 100%), #d9d9d9',
            }}
            className="border border-[#212121] rounded-lg px-6 py-[29px] flex md:flex-row flex-col items-center justify-between"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-[19px] !max-w-[290px]">
                  <FormLabel className="text-[15px] text-[#D4D4D8]">
                    Amount
                  </FormLabel>
                  <FormControl>
                    <NumericFormat
                      placeholder="$0.00"
                      inputMode="decimal"
                      className="border-none ring-0 !outline-0 focus:!ring-0 focus-within:!ring-0 !text-[40px] text-[#E8ECED] font-bold h-auto !w-max"
                      value={field.value}
                      onValueChange={(values) => {
                        field.onChange(values.value);
                      }}
                      thousandSeparator
                      decimalScale={2}
                      fixedDecimalScale={false}
                      prefix="$"
                      allowNegative={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="space-y-[7px] !w-full">
                  <FormLabel className="text-xs text-[#D4D4D8] text-end">
                    Funding source
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-auto p-2.5">
                        <Icon.card />
                        <SelectValue
                          placeholder="**** 2347"
                          className="uppercase "
                        >
                          {field.value ? `**** ${field.value}` : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="p-4 z-[99999]">
                      <SelectGroup>
                        <SelectLabel>
                          <button
                            type="button"
                            className="cursor-pointer flex items-center gap-2.5 w-full"
                          >
                            <Icon.addCard />
                            <span className="text-white text-base">
                              Add A new card
                            </span>
                          </button>
                        </SelectLabel>
                        {cards.map(({ lastFourDigits, expDate }, index) => (
                          <React.Fragment key={lastFourDigits}>
                            <SelectItem
                              value={lastFourDigits}
                              className="cursor-pointer flex items-center gap-2.5"
                            >
                              <Icon.card />
                              <span className="text-sm uppercase">
                                **** {lastFourDigits}
                              </span>
                              <span className="text-sm uppercase">
                                EXP - {expDate}
                              </span>
                            </SelectItem>
                            {index < cards.length - 1 && <SelectSeparator />}
                          </React.Fragment>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button className="rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full">
          Continue
        </Button>
      </form>
    </Form>
  );
};
