'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SettingSecurity2FADetails } from './setting-security-2FA-details';
import { SettingSecurityEnterConfirmationCode } from './setting-security-enter-confirmation-code';
import { SettingSecurityEnterPassword } from './setting-security-enter-password';
import { SettingSecurityScanQRCode } from './setting-security-scan-QR-code';
import { SettingSecuritySetupComplete } from './setting-security-setup-complete';
import { Button } from './ui/button';

import { useSecurityDialogStepNavigation } from '@/hooks/use-step-navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const steps = ['enter-password', 'details', 'scan', 'confirm', 'done'] as const;

type DialogStep = (typeof steps)[number];

const DialogStepContent = ({ step }: { step: DialogStep }) => {
  switch (step) {
    case 'enter-password':
      return <SettingSecurityEnterPassword />;
    case 'details':
      return <SettingSecurity2FADetails />;
    case 'scan':
      return <SettingSecurityScanQRCode />;
    case 'confirm':
      return <SettingSecurityEnterConfirmationCode />;
    case 'done':
      return <SettingSecuritySetupComplete />;
    default:
      return null;
  }
};

export const SettingsEnterPasswordDialog = () => {
  const searchParams = useSearchParams();
  const { goToStep, clearStep } = useSecurityDialogStepNavigation();

  const currentStep = searchParams.get('dialog-step') as DialogStep | null;
  const isDialogOpen = steps.includes(currentStep as DialogStep);
  const activeStep: DialogStep = steps.includes(currentStep as DialogStep)
    ? (currentStep as DialogStep)
    : 'enter-password';

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isDialogOpen);
  }, [isDialogOpen]);

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        setOpen(openState);
        if (!openState) {
          clearStep();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] absolutex right-4 -top-2"
          onClick={() => goToStep('enter-password')}
        >
          Set up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
          >
            <DialogStepContent step={activeStep} />
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
