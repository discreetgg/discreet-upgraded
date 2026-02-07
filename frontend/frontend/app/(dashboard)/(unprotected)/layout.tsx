"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type React from "react";
import { usePrefetchPages } from "@/hooks/use-prefetch-pages";
import { useGlobal } from "@/context/global-context-provider";
import { FundWalletDialog } from "@/components/fund-wallet-dialog";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { user } = useGlobal();

	// Prefetch all common pages in the background for instant navigation
	usePrefetchPages(user?.discordId);

	return (
		<SidebarProvider className="max-w-360 md:px-4 mx-auto relative ">
			<AppSidebar />
			<SidebarInset className="md:py-6 py-2 pb-24 lg:pb-6">
				{children}
			</SidebarInset>
			<MobileNav />
			<FundWalletDialog />
		</SidebarProvider>
	);
}
