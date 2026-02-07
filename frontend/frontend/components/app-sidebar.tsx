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
import { useWallet } from "@/context/wallet-context-provider";
import { sidebarData } from "@/lib/data";
import { cn, formatBalance, inDevEnvironment } from "@/lib/utils";
import type { SidebarItemType } from "@/types/global";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useEffect } from "react";
import { AppSidebarUser } from "./app-sidebar-user";
import { Icon } from "./ui/icons";
import { useRouter } from "@bprogress/next/app";
import useWindowWidth from "@/hooks/use-window-width";
import { ContentCreatorAddPostDialog } from "./content-creator-add-post-dialog";
import { useNotifications } from "@/hooks/queries/use-notifications";
import { useMessage } from "@/context/message-context";
import { getWalletService } from "@/lib/services";

// Format balance to match mobile nav display

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { isAuthenticated } = useAuth();
	const { user } = useGlobal();
	const { wallet, setWallet } = useWallet();
	const router = useRouter();
	const { setOpen } = useSidebar();

	const { data: notifications } = useNotifications({
		userId: user?.discordId || "",
		page: 1,
	});

	const { conversations } = useMessage();

	const getTotalUnreadConversations = (): number => {
		if (!conversations) return 0;
		return conversations.reduce((total, conversation) => {
			return total + (conversation.unreadCount || 0);
		}, 0);
	};

	const totalUnreadConversations = getTotalUnreadConversations();

	const windowWidth = useWindowWidth();
	const LG_SCREEN = windowWidth >= 1024;

	// Fetch wallet balance on mount and when user changes
	useEffect(() => {
		if (!user?.discordId) return;

		(async () => {
			try {
				const walletData = await getWalletService(user.discordId);
				setWallet(walletData);
			} catch (error: any) {
				if (error.response?.status !== 404 && error.status !== 404) {
					console.error("Failed to fetch wallet:", error);
				}
			}
		})();
	}, [user?.discordId, setWallet]);

	const getButtonClasses = (active: boolean) =>
		active
			? "hover:-translate-y-1 transition-transform duration-500 delay-150 ease-in-out"
			: "text-[#A1A1AA] group/nav";

	const getIconClasses = (active: boolean) =>
		active
			? "border-[#FF0065]  bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF0065]"
			: "border-transparent bg-transparent text-[#A1A1AA] group-hover/nav:border-[#A1A1AA] group-hover/nav:bg-[#0A0A0A] group-hover/nav:shadow-[2px_2px_0_0_#A1A1AA] transition duration-300 delay-150";

	const getTextClasses = (active: boolean) =>
		active
			? "border-[#FF0065]  px-4 py-[9.5px] bg-[#0A0A0A] shadow-[2px_2px_0_0_#FF0065] text-white"
			: "border-transparent bg-transparent text-[#A1A1AA] ";

	const shouldShowItem = (item: SidebarItemType) => {
		if (!isAuthenticated) {
			return item.isPublic;
		}

		return (
			item?.role === "all" || item?.role === user?.role || inDevEnvironment
		);
	};

	return (
		<Sidebar
			collapsible="icon"
			variant="floating"
			className="bg-transparent gap-6 py-9 sticky "
			{...props}
		>
			<SidebarHeader className="flex flex-row gap-[11px] items-center">
				<SidebarMenu>
					<SidebarMenuItem className="flex flex-row gap-[11px] items-center ">
						<button
							onClick={() => router.push("/")}
							type="button"
							data-home={pathname === "/"}
							className="flex gap-[6px] items-center w-full data-[home=false]:cursor-pointer"
						>
							<Image src="/logo.png" height={41} width={41} alt="logo" />

							<p className="truncate font-medium text-[15px] w-full">
								DISCREET
							</p>
						</button>
						{LG_SCREEN && (
							<SidebarTrigger className="bg-[#1E1E21] z-[1] p-1 rounded-full group-data-[collapsible=icon]:mr-2! group-data-[collapsible=icon]:rotate-180" />
						)}
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className="gap- py-6 ">
				<SidebarGroup>
					<SidebarMenu>
						{sidebarData.main.filter(shouldShowItem).map((item) => {
							const active = pathname === item.url;
							if (item.url === "/wallet") {
								return (
									<SidebarMenuItem
										key={item.name}
										data-disabled={item.isDisabled}
										data-public={item.isPublic}
										data-authenticated={!isAuthenticated}
										className="data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
									>
										<SidebarMenuButton
											asChild
											disabled={item.isDisabled}
											tooltip={item.name}
										>
											<Link
												href={item.url}
												className={cn(
													"h-auto flex items-center hover:bg-transparent active:bg-transparent group cursor-pointer",
													getButtonClasses(active)
												)}
											>
												<div
													className={cn(
														"p-2 rounded border group-data-[collapsible=icon]:p-0!",
														getIconClasses(active)
													)}
												>
													{item.icon && (
														<item.icon
															stroke={active ? "white" : "#8A8C95"}
															className="shrink-0 !size-6 "
														/>
													)}
												</div>
												<span
													className={cn(
														"text-[15px] rounded border font-medium",
														getTextClasses(active)
													)}
												>
													{item.name}
													<span className="text-[#FF0065] ml-2">
														$
														{wallet?.balance
															? formatBalance(wallet.balance)
															: "0"}
													</span>
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							}
							return (
								<SidebarMenuItem
									key={item.name}
									data-disabled={item.isDisabled}
									data-public={item.isPublic}
									data-authenticated={!isAuthenticated}
									className="data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
								>
									<SidebarMenuButton
										disabled={item.isDisabled}
										asChild
										tooltip={item.name}
									>
										<Link
											href={item.url}
											className={cn(
												"h-auto flex items-center hover:bg-transparent active:bg-transparent group cursor-pointer",
												getButtonClasses(active)
											)}
										>
											<div
												className={cn(
													"p-2 rounded border group-data-[collapsible=icon]:p-0.5! relative",
													getIconClasses(active)
												)}
											>
												{item.icon && (
													<item.icon
														stroke={active ? "white" : "#8A8C95"}
														className="shrink-0 !size-6 "
													/>
												)}
												{item.name.toLocaleLowerCase() == "notifications" &&
													notifications &&
													notifications.unreadCount > 0 && (
														<div className="w-[17px] h-[13px] rounded-[80px] z-10 bg-[#FF007F] absolute -right-[8px] -top-[4px] flex items-center text-[8px] text-white font-medium justify-center">
															{notifications?.unreadCount}
														</div>
													)}
												{item.name.toLocaleLowerCase() == "messages" &&
													totalUnreadConversations > 0 && (
														<div className="w-[17px] h-[13px] rounded-[80px] z-10 bg-[#FF007F] absolute -right-[8px] -top-[4px] flex items-center text-[8px] text-white font-medium justify-center">
															{totalUnreadConversations > 99
																? "99+"
																: totalUnreadConversations}
														</div>
													)}
											</div>

											<span
												className={cn(
													"text-[15px] rounded border font-medium",
													getTextClasses(active)
												)}
											>
												{item.name}
											</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<Icon.separator className="mx-2" />
					<SidebarMenu>
						{sidebarData.creator.filter(shouldShowItem).map((item) => {
							const active = pathname === item.url;

							return (
								<SidebarMenuItem
									key={item.name}
									data-disabled={item.isDisabled}
									data-public={item.isPublic}
									data-authenticated={!isAuthenticated}
									className="data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
								>
									<SidebarMenuButton
										asChild
										disabled={item.isDisabled}
										tooltip={item.name}
									>
										<Link
											href={item.url}
											className={cn(
												"h-auto flex items-center hover:bg-transparent active:bg-transparent group cursor-pointer",
												getButtonClasses(active)
											)}
										>
											<div
												className={cn(
													"p-2 rounded border group-data-[collapsible=icon]:p-0!",
													getIconClasses(active)
												)}
											>
												{item.icon && (
													<item.icon
														stroke={active ? "white" : "#8A8C95"}
														className="shrink-0 !size-6 "
													/>
												)}
											</div>

											<span
												className={cn(
													"text-[15px] rounded border font-medium",
													getTextClasses(active)
												)}
											>
												{item.name}
											</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarMenu>
						{isAuthenticated && user?.role === "seller" && (
							<SidebarMenuItem>
								<ContentCreatorAddPostDialog>
									<SidebarMenuButton asChild tooltip="Post">
										<Link
											href="#"
											className={cn(
												"h-auto flex items-center gap-4 hover:bg-transparent active:bg-transparent group cursor-pointer",
												"hover:-translate-y-1 transition-transform duration-500 delay-150 ease-in-out"
											)}
										>
											<div
												className={cn(
													"p-2 rounded border group-data-[collapsible=icon]:p-0!",
													"border-[#1F2227] bg-[#0A0A0B] shadow-[2px_2px_0_0_#1F2227]"
												)}
											>
												<Icon.add className="shrink-0 !size-6 " />
											</div>

											<span
												className={cn(
													"text-[15px] rounded font-medium text-[#A1A1AA]"
												)}
											>
												Post
											</span>
										</Link>
									</SidebarMenuButton>
								</ContentCreatorAddPostDialog>
							</SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			{isAuthenticated && (
				<SidebarFooter>
					<AppSidebarUser />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
