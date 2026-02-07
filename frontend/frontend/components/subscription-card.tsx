import { UserType } from "@/types/global";
import { Button } from "./ui/button";
import { SUBSCRIPTION_PLAN_ICONS } from "@/constants/constants";
import { SubscriptionsCreatePlanDialog } from "./subscriptions-create-plan-dialog";
import { motion as m } from "motion/react";
import { Icon } from "./ui/icons";
import { SubscribePlanDialog } from "./subscribe-plan-dialog";

const COLORS = ["#E90074", "#009947", "#003EF3"];
export const SubscriptionCard = ({
	creator,
	currentUser,
	plan,
	index,
	user,
}: {
	plan: SubscriptionType["plans"][number];
	currentUser: UserType;
	creator: SubscriptionType["creator"];
	index: number;
	user: UserType;
}) => {
	const isCurrentUser = currentUser.discordId === creator.discordId;

	const SubIcon = SUBSCRIPTION_PLAN_ICONS.find((icon) => icon.id === plan.icon);
	return (
		<m.div
			layout
			layoutId={plan._id}
			className="flex items-center justify-between w-full py-[15px] pl-3.5 pr-8 bg-[#0F1114] border border-accent-gray/30 rounded-xl border-r-4 border-b-4 hover:border-b-[6px] hover:border-r-[6px] transition-all duration-150  shadow-[2px_2px_0_0_#1E1E21] relative overflow-hidden lg:h-[194px] lg:"
		>
			<div className="max-w-[204px] justify-between h-full flex flex-col">
				<div className="space-y-1">
					<h3 className="text-[#D4D4D8] text-[15px] font-bold capitalize">
						{plan.name}
					</h3>
					<p className="text-[#8A8C95] text-[15px] capitalize">
						{formatSubAmount(plan.amount)} monthly
					</p>
				</div>
				<p className="text-xs text-[#737682] line-clamp-3">
					{plan.description}
				</p>
				{isCurrentUser ? (
					<SubscriptionsCreatePlanDialog editData={plan} isUpdating>
						<Button
							className="px-4 w-fit   py-2 md:px-6 rounded-full border-none text-white bg-accent-gray"
							size={"ghost"}
						>
							Update
						</Button>
					</SubscriptionsCreatePlanDialog>
				) : (
					<SubscribePlanDialog
						creator={creator}
						plan={plan}
						color={COLORS[index % COLORS.length]}
						user={user}
						isGradient={index === 1}
						currentUser={currentUser}
					>
						<Button
							className="px-4 w-fit   py-2 md:px-6 rounded-full border-none text-white"
							size={"ghost"}
							style={{
								background: `${COLORS[index % COLORS.length]}`,
							}}
						>
							Subscribe
						</Button>
					</SubscribePlanDialog>
				)}
			</div>
			<div
				style={{
					background:
						index === 1
							? "linear-gradient(180deg,#FFE500,#009947)"
							: `${COLORS[index % COLORS.length]}`,
				}}
				data-border={index === 1}
				className="rounded-[16.364px] border-2 border-[#1E1E215F]  relative z-[1] size-[72px] flex items-center justify-center text-white data-[border=true]:border-0"
			>
				{SubIcon ? (
					<SubIcon.icon className="size-[26px]" />
				) : (
					<Icon.startSlash />
				)}
			</div>
			<div
				style={{ background: `${COLORS[index % COLORS.length]}` }}
				className="rounded-full size-[236px] blur-[94.80000305175781px] absolute right-[-60%] bottom-[-90%] z-[0]"
			/>
		</m.div>
	);
};

function formatSubAmount(amount: string) {
	const intAmount = Number(amount);
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return formatter.format(intAmount);
}
