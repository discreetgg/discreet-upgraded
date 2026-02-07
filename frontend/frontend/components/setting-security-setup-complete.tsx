'use client';

import { useGlobal } from '@/context/global-context-provider';
import { useSecurityDialogStepNavigation } from '@/hooks/use-step-navigation';
import { generateBackupCodesService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { ComponentLoader } from './ui/component-loader';

export const SettingSecuritySetupComplete = () => {
  const { user } = useGlobal();
  const { clearStep } = useSecurityDialogStepNavigation();

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
    <div className='space-y-[18px]'>
      <div className='space-y-[26px]'>
        <h2 className='text-[#F8F8F8] text-[32px] font-semibold'>
          Setup Complete
        </h2>
        <p className='text-lg text-[#8A8C95] font-medium'>
          You can now use your mobile authentication app to generate a login
          code whenever you access X. Make sure to store this one-time backup
          code securely:
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
      <p className='text-lg text-[#8A8C95] font-medium'>
        Use this backup code to sign in to X if you're unable to receive a text
        message or access your other two-factor authentication options.
      </p>

      <Button
        type='button'
        disabled={loading || !code}
        onClick={() => {
          clearStep();
        }}
        className={cn(
          'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
          'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
        )}
      >
        Done
      </Button>
    </div>
  );
};
