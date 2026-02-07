"use client";

import { pushUrl } from "@/lib/utils";
import { useRouter } from "@bprogress/next/app";
import { usePathname, useSearchParams } from "next/navigation";
import { SortDropdown } from "../sort-dropdown";

interface SellersFilterBarProps {
	sortOptions: string[];
}

export const SellersFilterBar = ({ sortOptions }: SellersFilterBarProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const selectedSort = searchParams.get("sort")?.toLowerCase();
	const showRandomRefresh = selectedSort === "random";

	return (
		<div className="mb-[19px] flex items-start justify-end gap-2">
			{showRandomRefresh && (
				<button
					className="md:py-[11px] md:px-[16.5px] px-3 py-2 border border-[#1E2227] cursor-pointer rounded-[7px] text-[#8A8C95] md:text-[14px] text-[10px] hover:text-[#F8F8F8] transition-all duration-200"
					onClick={() => {
						const params = new URLSearchParams(Array.from(searchParams.entries()));
						params.set("randomSeed", Date.now().toString());
						const url = `${pathname}?${params.toString()}`;
						pushUrl(url, router);
					}}
				>
					Refresh Random
				</button>
			)}
			{sortOptions.length > 0 && <SortDropdown sortOptions={sortOptions} />}
		</div>
	);
};
