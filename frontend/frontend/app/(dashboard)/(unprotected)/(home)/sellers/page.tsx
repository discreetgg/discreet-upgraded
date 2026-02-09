"use client";

import { ComponentLoader } from "@/components/ui/component-loader";
import { Suspense, useMemo } from "react";
import { getCreatorsService } from "@/lib/services";
import type { UserType } from "@/types/global";
import { SellersFilterBar, SellersGrid } from "@/components/sellers";
import { useEffect, useState } from "react";
import { sellerSortOptions } from "@/lib/data";
import { useSearchParams } from "next/navigation";
import { TabLoadingSkeleton } from "@/components/tab-loading-skeleton";

const shuffleArray = <T,>(array: T[]): T[] => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

const SellersContent = ({ creators }: { creators: UserType[] | null }) => {
	const searchParams = useSearchParams();
	const selectedSort = searchParams.get("sort");
	const randomSeed = searchParams.get("randomSeed");

	const sortedCreators = useMemo(() => {
		if (!creators) return null;

		const sortMode = selectedSort?.toLowerCase();
		const sorted = [...creators];

		if (sortMode === "random") {
			return shuffleArray(sorted);
		}

		if (sortMode === "rank") {
			sorted.sort((a, b) => {
				const rankDelta = (b.followerCount || 0) - (a.followerCount || 0);
				if (rankDelta !== 0) return rankDelta;
				return a.username.localeCompare(b.username);
			});
			return sorted;
		}

		return sorted;
	}, [creators, selectedSort, randomSeed]);

	return <SellersGrid creators={sortedCreators} />;
};

const Page = () => {
	const [creators, setCreators] = useState<UserType[] | null>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			await getCreatorsService()
				.then((response) => {
					setCreators(response);
				})
				.catch((error) => {
					console.error("Error fetching creators:", error);
				})
				.finally(() => {
					setLoading(false);
				});
		})();
	}, []);

	if (loading) {
		return <TabLoadingSkeleton showFilterRow variant="grid" />;
	}

	return (
		<div>
			<Suspense>
				<SellersFilterBar sortOptions={sellerSortOptions} />
			</Suspense>
			<Suspense fallback={<ComponentLoader />}>
				<SellersContent creators={creators} />
			</Suspense>
		</div>
	);
};

export default Page;
