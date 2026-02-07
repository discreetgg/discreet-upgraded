"use client";

import { SettingsNotificationsContent } from "@/components/settings-notifications-content";
import { SettingsProfileContent } from "@/components/settings-profile-content";
import { SettingsSave } from "@/components/settings-save";
import { SettingsSecurityContent } from "@/components/settings-security-content";
import { SettingsSubscriptionsContent } from "@/components/settings-subscriptions-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SETTINGS_TABS } from "@/constants/constants";
import { useSettingsTab } from "@/hooks/settings/use-settings-tab";

const validTabs = [
	"profile",
	"security",
	"notifications",
	// 'subscriptions',
] as const;

export const SettingsPageContent = () => {
	const [{ tab: currentTab }, setCurrentTab] = useSettingsTab();
	return (
		<div className="relative">
			<SettingsSave className="md:hidden absolute -top-16" />
			<Tabs
				value={currentTab}
				onValueChange={(value) => {
					setCurrentTab({
						tab: validTabs.includes(value as (typeof validTabs)[number])
							? value
							: "profile",
					});
				}}
				className="space-y-[31px] max-w-[791px] py-5 md:px-2"
			>
				<div className="flex items-center justify-between w-full relative gap-2 md:overflow-x-auto overflow-hidden">
					<TabsList className="bg-transparent  flex px-2 md:p-0 -mb-[1px] lg:gap-8 w-full gap-4 ">
						{SETTINGS_TABS.map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="py-4 px-[0px] gap-2  rounded-none flex shrink-0 items-center overflow-hidden justify-center !w-full bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
                          after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
                          data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
							>
								<tab.icon className="[.tab[data-state=active]_&]:hidden" />
								<tab.iconActive className="[.tab[data-state=inactive]_&]:hidden" />
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					<SettingsSave className="md:block hidden" />
				</div>

				<TabsContent value="profile" className="px-2 ">
					<SettingsProfileContent />
				</TabsContent>
				<TabsContent value="security" className="px-2">
					<SettingsSecurityContent />
				</TabsContent>
				<TabsContent value="notifications" className="px-2">
					<SettingsNotificationsContent />
				</TabsContent>
				<TabsContent value="subscriptions" className="px-2">
					<SettingsSubscriptionsContent />
				</TabsContent>
			</Tabs>
		</div>
	);
};
