"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { sidebarData } from "@/lib/data";
import { cn, inDevEnvironment } from "@/lib/utils";
import type { SidebarItemType } from "@/types/global";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type * as React from "react";
import { useEffect } from "react";
import { useRouter } from "@bprogress/next/app";
import useWindowWidth from "@/hooks/use-window-width";
import { ServerTab } from ".";
import { useTags } from "@/hooks/server/use-tags";

export function ServerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { user } = useGlobal();
  const router = useRouter();
  const { setOpen } = useSidebar();
  const { tags, isLoading, loadTags } = useTags();

  const windowWidth = useWindowWidth();
  const LG_SCREEN = windowWidth >= 1024;

  useEffect(() => {
    if (windowWidth < 1536) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [windowWidth]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="bg-transparent gap-6 sticky group-data-[collapsible=icon]:min-w-0 2xl:min-w-[333px] min-w-[300px] px-0"
      {...props}
    >
      <SidebarHeader className="flex flex-row gap-[11px] items-center justify-between  w-full px-0">
        <SidebarMenu className="flex flex-row gap-[11px] items-center w-full justify-between">
          <span className="text-[16px] group-data-[collapsible=icon]:hidden lg:text-[22px] text-[#E8E8E8] font-[600]">
            Server Categories 🔥
          </span>
          <SidebarMenuItem className="flex flex-row gap-[11px] items-start ">
            {LG_SCREEN && (
              <SidebarTrigger className="bg-[#1E1E21] z-[1]  rounded-full group-data-[collapsible=icon]:mr-2! group-data-[collapsible=icon]:rotate-180" />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <div className="gap-[7px] capitalize flex-row h-fit items-start justify-start group-data-[collapsible=icon]:hidden gap-y-2 py-6 flex w-full flex-wrap px-0">
        {isLoading ? (
          <span className="text-xs text-[#8A8C95]">Loading tags…</span>
        ) : tags.filter((t) => t.count > 0).length === 0 ? (
          <span className="text-xs text-[#8A8C95]">No tags found</span>
        ) : (
          [
            {
              tag: "all",
              count: 0,
            },
            ...tags,
          ].map((t) => (
            <ServerTab
              key={t.tag}
              name={t.tag}
              className="h-fit capitalize"
              sub={String(t.count)}
              active={
                t.tag === (searchParams.get("tab") ?? pathname.split("/")[2])
              }
            />
          ))
        )}
      </div>
    </Sidebar>
  );
}
