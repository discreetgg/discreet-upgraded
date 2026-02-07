'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCallTime } from '@/lib/utils';
import { format } from 'date-fns';

export type CallEndSummaryData = {
  _id: string;
  conversation?: string;
  sender?: string;
  reciever?: string;
  type?: string;
  isPayable?: boolean;
  price?: string;
  paid?: boolean;
  status?: string;
  call?: 'audio' | 'video';
  callStatus?: string;
  callStartedAt?: string;
  callEndedAt?: string;
  missed?: boolean;
  discount?: string;
  durationInSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
};

type CallEndSummaryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: CallEndSummaryData | null;
  loading?: boolean;
  error?: string | null;
};

const LoadingSkeleton = ({ error }: { error?: string | null }) => (
  <div className="flex flex-col items-center gap-6 py-4">
    {/* Icon skeleton */}
    <Skeleton className="w-16 h-16 rounded-full bg-[#1F2227]" />

    {/* Title skeleton */}
    <div className="text-center space-y-2">
      <Skeleton className="h-6 w-40 mx-auto bg-[#1F2227]" />
      <Skeleton className="h-4 w-48 mx-auto bg-[#1F2227]" />
    </div>

    {/* Details skeleton */}
    <div className="w-full space-y-3 bg-[#0F1114] rounded-lg p-4 border border-[#1E1E21]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16 bg-[#1F2227]" />
        <Skeleton className="h-4 w-20 bg-[#1F2227]" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-12 bg-[#1F2227]" />
        <Skeleton className="h-4 w-16 bg-[#1F2227]" />
      </div>
      <div className="border-t border-[#1E1E21] my-2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20 bg-[#1F2227]" />
        <Skeleton className="h-4 w-16 bg-[#1F2227]" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#1E1E21]">
        <Skeleton className="h-4 w-24 bg-[#1F2227]" />
        <Skeleton className="h-5 w-20 bg-[#1F2227]" />
      </div>
    </div>

    {/* Button skeleton - disabled state or error state */}
    {error ? (
      <Button
        disabled
        className="w-full bg-[#EF4444] text-white border border-[#EF4444] cursor-not-allowed"
      >
        {error}
      </Button>
    ) : (
      <Button
        disabled
        className="w-full bg-[#1F2227] text-[#71717A] border border-[#1E1E21] cursor-not-allowed"
      >
        Loading...
      </Button>
    )}
  </div>
);

export const CallEndSummaryDialog = ({
  open,
  onOpenChange,
  callData,
  loading = false,
  error = null,
}: CallEndSummaryDialogProps) => {
  // Prevent closing while loading, but allow closing on error
  const handleOpenChange = (newOpen: boolean) => {
    if (loading && !error && !newOpen) {
      return; // Don't allow closing while loading (unless there's an error)
    }
    onOpenChange(newOpen);
  };

  const duration = callData?.durationInSeconds ?? 0;
  const durationMinutes = Math.floor(duration / 60);
  const durationSeconds = Math.round(duration % 60);

  const price = callData?.price ? parseFloat(callData.price) : 0;
  const discount = callData?.discount ? parseFloat(callData.discount) : 0;
  const finalPrice = price - discount;

  const isVideoCall = callData?.call === 'video';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg w-full">
        {loading || !callData ? (
          <LoadingSkeleton error={error} />
        ) : (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Call Type Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1F2227]">
              {isVideoCall ? (
                <Icon.videoCall className="w-8 h-8 text-[#D4D4D8]" />
              ) : (
                <Icon.phoneCall className="w-8 h-8 text-[#D4D4D8]" />
              )}
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#D4D4D8]">
                {isVideoCall ? 'Video' : 'Audio'} Call Ended
              </h2>
              <p className="text-sm text-[#71717A] mt-1">
                {callData.callStartedAt
                  ? format(
                      new Date(callData.callStartedAt),
                      'MMM d, yyyy • h:mm a',
                    )
                  : 'Call completed'}
              </p>
            </div>

            {/* Call Details */}
            <div className="w-full space-y-3 bg-[#0F1114] rounded-lg p-4 border border-[#1E1E21]">
              {/* Duration */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71717A]">Duration</span>
                <span className="text-sm font-medium text-[#D4D4D8]">
                  {durationMinutes > 0
                    ? `${durationMinutes}m ${durationSeconds}s`
                    : `${durationSeconds}s`}
                </span>
              </div>

              {/* Call Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71717A]">Status</span>
                <span className="text-sm font-medium text-[#22C55E] capitalize">
                  {callData.callStatus || 'Ended'}
                </span>
              </div>

              {/* Payment Info (if payable) */}
              {callData.isPayable && (
                <>
                  <div className="border-t border-[#1E1E21] my-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#71717A]">Call Rate</span>
                    <span className="text-sm font-medium text-[#D4D4D8]">
                      ${price.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#71717A]">Discount</span>
                      <span className="text-sm font-medium text-[#22C55E]">
                        -${discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#1E1E21]">
                    <span className="text-sm font-medium text-[#D4D4D8]">
                      Total Charged
                    </span>
                    <span className="text-base font-semibold text-[#D4D4D8]">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>

                  {callData.paid && (
                    <div className="flex items-center justify-center gap-1 text-xs text-[#22C55E]">
                      <Icon.tickCircle className="w-3 h-3" />
                      <span>Payment completed</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Close Button */}
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded flex items-center justify-center border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-lg font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
