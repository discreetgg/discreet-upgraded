import { UserType } from "@/types/global";
import { useSubscription } from "@/hooks/queries/use-subscription";
import { useGlobal } from "@/context/global-context-provider";
import { toast } from "sonner";
import { useRouter } from "@bprogress/next/app";
import EmptySkeletonCard from "./ui/empty-skeleton-card";
import { SubscriptionsCreatePlanDialog } from "./subscriptions-create-plan-dialog";
import SubscriptionCards from "./shared/subscription-cards";
import { Icon } from "./ui/icons";
import { Button } from "./ui/button";

export const ProfileSideMenuSubscriptionContent = ({
	user,
}: {
	user: UserType;
}) => {
	const router = useRouter();
	const { user: currentUser } = useGlobal();
	const { data: subscription, isLoading } = useSubscription(user.discordId);
	const isCurrentUser = currentUser?.discordId === user.discordId;

	if (!currentUser) {
		toast.error("UNAUTHORIZED: You are not logged in");
		router.push("/");
		return null;
	}
	if (isLoading) {
		return (
			<div className="space-y-[18px] animate-pulse w-full">
				<EmptySkeletonCard />
				<EmptySkeletonCard />
			</div>
		);
	}
	const planCount = subscription?.plans?.length || 0;
	return (
		<div className=" relative w-full">
			{isCurrentUser && planCount < 3 && (
				<div className="flex w-full items-center justify-between">
					<span className="text-[#D4D4D8] font-medium block truncate">
						{isCurrentUser ? "My" : user.displayName} Subscription
						{subscription?.plans && subscription?.plans?.length > 1 && "s"}
					</span>
					<SubscriptionsCreatePlanDialog>
						<Button className="rounded flex items-center  border hover:bg-transparent active:bg-transparent h-auto  py-2 text-[15px] font-medium cursor-pointer whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] text-xs px-2 gap-2">
							Create a Plan
							<Icon.addCircle />
						</Button>
					</SubscriptionsCreatePlanDialog>
				</div>
			)}
			<SubscriptionCards subData={subscription} user={user} />
		</div>
	);
};
