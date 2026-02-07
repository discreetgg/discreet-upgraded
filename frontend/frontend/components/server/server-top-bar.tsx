"use client";
import React, { useState } from "react";
import { serverTopBar } from "@/lib/data";
import { useRouter } from "@bprogress/next/app";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "../ui/button";
import { Icon } from "../ui/icons";
import { SubmitServerDialog } from "./submit-sever-dialog";
import { AuthPromptDialog } from "../auth-prompt-dialog";
import { useAuth } from "@/context/auth-context-provider";
import { useInfiniteServers } from "@/hooks/server/use-infinite-servers";

function ServerTopBar() {
  const { refreshServers } = useInfiniteServers();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="flex w-full justify-between items-center py-3 lg:py-[22.5px] relative">
      <button
        onClick={() => router.push("/")}
        type="button"
        data-home={pathname === "/"}
        className="flex gap-[6px] items-center justify-start data-[home=false]:cursor-pointer"
      >
        <Image src="/logo.png" height={41} width={41} alt="logo" />

        <p className="truncate font-medium text-[15px] w-full">DISCREET</p>
      </button>
      {/* Desktop nav */}
      <div className="hidden lg:flex gap-4 lg:gap-[27px] items-center text-[#8A8C95] text-[15px] font-medium lg:text-[18px]">
        {serverTopBar.main.map((item, index) => (
          <button
            key={item.title + index}
            onClick={() => router.push(item.link)}
            className="text-[15px] font-medium"
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="flex gap-4 items-center text-[#8A8C95] text-[15px] font-medium lg:text-[18px] lg:gap-[50px]">
        {isAuthenticated ? (
          <SubmitServerDialog refreshServers={refreshServers}>
            <Button
              type="button"
              className="rounded border hover:bg-transparent active:bg-transparent h-auto px-3 py-2 text-sm lg:px-4 lg:py-3.5 lg:text-lg  font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-fit"
            >
              Submit Server
            </Button>
          </SubmitServerDialog>
        ) : (
          <Button
            type="button"
            className="rounded border hover:bg-transparent active:bg-transparent h-auto px-3 py-2 text-sm lg:px-4 lg:py-3.5 lg:text-lg  font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-fit"
            onClick={() => router.push("/auth")}
          >
            Submit Server
          </Button>
        )}
        <div className="hidden lg:flex gap-2 items-center lg:gap-[27px]">
          <Icon.discordIcon />
          <Icon.twitter />
        </div>
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md border border-[#232323]"
          aria-label="Toggle menu"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          {isMenuOpen ? <Icon.menuActive /> : <Icon.menu />}
        </button>
      </div>
      {/* Mobile dropdown menu */}
      {isMenuOpen ? (
        <div className="lg:hidden absolute top-full left-0 right-0 mt-2 z-50">
          <div className="mx-2 rounded-xl border border-[#232323] bg-[#0A0A0B] shadow-lg p-3 space-y-2">
            <div className="flex flex-col gap-2 text-[#8A8C95] text-[15px] font-medium">
              {serverTopBar.main.map((item, index) => (
                <button
                  key={item.title + index}
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push(item.link);
                  }}
                  className="w-full text-left px-2 py-2 rounded hover:bg-white/5"
                >
                  {item.title}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#232323]">
              <div className="flex gap-3 items-center">
                <Icon.discordIcon />
                <Icon.twitter />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export { ServerTopBar };
