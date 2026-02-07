'use client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from '@bprogress/next/app';

const Page = () => {
  const router = useRouter();

  const motionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const handleRetry = () => {
    router.push('/verify-age');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#050505] px-5 py-8 md:py-0">
      <div className="relative w-full">
        <div className="blur-[50px] rounded-4xl opacity-20 bg-[#FF007F] h-[391px] w-[379px] absolute -translate-y-1/2 top-[55%] -translate-x-1/2 left-1/2" />
        <div className="w-full max-w-[542px] rounded-[28px] bg-[#0A0A0B] shadow-[2px_2px_0_0_#0F1114] p-6 md:p-10 space-y-6 md:space-y-10 relative overflow-hidden mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="consent-declined"
              {...motionVariants}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="space-y-8 w-full"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-[#FF007F]/10 border-2 border-[#FF007F]/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF007F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="md:w-10 md:h-10"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 text-center">
                <h1 className="text-2xl md:text-[32px] font-semibold text-[#D4D4D8]">
                  Consent Declined
                </h1>
                <p className="text-[#8A8C95] text-sm md:text-base leading-relaxed">
                  You have declined to provide consent for age verification. To
                  continue using our platform, you must complete the
                  verification process.
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-[#0F1114] rounded-lg p-3 md:p-4 border border-[#1E2227]">
                <p className="text-xs md:text-sm text-[#8A8C95] leading-relaxed">
                  Age verification is required to ensure compliance with legal
                  regulations and to provide a safe environment for all users.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 md:space-y-3">
                <Button
                  onClick={handleRetry}
                  className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-base md:text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 delay-100 ease-in-out"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleGoBack}
                  variant="ghost"
                  className="rounded w-full h-auto py-2.5 md:py-3.5 px-4 text-sm md:text-base font-medium text-[#8A8C95] hover:text-[#D4D4D8] hover:bg-[#0F1114] transition-all duration-300"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};

export default Page;
