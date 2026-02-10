'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullScreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function FullScreenModal({
  open,
  onOpenChange,
  children,
  showCloseButton = true,
}: FullScreenModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto bg-black/95 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={() => onOpenChange(false)}
          className={cn(
            'absolute top-4 right-4 z-[10000]',
            'p-2 rounded-full',
            'bg-black/50 hover:bg-black/70',
            'text-white/80 hover:text-white',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-white/50'
          )}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div className="h-full w-full">{children}</div>
    </div>,
    document.body
  );
}
