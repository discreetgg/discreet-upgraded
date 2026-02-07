"use client";

import { ComponentLoader } from "@/components/ui/component-loader";
import { Suspense, useMemo } from "react";
import { getCreatorsService } from "@/lib/services";
import type { UserType } from "@/types/global";
import { SellersFilterBar, SellersGrid } from "@/components/sellers";
import { useEffect, useState } from "react";
import { raceOptions, sortOptions } from "@/lib/data";
import { useSearchParams } from "next/navigation";

const getRaceMatches = (raceParam: string): string[] => {
	const normalized = raceParam.toLowerCase().trim();
	
	const raceMap: Record<string, string[]> = {
		asian: ["asian"],
		black: ["black", "african_black", "african"],
		latino: ["latino", "hispanic_latino", "hispanic"],
		arab: ["arab", "arabic", "middle_eastern"],
		indian: ["indian", "indigenous_native", "indigenous", "native"],
		pacific: ["pacific", "pacific_islander"],
		white: ["white", "white_caucasian", "caucasian"],
		mixed: ["mixed", "mixed_race"],
	};

	return raceMap[normalized] || [normalized];
};

const matchesRace = (userRace: string | null, selectedRace: string): boolean => {
	if (!userRace) return false;
	
	const userRaceLower = userRace.toLowerCase().trim();
	const selectedRaceLower = selectedRace.toLowerCase().trim();
	const possibleMatches = getRaceMatches(selectedRace);
	if (userRaceLower === selectedRaceLower) {
		return true;
	}
	return possibleMatches.some(match => {
		const matchLower = match.toLowerCase();
		if (userRaceLower === matchLower) {
			return true;
		}
		if (userRaceLower.replace(/[_-]/g, '') === matchLower.replace(/[_-]/g, '')) {
			return true;
		}
		if (userRaceLower.includes(matchLower) || matchLower.includes(userRaceLower)) {
			return true;
		}
		return false;
	});
};

const SellersContent = ({ creators }: { creators: UserType[] | null }) => {
	const searchParams = useSearchParams();
	const selectedRace = searchParams.get("race");

	const filteredCreators = useMemo(() => {
		if (!creators) return null;
		
		if (!selectedRace) {
			return creators;
		}

		return creators.filter((creator) => 
			matchesRace(creator.race, selectedRace)
		);
	}, [creators, selectedRace]);

	return <SellersGrid creators={filteredCreators} />;
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
		return (
			<div className="flex justify-center py-8">
				<ComponentLoader />
			</div>
		);
	}

	return (
		<div>
			<Suspense>
				<SellersFilterBar raceOptions={raceOptions} sortOptions={sortOptions} />
			</Suspense>
			<Suspense fallback={<ComponentLoader />}>
				<SellersContent creators={creators} />
			</Suspense>
		</div>
	);
};

export default Page;
