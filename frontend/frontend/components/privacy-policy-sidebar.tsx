"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PrivacyPolicySidebarProps {
  headers: string[];
  className?: string;
}

export function PrivacyPolicySidebar({ headers, className }: PrivacyPolicySidebarProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [previousActiveSection, setPreviousActiveSection] = useState<string>("");
  const [isManualScroll, setIsManualScroll] = useState<boolean>(false);

  // Function to scroll to a specific section
  const scrollToSection = (header: string) => {
    setIsManualScroll(true);
    const sectionId = header.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // Reset manual scroll flag after a delay to allow the scroll to complete
    setTimeout(() => {
      setIsManualScroll(false);
    }, 1000);
  };

  // Function to get section ID from header text
  const getSectionId = (header: string) => {
    return header.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  };

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = headers.map(header => ({
        id: getSectionId(header),
        element: document.getElementById(getSectionId(header))
      })).filter(section => section.element);

      const scrollPosition = window.scrollY + 50; // Offset for better UX

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          // Only update if the active section is actually changing
          if (activeSection !== section.id) {
            setPreviousActiveSection(activeSection);
            setActiveSection(section.id);
          }
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once to set initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headers]);

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

  return (
    <div className={cn("relative h-full z-10 pt-16 overflow-y-auto ", className)}>
      <div className="h-full">
        <nav className="flex flex-col justify-between pb-12 h-full gap-3 relative">
          {headers.map((header, index) => {
            const sectionId = getSectionId(header);
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
        </nav>
      </div>
    </div>
  );
}
