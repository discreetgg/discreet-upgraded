'use client';

import { useSecurityDialogStepNavigation } from '@/hooks/use-step-navigation';
import { Button } from './ui/button';
import { Icon } from './ui/icons';

export const SettingSecurity2FADetails = () => {
  const { goToStep } = useSecurityDialogStepNavigation();

  return (
    <div className='space-y-10'>
      <Icon.securityDetails className='mx-auto' />
      <div className='space-y-[51px]'>
        <h2 className='text-[#F8F8F8] text-[32px] font-semibold'>
          Protect your account in just two steps
        </h2>
        <p className='text-[15px] text-[#8A8C95] font-medium'>
          <span className='text-lg text-white'>
            Link an authentication app to your Discreet account
          </span>
          <br />
          Use a compatible authentication app (like Google Authenticator, Authy,
          Duo Mobile, 1Password, etc.) We'll generate a QR code for you to scan.
        </p>
        <p className='text-[15px] text-[#8A8C95] font-medium'>
          <span className='text-lg text-white'>
            Enter the confirmation code
          </span>
          <br />
          Two-factor authentication will then be turned on for authentication
          app, which you can turn off at any time.
        </p>
        <Button
          type='button'
          onClick={() => goToStep('scan')}
          className='rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-lg  font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full'
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};
