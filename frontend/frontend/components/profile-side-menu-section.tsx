"use client";

import { Icon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ProfileSideMenuMenuContent } from "./profile-side-menu-menu-content";
import { useGlobal } from "@/context/global-context-provider";
import { logoutUserService } from "@/lib/services";
import { useRouter } from "@bprogress/next/app";
import { useMenuItemFilters } from "@/hooks/filters/menu-item-filters";

export const ProfileSideMenuSection = () => {
	const { user } = useGlobal();
	const router = useRouter();
	const [activeTab, setActiveTab] = useMenuItemFilters();

	if (!user) {
		router.push("/login");
		logoutUserService();
	}
	if (user?.role === "buyer") return null;
	return (
		<section className="space-y-[31px] py-6 hidden lg:block sticky top-2 h-[calc(100vh-5rem)] overflow-y-auto hidden_scrollbar w-full max-w-[411px]">
			<Tabs
				onValueChange={(val) =>
					setActiveTab({
						menuTab: val,
					})
				}
				value="menu"
			>
				<div className="border-b-2 border-b-accent-gray w-full justify-start rounded-none">
					<TabsList className="bg-transparent w-full h-auto  p-0 -mb-[1px]">
						{/* <TabsTrigger
							value="subscription"
							className="py-[16px] px-[17px] gap-2 h-auto rounded-none flex items-center overflow-hidden justify-center !w-full bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%]
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
						>
							<Icon.star className="[.tab[data-state=active]_&]:hidden" />
							<Icon.subscriptionActive className="[.tab[data-state=inactive]_&]:hidden" />
							Subscription
						</TabsTrigger> */}
						<TabsTrigger
							value="menu"
							className="py-[16px] px-[17px] gap-2 h-auto rounded-none overflow-hidden !w-full flex-1 bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:-translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
						>
							<Icon.menu className="[.tab[data-state=active]_&]:hidden" />
							<Icon.menuActive className="[.tab[data-state=inactive]_&]:hidden" />
							Menu
						</TabsTrigger>
					</TabsList>
				</div>
				<div className="">
					{/* <TabsContent
						value="subscription"
						className="h-full flex items-center justify-center"
					>
						{user && <ProfileSideMenuSubscriptionContent user={user} />}
					</TabsContent> */}
					<TabsContent value="menu">
						{user && <ProfileSideMenuMenuContent user={user} />}
					</TabsContent>
				</div>
			</Tabs>
			<footer className="flex gap-5 items-center justify-center">
				<Link
					href="#"
					className="text-[#737682] text-[15px] hover:underline hover:text-white"
				>
					Privacy
				</Link>
				<Link
					href="#"
					className="text-[#737682] text-[15px] hover:underline hover:text-white"
				>
					Terms of Service
				</Link>
				<Link
					href="#"
					className="text-[#737682] text-[15px] hover:underline hover:text-white"
				>
					Contact us
				</Link>
			</footer>
		</section>
	);
};
