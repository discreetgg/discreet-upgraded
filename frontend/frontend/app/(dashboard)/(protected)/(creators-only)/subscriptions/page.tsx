"use client";

import { AudienceContent } from "@/components/audience-content";
import { SubscriptionsContent } from "@/components/subscriptions-content";
import { SubscriptionsCreatePlanDialog } from "@/components/subscriptions-create-plan-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobal } from "@/context/global-context-provider";
import { useSubscription } from "@/hooks/queries/use-subscription";
import { notFound } from "next/navigation";

const Page = () => {
	const { user: currentUser } = useGlobal();
	const { data: subscription, isLoading } = useSubscription(
		currentUser?.discordId ?? ""
	);
	const planCount = subscription?.plans?.length || 0;

	return notFound();
	return (
		<div className="py-6">
			<main className="relative pt-[88px] space-y-6">
				<div className="max-w-[413px] w-full space-y-1">
					<h1 className="text-3xl font-semibold text-[#F8F8F8] ">
						Subscriptions & Audience
					</h1>
					<p className="text-[#8A8C95]  font-light text-[15px] ">
						Your control center to manage content, earnings, and interactions
						with your audience.
					</p>
				</div>
				<Tabs
					defaultValue="subscriptions"
					className="space-y-[31px] max-w-[791px]"
				>
					<div className="flex items-center justify-between">
						<TabsList className="bg-transparent  h-auto  p-0 -mb-[1px] gap-8">
							<TabsTrigger
								value="subscriptions"
								className="py-[16px] px-[0px] gap-2 h-auto rounded-none flex items-center overflow-hidden justify-start !w-full min-w-[121px] bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
                        after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
                        data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
							>
								<Icon.star className="[.tab[data-state=active]_&]:hidden" />
								<Icon.subscriptionMenuActive className="[.tab[data-state=inactive]_&]:hidden" />
								Subscriptions
							</TabsTrigger>
							<TabsTrigger
								value="audience"
								className="py-[16px] px-[0px] gap-2 h-auto rounded-none overflow-hidden w-max flex-1 bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-[15px] font-medium border-none tab
                        after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-full after:h-[2px] after:bg-[#FF007F] after:left-[20%] 
                        data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-[-20%] after:-translate-x-[170%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
							>
								<Icon.menuAudience className="[.tab[data-state=active]_&]:hidden" />
								<Icon.menuAudienceActive className="[.tab[data-state=inactive]_&]:hidden" />
								Audience
							</TabsTrigger>
						</TabsList>
						{!isLoading && planCount < 3 ? (
							<SubscriptionsCreatePlanDialog>
								<Button className="rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium cursor-pointer whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] ">
									Create a Plan
									<Icon.addCircle />
								</Button>
							</SubscriptionsCreatePlanDialog>
						) : null}
					</div>
					<TabsContent value="subscriptions">
						<SubscriptionsContent />
					</TabsContent>
					<TabsContent value="audience">
						<AudienceContent />
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
};

export default Page;
