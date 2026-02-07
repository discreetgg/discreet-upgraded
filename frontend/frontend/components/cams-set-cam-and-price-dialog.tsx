'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Icon } from './ui/icons';
import { convertCurrencyToString } from '@/lib/utils';
import { NumericFormat } from 'react-number-format';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DialogClose } from './ui/tipping-dialog';
import { Switch } from '@/components/ui/switch';
import { useGlobal } from '@/context/global-context-provider';
import { updateCamSettingsService } from '@/lib/services';
import { toast } from 'sonner';
import { useState } from 'react';

const timeStamps = [
  {
    label: '5min',
    value: 5,
  },
  {
    label: '10min',
    value: 10,
  },
  {
    label: '15min',
    value: 15,
  },
  {
    label: '30min',
    value: 30,
  },
  {
    label: '35min',
    value: 35,
  },
  {
    label: '40min',
    value: 40,
  },
  {
    label: '1hr',
    value: 60,
  },
  {
    label: '2hr',
    value: 120,
  },
];

const formSchema = z.object({
  rate: z.string({
    required_error: 'Please enter an amount.',
  }),
  minimumCallTime: z.enum(
    timeStamps.map((t) => t.value.toString()) as [string, ...string[]],
    {
      required_error: 'You need to select a notification type.',
    }
  ),
  taking_cams: z.boolean().default(false).optional(),
  taking_calls: z.boolean(),
});

export const CamsSetCamAndPriceDialog = ({
  children,
  open,
  onOpenChange,
  data,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  data: {
    rate: number;
    minimumCallTime: number;
    takingCams: boolean;
    takingCalls: boolean;
  };
}) => {
  const { user, setUser } = useGlobal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rate: data?.rate ? data.rate.toString() : '0',
      minimumCallTime: data?.minimumCallTime
        ? data.minimumCallTime.toString()
        : '5',
      taking_cams: data?.takingCams || false,
      taking_calls: data?.takingCalls || false,
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    await updateCamSettingsService({
      sellerId: user?.discordId || '',
      rate: parseFloat(convertCurrencyToString(data.rate)),
      minimumCallTime: parseInt(data.minimumCallTime, 10),
      takingCams: data.taking_cams || false,
      takingCalls: data.taking_calls || false,
    })
      .then((res) => {
        form.reset();
        setUser({ ...user, ...res });
        toast.success('Cam & Audio settings updated successfully!');
        onOpenChange?.(false);
      })
      .catch((err) => {
        toast.error('Failed to update Cam & Audio settings.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        onOpenChange?.(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-[12px] bg-[#111316] w-[400px] border border-[#16191D] p-[calc(7.752px*2)] space-y-3">
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <h1 className="text-[24.805px] font-semibold text-[#F8F8F8]">
              Set Cam
            </h1>
            <div className="p-3 border border-[#232323] bg-[#111316] space-y-2.5 rounded-[12.403px]">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="relative space-y-1.5">
                    <FormLabel className="text-[12.403px] text-[#9E9E9E]">
                      Call rate
                    </FormLabel>

                    <div className="relative">
                      <Icon.tip className="size-[18.604px] absolute left-3 -translate-y-1/2 top-1/2" />
                      <FormControl>
                        <NumericFormat
                          placeholder="Price"
                          inputMode="decimal"
                          className="rounded-[59px] border border-[#1E2227] bg-[#0F1114] text-[12.403px] text-[#E8ECED] font-bold h-auto !w-full p-3 pl-10"
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
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumCallTime"
                render={({ field }) => (
                  <FormItem className="relative space-y-2.5">
                    <FormLabel className="text-[12.403px] text-[#9E9E9E]">
                      Minimum call time
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="grid grid-cols-4 gap-x-4 gap-y-2.5 "
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        {timeStamps.map((time) => (
                          <FormItem>
                            <FormControl>
                              <FormLabel
                                key={time.value}
                                htmlFor={time.value.toString()}
                                className="cursor-pointer bg-[#0F1114] rounded-[50px] w-full flex items-center justify-center px-4 py-3.5 border border-[#1E2227] has-[button[data-state=checked]]:bg-[#FF007F]"
                              >
                                {time.label}
                                <RadioGroupItem
                                  value={time.value.toString()}
                                  id={time.value.toString()}
                                  className="hidden"
                                />
                              </FormLabel>
                            </FormControl>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2.5">
              <FormField
                control={form.control}
                name="taking_calls"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[12.403px] text-[#9E9E9E]">
                        Taking calls
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taking_cams"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[12.403px] text-[#9E9E9E]">
                        Taking cams
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <DialogClose asChild>
                <button
                  type="button"
                  disabled={loading}
                  className="gap-2 !flex-1 items-center justify-center h-auto w-full   flex font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] !text-[13.953px] border-[#1F2227] bg-[#0A0A0A] rounded border text-[#8A8C95] disabled:border-accent-gray disabled:shadow-none disabled:opacity-50"
                >
                  Close
                </button>
              </DialogClose>
              <button
                type="submit"
                disabled={loading}
                className="gap-2 !flex-1 h-auto w-full justify-center  flex items-center font-medium !px-[12.403px] !py-[10.852px] shadow-[2px_2px_0_0_#FF007F] !text-[13.953px] border-[#FF007F] bg-[#0A0A0A] rounded border text-[#D4D4D8] disabled:border-accent-gray disabled:shadow-none disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
