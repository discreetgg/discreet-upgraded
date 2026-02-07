'use client';

import { useGlobal } from '@/context/global-context-provider';
import { useSecurityDialogStepNavigation } from '@/hooks/use-step-navigation';
import { generateOTPService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { ComponentLoader } from './ui/component-loader';

export const SettingSecurityScanQRCode = () => {
  const { user } = useGlobal();
  const { goToStep } = useSecurityDialogStepNavigation();

  const [loading, setIsLoading] = useState(false);
  const [otpUrl, setOtpUrl] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      await generateOTPService({ discordId: user?.discordId ?? '' })
        .then((response) => {
          setOtpUrl(response?.data?.otp?.otpUrl);
        })
        .catch((error) => {
          toast.error('Failed to generate OTP');
          console.error(error);
        })
        .finally(() => setIsLoading(false));
    })();
  }, [user]);

  return (
    <div className='space-y-[51px]'>
      <div className='space-y-[26px]'>
        <h2 className='text-[#F8F8F8] text-[32px] font-semibold'>
          Link the app to your Discret account
        </h2>
        <p className='text-lg text-[#8A8C95] font-medium'>
          Use your authentication app to scan this QR code. If you don’t have an
          authentication app on your device, you’ll need to install one now.
        </p>
        <p className='text-[15px] text-[#FF0065] font-medium'>
          Can't scan the QR code?
        </p>
      </div>
      {loading ? (
        <ComponentLoader />
      ) : (
        <QRCodeSVG
          value={otpUrl}
          size={200}
          className={cn(
            'mx-auto bg-white p-2.5 rounded-[17px]',
            !otpUrl &&
              'opacity-25 cursor-not-allowed blur-sm bg-red-500 border-red-500 border-2'
          )}
        />
      )}

      <Button
        type='button'
        disabled={loading || !otpUrl}
        onClick={() => {
          goToStep('confirm');
        }}
        className={cn(
          'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full',
          'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
        )}
      >
        Next
      </Button>
    </div>
  );
};
