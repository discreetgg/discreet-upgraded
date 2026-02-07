'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MicrophonePermissionDialogProps {
  open: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

export const MicrophonePermissionDialog = ({
  open,
  onAllow,
  onCancel,
}: MicrophonePermissionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className='max-w-[390px] rounded-[15.123px] bg-[#0F1114] shadow-[5px_6px_0_0_#3C3C42] p-6 w-full'>
        <DialogHeader>
          <DialogTitle className='text-[21.173px] font-medium text-[#D4D4D8]'>
            Microphone Access Required
          </DialogTitle>
          <DialogDescription className='text-[15.123px] text-[#8A8C95] mt-2'>
            This call requires microphone access. Please enable your microphone
            to continue.
          </DialogDescription>
        </DialogHeader>

        <div className='bg-[#1A1B1E] rounded-lg p-4 my-4'>
          <p className='text-sm text-[#A1A1AA] mb-2'>
            To enable microphone access:
          </p>
          <ol className='text-sm text-[#8A8C95] space-y-2 list-decimal list-inside'>
            <li>Click the lock/settings icon in your browser's address bar</li>
            <li>Find "Microphone" in the permissions list</li>
            <li>Select "Allow" for this site</li>
            <li>Refresh the page if needed</li>
          </ol>
        </div>

        <DialogFooter className='flex gap-3'>
          <Button
            onClick={onCancel}
            variant='outline'
            className='flex-1 bg-transparent border-[#3C3C42] text-[#8A8C95] hover:bg-[#1A1B1E] hover:text-white'
          >
            Cancel
          </Button>
          <Button
            onClick={onAllow}
            className='flex-1 bg-[#FF007F] text-white hover:bg-[#E6006F]'
          >
            Allow Microphone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
