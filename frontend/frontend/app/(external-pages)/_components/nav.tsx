"use client";
import Link from "next/link";
import React, { useState, useEffect } from 'react'
import { useRouter } from '@bprogress/next/app'
import Image from 'next/image'

export const Nav = () => {
    const router = useRouter();
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setShowScrollTop(scrollTop > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
       
            <nav className="flex w-full justify-between items-center py-3 lg:py-[22.5px] relative">
                <button
                    onClick={() => router.push("/")}
                    type="button"
                    className="flex gap-[6px] items-center justify-start data-[home=false]:cursor-pointer"
                >
                    <Image src="/logo.png" height={41} width={41} alt="logo" />

                    <p className="truncate font-medium text-[15px] w-full">DISCREET</p>
                </button>
                <Link
                    href={"/"}
                    className="rounded flex items-center w-max gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]"
                >
                    Get Started
                </Link>
            </nav>
            
    )
}