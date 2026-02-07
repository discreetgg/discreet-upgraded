'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const steps = ['enter-password', 'details', 'scan', 'confirm', 'done'] as const;

export type Step = (typeof steps)[number];

export const useSecurityDialogStepNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToStep = (step: Step) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('dialog-step', step);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearStep = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete('dialog-step');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return { goToStep, clearStep };
};
