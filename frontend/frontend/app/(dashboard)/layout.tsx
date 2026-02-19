import { MobileNav } from '@/components/mobile-nav';
import type React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <MobileNav />
    </>
  );
}
