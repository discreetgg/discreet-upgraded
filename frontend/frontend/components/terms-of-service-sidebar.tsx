"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TermsOfServiceSidebarProps {
  headers: string[];
}

export function TermsOfServiceSidebar({ headers }: TermsOfServiceSidebarProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [previousActiveSection, setPreviousActiveSection] = useState<string>("");
  const [isManualScroll, setIsManualScroll] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only update if the active section is actually changing
            if (activeSection !== entry.target.id) {
              setPreviousActiveSection(activeSection);
              setActiveSection(entry.target.id);
            }
          }
        });
      },
      {
        rootMargin: "0% 0% -80% 0%",
      }
    );

    // Observe all section headers
    headers.forEach((header) => {
      const element = document.getElementById(header.toLowerCase().replace(/\s+/g, "-"));
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headers, activeSection]);

  // Scroll active sidebar item into view (only when not manually scrolling)
  // useEffect(() => {
  //   if (activeSection && !isManualScroll) {
  //     const activeButton = document.querySelector(`[data-section-id="${activeSection}"]`);
  //     if (activeButton) {
  //       activeButton.scrollIntoView({
  //         behavior: "smooth",
  //         block: "center",
  //       });
  //     }
  //   }
  // }, [activeSection, isManualScroll]);

  const scrollToSection = (sectionId: string) => {
    setIsManualScroll(true);
    const element = document.getElementById(sectionId.toLowerCase().replace(/\s+/g, "-"));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    // Reset manual scroll flag after a delay to allow the scroll to complete
    setTimeout(() => {
      setIsManualScroll(false);
    }, 1000);
  };

  return (
    <div className=" space-y-2 pt-16 h-full z-10 relative overflow-y-auto ">
      {headers.map((header, index) => {
        const sectionId = header.toLowerCase().replace(/\s+/g, "-");
        const isActive = activeSection === sectionId;
        const isPreviousActive = previousActiveSection === sectionId;
        
        return (
            <button
            key={index}
            data-section-id={sectionId}
            onClick={() => scrollToSection(header)}
            className={cn(
              "block w-full text-left cursor-pointer outline-0 border-0 relative px-3 py-2  transition-all duration-300  rounded-md text-sm  after:content-[] after:absolute after:bg-[#b3b3b3]/30 after:h-full after:w-[1px] after:left-0 after:top-0",
              "",
              isActive 
                ? " text-[#ff007f] " 
                : "text-[#b3b3b3] hover:text-white/60"
            )}
          >

            {isActive ? (
              <div className="privacy_policy_side_bar_active"></div>
            ) : isPreviousActive ? (
              <div className="privacy_policy_side_bar_previous_active"></div>
            ) : (
              <div className="privacy_policy_side_bar_inactive"></div>
            )}
            {header}
          </button>
        );
      })}
    </div>
  );
}
