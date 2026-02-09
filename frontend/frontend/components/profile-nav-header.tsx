"use client";

import { useGlobal } from "@/context/global-context-provider";
import { Icon } from "./ui/icons";
import { Button } from "./ui/button";
import { useRouter } from "@bprogress/next/app";
import { GlobalSearch } from "./search/global-search";

export const ProfileNavHeader = () => {
	const { user } = useGlobal();
	const router = useRouter();

	return (
		<div className="flex w-full justify-between items-center ">
			<div className="flex items-center gap-x-2 md:gap-x-4">
				<Button
					onClick={() => router.back()}
					variant="ghost"
					className="p-0 group hover:!bg-transparent"
				>
					<Icon.arrrowLeft
						className="group-hover:-translate-x-3 duration-150 ease-out"
						strokeclassName="group-hover:stroke-white transition-colors duration-150 ease-out"
					/>
					<span className="font-inter text-lg text-accent-text group-hover:text-neutral-300 transition-colors duration-150 ease-out">
						{user?.displayName}
					</span>
				</Button>
			</div>
			<GlobalSearch placeholder="Search" />
		</div>
	);
};
