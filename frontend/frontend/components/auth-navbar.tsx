'use client';

import React from 'react';
import { Icon } from './ui/icons';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const AuthNavbar = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div
      className="max-w-[1404px] w-full mx-auto p-5 flex items-center justify-between"
      ref={menuRef}
    >
      <Link href="/" className="flex items-center gap-2">
        <Icon.logo className="text-white w-[35.379px] h-[28.538px]" />
        <span className="text-[24.399px] font-semibold">Discreet</span>
      </Link>
      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-[18px]">
        <Link
          href="/auth/guest-seller"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'rounded-full py-3.5 px-4 text-[15px] font-medium text-[#F8F8F8]'
          )}
        >
          Guest Seller signin
        </Link>
        <Link
          href="/auth/guest-buyer"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'rounded-full py-3.5 px-4 text-[15px] font-medium text-[#F8F8F8]'
          )}
        >
          Guest Buyer signin
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open menu"
        className="md:hidden inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-2.5"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Swap to a different menu glyph when open for feedback */}
        {open ? (
          <Icon.menu className="w-6 h-6" />
        ) : (
          <Icon.menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile dropdown panel */}
      {mounted && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-[72px] z-50 mx-5 md:hidden"
            >
              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="rounded-xl border border-white/10 bg-[#0B0B0C]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B0C]/70 p-4 shadow-lg"
              >
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/guest-seller"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full rounded-full py-3.5 px-4 text-[15px] font-medium text-[#F8F8F8]'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    Guest Seller signin
                  </Link>
                  <Link
                    href="/auth/guest-buyer"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full rounded-full py-3.5 px-4 text-[15px] font-medium text-[#F8F8F8]'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    Guest Buyer signin
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
