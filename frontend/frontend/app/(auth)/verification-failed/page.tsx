'use client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '@bprogress/next/app';
import { useState } from 'react';

const Page = () => {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const motionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const handleRetry = () => {
    setIsRetrying(true);
    // Small delay for better UX
    setTimeout(() => {
      router.push('/verify-age');
    }, 300);
  };

  const handleContactSupport = () => {
    // You can replace this with your support email or contact page URL
    window.location.href = 'mailto:support@discreet.com';
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#050505] px-5 py-8 md:py-0">
      <div className="relative w-full">
        <div className="blur-[50px] rounded-4xl opacity-20 bg-[#FF007F] h-[391px] w-[379px] absolute -translate-y-1/2 top-[55%] -translate-x-1/2 left-1/2" />
        <div className="w-full max-w-[542px] rounded-[28px] bg-[#0A0A0B] shadow-[2px_2px_0_0_#0F1114] p-6 md:p-10 space-y-6 md:space-y-10 relative overflow-hidden mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="verification-failed"
              {...motionVariants}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="space-y-8 w-full"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-[#F04438]/10 border-2 border-[#F04438]/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F04438"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="md:w-10 md:h-10"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 text-center">
                <h1 className="text-2xl md:text-[32px] font-semibold text-[#D4D4D8]">
                  Verification Failed
                </h1>
                <p className="text-[#8A8C95] text-sm md:text-base leading-relaxed">
                  We were unable to complete your age verification. This could
                  be due to incomplete information or the process being
                  interrupted.
                </p>
              </div>

              {/* Possible reasons */}
              <div className="bg-[#0F1114] rounded-lg p-3 md:p-4 border border-[#1E2227] space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm font-medium text-[#D4D4D8]">
                  Common reasons:
                </p>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-[#8A8C95]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF007F] mt-0.5">•</span>
                    <span>
                      The verification process was closed or cancelled
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF007F] mt-0.5">•</span>
                    <span>Document images were unclear or incomplete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF007F] mt-0.5">•</span>
                    <span>Network connection was interrupted</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2 md:space-y-3">
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-base md:text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? 'Redirecting...' : 'Try Again'}
                </Button>
                <Button
                  onClick={handleContactSupport}
                  variant="ghost"
                  className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-sm md:text-base font-medium text-[#8A8C95] hover:text-[#D4D4D8] hover:bg-[#0F1114] transition-all duration-300"
                >
                  Contact Support
                </Button>
              </div>

              {/* Help text */}
              <p className="text-xs text-center text-[#8A8C95]">
                Need help?{' '}
                <button
                  onClick={handleContactSupport}
                  className="text-[#FF007F] hover:underline"
                >
                  Get in touch with our support team
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default Page;
