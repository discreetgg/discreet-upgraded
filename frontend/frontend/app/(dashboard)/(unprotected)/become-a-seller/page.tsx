import Link from 'next/link';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generateStaticPageMetadata({
  title: 'Become a Seller',
  description: 'Want to make more money? Become a seller, share your content, and start earning from your audience on Discreet.',
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/become-a-seller`,
  keywords: ['become seller', 'content creator', 'earn money', 'monetize content', 'creator platform'],
});

const Page = () => {
  return (
    <main className='relative pt-[88px] space-y-6'>
      <div className='max-w-[413px] w-full space-y-1'>
        <h1 className='text-3xl font-semibold text-[#F8F8F8] '>
          Become a Seller
        </h1>
        <p className='text-[#8A8C95]  font-light text-[15px] '>
          Want to make more money? Become a seller, share your content, and
          start earning from your audience.
        </p>
      </div>{' '}
      <Link
        href='/verify-age'
        className='rounded flex items-center w-max gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]'
      >
        Become a Seller
      </Link>
    </main>
  );
};

export default Page;
