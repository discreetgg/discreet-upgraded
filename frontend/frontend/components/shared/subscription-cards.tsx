"use client";

import EmptySkeletonCard from "../ui/empty-skeleton-card";
import { useGlobal } from "@/context/global-context-provider";
import { toast } from "sonner";
import { useRouter } from "@bprogress/next/app";
import { SubscriptionCard } from "../subscription-card";
import { useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { UserType } from "@/types/global";

interface Props {
	subData?: SubscriptionType;
	user: UserType;
}

export default function SubscriptionCards({ subData, user }: Props) {
	const { user: currentUser } = useGlobal();

	const router = useRouter();

	const sortedPlans = useMemo(() => {
		if (!subData) return [];
		return [...subData.plans].sort(
			(a, b) => Number(a.amount) - Number(b.amount)
		);
	}, [subData]);

	if (!subData || subData.plans.length === 0) {
		return (
			<div className="space-y-[18px]">
				<EmptySkeletonCard />
				<EmptySkeletonCard />
			</div>
		);
	}
	if (!currentUser) {
		toast.error("UNAUTHORIZED: You are not logged in");
		router.push("/");
		return null;
	}
	return (
		<div data-vertical-mask className="w-full flex flex-col gap-y-3 pt-3 pb-8">
			<AnimatePresence>
				{sortedPlans.map((plan, idx) => (
					<SubscriptionCard
						key={plan._id}
						currentUser={currentUser}
						plan={plan}
						creator={subData.creator}
						index={idx}
						user={user}
					/>
				))}
			</AnimatePresence>
		</div>
	);
}
