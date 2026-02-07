'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useGlobal } from '@/context/global-context-provider';
import { generateBackupCodesService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { ComponentLoader } from './ui/component-loader';

export const SettingsViewBackupCodesDialog = () => {
  const { user } = useGlobal();

  const [loading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      await generateBackupCodesService({ discordId: user?.discordId ?? '' })
        .then((response) => {
          setCode(response?.data?.codes?.[0] || '');
        })
        .catch((error) => {
          toast.error('Failed to generate backup codes');
          console.error(error);
        })
        .finally(() => setIsLoading(false));
    })();
  }, [user]);

  const handleCopy = () => {
    if (!code) {
      toast.error('No code to copy');
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success('Code copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy code.');
      });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='rounded py-3.5 px-4 h-auto'>
          View Backup Codes
        </Button>
      </DialogTrigger>
      <DialogContent className='space-y-[30px]'>
        <div className='space-y-[26px]'>
          <h2 className='text-[#F8F8F8] text-[32px] font-semibold'>
            Backup Code
          </h2>
          <p className='text-lg text-[#8A8C95] font-medium'>
            If you ever lose access to your device, you can use this code to
            verify your identity. Write it down, or take a screenshot, and keep
            it some place safe. This code can only be used once.
          </p>
        </div>

        {loading ? (
          <ComponentLoader />
        ) : (
          <Button
            onClick={handleCopy}
            className={cn(
              'rounded-[4px] border border-[#1F2227] bg-[#0F1114] py-3.5 px-4 h-auto w-full text-[23px] text-[#FFFBFA] text-center font-medium',
              !code && 'text-[#F97066]'
            )}
          >
            {code || 'No backup code available'}
          </Button>
        )}

        <Button
          type='button'
          disabled={loading || !code}
          className={cn(
            'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
            'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
          )}
        >
          Generate new code
        </Button>
      </DialogContent>
    </Dialog>
  );
};
