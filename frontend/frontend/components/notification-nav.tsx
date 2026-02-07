"use client";
import React, { useMemo } from 'react'
import { notificationNav } from '@/lib/data'
import { Button } from './ui/button'
import { cn, pushUrl } from '@/lib/utils'
import { useRouter } from '@bprogress/next/app'
import { useSearchParams } from 'next/navigation'
import { GlobalSearch } from './search/global-search';
import { useGlobal } from '@/context/global-context-provider';


export const NotificationNav = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'all';
    const activeTabIndex = notificationNav.findIndex(item => {
        const itemTab = item.link.split('tab=')[1];
        return itemTab === tab;
    });
    const { user } = useGlobal();
    const IsSeller = user?.role === 'seller';
    const filtednotificationNav = useMemo(() => {
        if (!IsSeller) {
            return notificationNav.filter((item) => item.title.toLowerCase() !== 'tips' && item.title.toLowerCase() !== 'menu');
        }
        return notificationNav;
    }, [IsSeller]);
    return (
        <nav className="flex shrink-0 transition-[width,height] gap-6 ease-linear sticky top-0  bg-background pt-2 lg:mt-2 z-50">
            <div className='flex items-center gap-2 max-w-[560px] w-full bg-[#111316] '>
            {filtednotificationNav.map((item, index) => {
                const isActive = activeTabIndex === index;
                return (
                   <Button
                   key={item.title}
                   type="button"
                   className={cn(
                       "rounded border h-auto px-3 py-2 text-sm lg:px-4 lg:py-3.5 lg:text-[15px] font-medium whitespace-nowrap bg-[#0A0A0B] text-[#F8F8F8] w-fit transition-all duration-200 ease-in-out",
                       "hover:bg-[#1A1A1B] hover:border-[#FF007F]/50 hover:shadow-[2px_2px_0_0_#FF007F]/30",
                       "active:scale-[0.98] active:shadow-[1px_1px_0_0_#FF007F]/30 active:translate-x-[1px] active:translate-y-[1px]",
                       isActive ? "border-[#FF007F] shadow-[2px_2px_0_0_#FF007F] hover:shadow-[2px_2px_0_0_#FF007F]  hover:border-[#FF007F] hover:bg-[#0A0A0B]  " : "border-[#1E1E21] shadow-[2px_2px_0_0_#1E1E21]"
                   )}
                   onClick={() => pushUrl(`/notifications${item.link}`, router)}
                   aria-current={isActive ? 'page' : undefined}
                 >
                   {item.title}
                 </Button>
                );
      })}
      </div>
      {/* <div className='mt-6'/> */}
  <GlobalSearch />
      
    </nav>
  );
};