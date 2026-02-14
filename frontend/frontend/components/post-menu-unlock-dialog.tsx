'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

type PostMenuUnlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  state?: 'confirm' | 'processing' | 'success';
  onOpenMessages?: () => void;
  isResolvingConversation?: boolean;
  menuTitle: string;
  itemCount: number;
  compositionLabel: string;
  totalPriceLabel: string;
};

export const PostMenuUnlockDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  state = 'confirm',
  onOpenMessages,
  isResolvingConversation = false,
  menuTitle,
  itemCount,
  compositionLabel,
  totalPriceLabel,
}: PostMenuUnlockDialogProps) => {
  const isProcessing = state === 'processing' || isPending;
  const isSuccess = state === 'success';
  const title = isSuccess ? 'Unlock Complete' : 'Confirm Unlock';
  const description = isSuccess
    ? 'Your purchase was delivered. You can open the DM thread now.'
    : 'Review this unlock before charging your wallet.';

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isProcessing) {
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="max-h-[88vh] overflow-y-auto border-[#232737] bg-[#0D1016] p-5 sm:max-w-[560px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[#F8F8F8]">
            {isSuccess && <CheckCircle2 className="h-4 w-4 text-[#31D0AA]" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#9EA4B5]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-w-0 rounded-md border border-white/10 bg-black/30 p-3 text-sm text-[#D4D4D8]">
          <p className="font-medium text-[#F8F8F8] [overflow-wrap:anywhere]">
            {menuTitle}
          </p>
          <p className="mt-2 text-[#C5CBD8]">
            Items: {itemCount} ({compositionLabel})
          </p>
          <p className="mt-1 font-semibold text-white">
            Total charge: {totalPriceLabel}
          </p>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2 rounded-md border border-[#2A3344] bg-[#121826] px-3 py-2 text-xs text-[#D4D4D8]">
            <span className="size-3 animate-spin rounded-full border-2 border-[#667089] border-t-[#FF007F]" />
            Processing payment and delivering to DMs...
          </div>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-3">
          {isSuccess ? (
            <>
              <AlertDialogCancel asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#2C3343] bg-transparent text-[#E4E6EC] hover:bg-[#151C29] sm:w-auto"
                >
                  Close
                </Button>
              </AlertDialogCancel>
              <Button
                type="button"
                onClick={onOpenMessages}
                disabled={isResolvingConversation}
                className="w-full bg-[#FF007F] text-white hover:bg-[#D9006D] sm:w-auto"
              >
                {isResolvingConversation ? 'Opening DMs...' : 'Open in DMs'}
              </Button>
            </>
          ) : (
            <>
              <AlertDialogCancel
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isProcessing}
                className="w-full bg-[#FF007F] text-white hover:bg-[#D9006D] sm:w-auto"
              >
                {isProcessing ? 'Processing...' : 'Unlock'}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
