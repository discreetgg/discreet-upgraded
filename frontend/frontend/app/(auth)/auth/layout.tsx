import { AuthNavbar } from '@/components/auth-navbar';
import { PartnerDiscordServers } from '@/components/partner-discord-servers';
import Link from 'next/link';
import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-[#0F1114] flex flex-col justify-between items-center">
      <AuthNavbar />
      <div className="py-[72px] w-full">{children}</div>
      {/* <PartnerDiscordServers infiniteMovingCardsClassName="md:max-w-[736px] max-w-[400px]" /> */}
      <footer className="flex flex-col gap-6 items-center py-[54px] w-full justify-between text-[14.895px] text-[#B3B3B3] max-w-[1404px] mx-auto p-5">
        <span className="flex flex-wrap divide-x-2 divide-[#B3B3B3]">
          <Link href="/18-usc" className="px-2 hover:underline">
            18 U.S.C. § 2257
          </Link>
          <Link href="/terms-of-service" className="px-2 hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="px-2 hover:underline">
            Privacy Policy
          </Link>
          <Link
            href="/california-privacy-policy"
            className="px-2 hover:underline"
          >
            California Privacy Policy
          </Link>
          <Link href="/copyright" className="px-2 hover:underline">
            Copyright Policy
          </Link>
          <Link href="/complaints-policy" className="px-2 hover:underline">
            Complaints Policy
          </Link>
          <Link href="/appeal-policy" className="px-2 hover:underline">
            Appeal Policy Support
          </Link>
          <Link href="/faq" className="px-2 hover:underline text-accent-color">
            FAQ
          </Link>
        </span>
        <span>© 2025 Discreet</span>
      </footer>
    </div>
  );
};

export default Layout;
