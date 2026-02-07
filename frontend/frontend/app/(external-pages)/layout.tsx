"use client";
import { Nav } from "./_components/nav";
import { useState, useEffect } from "react";

export default function ExternalPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-[#0f1114]">
      <div className={`fixed top-0 left-0 w-full z-50 bg-[#0f1114]/80 backdrop-blur-md border-b border-[#1a1a1a] transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <Nav />
        </div>
      </div>
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
}
