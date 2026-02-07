import { Icon } from './ui/icons';
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
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Image from 'next/image';

const formSchema = z.object({
  enablePaymentBox: z.boolean().optional(),
  price: z.string().optional(),
  details: z
    .string({ required_error: 'Please provide details' })
    .max(200, 'Details must be at most 200 characters.')
    .optional(),
});

interface MessageUploadWithPaymentBoxProps {
  files: File[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSubmit: (data: {
    files: File[];
    isPayable: boolean;
    price?: string;
    details?: string;
  }) => void;
}

export const MessageUploadWithPaymentBox = ({
  files,
  onRemove,
  onClearAll,
  onClose,
  onSubmit: onSubmitProp,
}: MessageUploadWithPaymentBoxProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enablePaymentBox: false,
      price: '',
      details: '',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // Prepare the submission data
    const submissionData = {
      files,
      isPayable: data.enablePaymentBox || false,
      price: data.enablePaymentBox && data.price ? data.price : undefined,
      details: data.enablePaymentBox && data.details ? data.details : undefined,
    };

    // Call the parent's onSubmit handler
    onSubmitProp(submissionData);

    // Reset form and close
    form.reset();
    onClose();
  }

  if (files.length === 0) return null;

  // Helper function to get grid class based on number of files
  const getGridClass = () => {
    if (files.length === 1) return 'grid-cols-1';
    if (files.length === 2) return 'grid-cols-2';
    if (files.length === 3) return 'grid-cols-2';
    return 'grid-cols-2'; // 4+ files also use 2 columns
  };

  // Helper function to get border classes for smart border removal
  const getBorderClass = (index: number) => {
    const total = files.length;

    if (total === 1) return 'rounded-[8px]';

    if (total === 2) {
      // First item: no right border, rounded left
      if (index === 0) return 'rounded-l-[8px] border-r-0';
      // Second item: no left border, rounded right
      return 'rounded-r-[8px] border-l-0';
    }

    if (total === 3) {
      // First item: top-left, no right or bottom border
      if (index === 0) return 'rounded-tl-[8px] border-r-0 border-b-0';
      // Second item: top-right, no left or bottom border
      if (index === 1) return 'rounded-tr-[8px] border-l-0 border-b-0';
      // Third item: bottom, spans full width, no top border
      return 'rounded-b-[8px] border-t-0 col-span-2';
    }

    // 4+ files (2x2 grid or more)
    const isTopRow = index < 2;
    const isBottomRow = index >= Math.floor((total - 1) / 2) * 2;
    const isLeftCol = index % 2 === 0;
    const isRightCol = index % 2 === 1;

    let classes = '';

    // Top corners
    if (index === 0) classes += 'rounded-tl-[8px] ';
    if (index === 1) classes += 'rounded-tr-[8px] ';

    // Bottom corners (only for last row)
    const lastRowStart = Math.floor((total - 1) / 2) * 2;
    if (index === lastRowStart && isLeftCol) classes += 'rounded-bl-[8px] ';
    if (index === total - 1 && isRightCol) classes += 'rounded-br-[8px] ';

    // Border removal logic
    if (!isTopRow) classes += 'border-t-0 ';
    if (!isBottomRow) classes += 'border-b-0 ';
    if (!isLeftCol) classes += 'border-l-0 ';
    if (!isRightCol) classes += 'border-r-0 ';

    return classes.trim();
  };

  return (
    <div className="mb-3 animate-slide-up">
      <Form {...form}>
        <form
          className="rounded-[14.41px] p-4 bg-[#0F1114] border border-[#73819712] w-max space-y-3 relative"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8A8C95]">Upload Media</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-[#2a2d33]"
              onClick={onClearAll}
            >
              <Icon.close className="h-3 w-3" />
            </Button>
          </div>

          <div
            className={`grid ${getGridClass()} gap-0.5 w-[278px] overflow-hidden rounded-[8px] bg-[#1F222759]`}
          >
            {files.map((file, index) => {
              const fileUrl = URL.createObjectURL(file);
              return (
                <div
                  key={index}
                  className={`relative h-[167px] ${
                    files.length === 3 && index === 2
                      ? 'h-[167px]'
                      : files.length > 1
                      ? 'h-[139px]'
                      : ''
                  } overflow-hidden bg-[#1F222759] border border-[#3c3c42] ${getBorderClass(
                    index
                  )}`}
                >
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={fileUrl}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : file.type.startsWith('video/') ? (
                    <video
                      src={fileUrl}
                      className="w-full h-full object-cover"
                      controls
                    >
                      <track kind="captions" />
                    </video>
                  ) : null}

                  {/* Remove button overlay */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onRemove(index);
                    }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 hover:bg-black/70 text-white z-10"
                  >
                    <Icon.close className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <FormField
              control={form.control}
              name="enablePaymentBox"
              render={({ field }) => (
                <FormItem className="flex items-center gap-[9.68px]">
                  <FormLabel className="text-[9.075px] text-[#8A8C95] font-medium">
                    Enable Payment
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('enablePaymentBox') && (
              <>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <Icon.moneySendOutline className="absolute -translate-y-1/2 top-1/2 left-3 size-[14.519px]" />
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="Prices"
                          className="!bg-[#15171B] border-[#0F1114] h-auto p-[9.68px] pl-8 placeholder:text-[#9E9E9E] rounded-[8px] !text-[9.68px]"
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            const formatted = raw
                              ? new Intl.NumberFormat('en-US').format(
                                  Number(raw)
                                )
                              : '';
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          placeholder="Item details"
                          className="!bg-[#15171B] border-[#0F1114] h-auto p-[9.68px] placeholder:text-[#9E9E9E] rounded-[8px] !text-[9.68px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <Button className="bg-[#FF007F] hover:bg-[#FF007F]/80 w-full font-semibold text-sm text-[#0F1114] ">
            Send
            <Icon.send fill="#0F1114" />
          </Button>
        </form>
      </Form>
    </div>
  );
};
