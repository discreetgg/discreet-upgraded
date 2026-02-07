import React from 'react'
import PartnersTab from './_components/partners-tab'
import { Icon } from '@/components/ui/icons';
import { generateStaticPageMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';

export const metadata: Metadata = generateStaticPageMetadata({
  title: 'Partners Earnings',
  description: 'Join the Discreet partner program and start earning from referrals and community building.',
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/partners`,
  keywords: ['partners', 'affiliate program', 'referrals', 'earn money', 'partner earnings'],
});

const Page = () => {
    return (
        <div className='space-y-6'>
            <div className=' flex items-center justify-between'>
                <h1 className='font-semibold text-white text-[32px] font-semibold tracking-[0.5px] '>Partners Earnings</h1>
                <button className='text-[#8A8C95] p-2.5 bg-[#16161A] rounded-[10px] text-[15px] font-light flex items-center gap-[14.67px]'>@discreet.gg <Icon.logout fill='#D4D4D8' width={20} height={20} /></button>
            </div>
            <PartnersTab />
        </div>
    )
}

export default Page;