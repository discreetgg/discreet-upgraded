"use client";
import React, { useState } from "react";
import { serverTopBar } from "@/lib/data";
import { useRouter } from "@bprogress/next/app";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "../ui/icons";
import { ServerSearch } from "../search/server-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "../ui/sidebar";
import { cn, pushUrl } from "@/lib/utils";
import Image from "next/image";

function ServerFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile, state } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    searchParams.get("language") || "Server Language"
  );

  return (
    <nav className="flex w-full items-stretch mt-4 lg:items-center pb-3  lg:justify-between lg:pb-[22.5px] gap-3 lg:gap-4.5 flex-col lg:flex-row">
      <div className="min-w-[300px] max-w-[300px] w-full">
        <button
          onClick={() => router.push("/")}
          type="button"
          data-home={pathname === "/"}
          className="flex gap-[6px] items-center justify-start data-[home=false]:cursor-pointer"
        >
          <Image src="/logo.png" height={41} width={41} alt="logo" />

          <p className="truncate font-medium text-[15px] w-full">DISCREET</p>
        </button>
      </div>
      <Tabs
        defaultValue={
          searchParams.get("period") ||
          serverTopBar.sub[0]?.link.replace("/", "")
        }
        className="w-full lg:w-auto"
      >
        <div className="w-full lg:w-auto justify-start rounded-none">
          <TabsList className="bg-transparent w-fit lg:w-fit h-auto p-0 cursor-pointer -mb-[1px] flex gap-4 lg:gap-[27px] border-b-0 overflow-x-auto whitespace-nowrap  no-scrollbar -mx-2 px-2">
            {serverTopBar.sub.map((item, index) => {
              const tabValue = item.link.replace("/", "");

              return (
                <TabsTrigger
                  key={item.title + index}
                  value={tabValue}
                  onClick={() => {
                    const params = new URLSearchParams(
                      Array.from(searchParams.entries())
                    );
                    // Only one query allowed: prefer tab for sub-nav
                    params.delete("q");
                    params.delete("tab");
                    params.set("period", tabValue);
                    const url = `${pathname}?${params.toString()}`;
                    pushUrl(url, router);
                  }}
                  className="py-[12px] w-fit lg:py-[16px] px-[14px] lg:px-[17px] gap-2 h-auto rounded-none flex items-center overflow-hidden justify-center bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[14px] lg:text-[18px] font-medium border-none tab
                  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%]
                  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
                >
                  {item.title}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>
      <ServerSearch
        placeholder="Search"
        className="w-full lg:max-w-[300px] lg:w-full 2xl:max-w-[380px]"
        syncQueryParam
      />
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full border border-border w-full lg:w-auto lg:min-w-[177px] justify-between lg:justify-center focus-visible:ring-1 focus-visible:ring-[#FF007F] focus-visible:outline-[#FF007F]  bg-transparent  px-[16px] py-[13px]  flex items-center gap-3  text-[15px]">
            <span>{selectedLanguage}</span>
            <Icon.chevronDown
              className={cn(
                "transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg p-0"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => {
              setSelectedLanguage("Server Language");
              setIsOpen(false);
              const params = new URLSearchParams(
                Array.from(searchParams.entries())
              );
              params.delete("language");
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            {selectedLanguage === "Server Language" ? (
              <Icon.radioActive />
            ) : (
              <Icon.radioInactive />
            )}
            All Languages
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => {
              setSelectedLanguage("English");
              setIsOpen(false);
              const params = new URLSearchParams(
                Array.from(searchParams.entries())
              );
              params.set("language", "English");
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            {selectedLanguage === "English" ? (
              <Icon.radioActive />
            ) : (
              <Icon.radioInactive />
            )}
            English
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => {
              setSelectedLanguage("French");
              setIsOpen(false);
              const params = new URLSearchParams(
                Array.from(searchParams.entries())
              );
              params.set("language", "French");
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            {selectedLanguage === "French" ? (
              <Icon.radioActive />
            ) : (
              <Icon.radioInactive />
            )}
            French
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />

          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => {
              setSelectedLanguage("German");
              setIsOpen(false);
              const params = new URLSearchParams(
                Array.from(searchParams.entries())
              );
              params.set("language", "German");
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            {selectedLanguage === "German" ? (
              <Icon.radioActive />
            ) : (
              <Icon.radioInactive />
            )}
            German
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem
            className="flex items-center gap-2 text-[15px] text-[#D4D4D8] m-0 rounded-none p-4"
            onClick={() => {
              setSelectedLanguage("Spanish");
              setIsOpen(false);
              const params = new URLSearchParams(
                Array.from(searchParams.entries())
              );
              params.set("language", "Spanish");
              const url = `${pathname}?${params.toString()}`;
              pushUrl(url, router);
            }}
          >
            {selectedLanguage === "Spanish" ? (
              <Icon.radioActive />
            ) : (
              <Icon.radioInactive />
            )}
            Spanish
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-0" />
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export { ServerFilterBar };
