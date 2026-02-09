"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TabLoadingSkeleton } from "@/components/tab-loading-skeleton";
import { useAuth } from "@/context/auth-context-provider";
import WalletContextProvider from "@/context/wallet-context-provider";
import { useRouter } from "@bprogress/next/app";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FundWalletDialog } from "@/components/fund-wallet-dialog";

import type React from "react";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		// Middleware handles route protection, but we still check here for client-side navigation
		if (!loading && !isAuthenticated) {
			toast.error("You are not logged in.");
			router.push("/auth");
		}
	}, [isAuthenticated, router, loading]);

	const isMessagePage =
		pathname.startsWith("/messages/") && pathname !== "/messages";
	const showRouteSkeleton = loading || !isAuthenticated;
	const skeletonVariant = isMessagePage ? "list" : "posts";

	return (
		<SidebarProvider className="max-w-360 md:px-4 mx-auto relative ">
			<WalletContextProvider>
				<AppSidebar />
				<SidebarInset className={cn(!isMessagePage && "pb-24 md:pb-0")}>
					{showRouteSkeleton ? (
						<TabLoadingSkeleton
							className="pt-4 md:pt-6"
							variant={skeletonVariant}
						/>
					) : (
						<Suspense
							fallback={
								<TabLoadingSkeleton
									className="pt-4 md:pt-6"
									variant={skeletonVariant}
								/>
							}
						>
							{children}
						</Suspense>
					)}
				</SidebarInset>
				<MobileNav />
				{isAuthenticated && <FundWalletDialog />}
			</WalletContextProvider>
		</SidebarProvider>
	);
}
