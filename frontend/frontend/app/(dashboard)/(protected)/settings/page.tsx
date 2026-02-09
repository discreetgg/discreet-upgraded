import { SettingsPageContent } from "@/components/settings-page-content";
import { TabLoadingSkeleton } from "@/components/tab-loading-skeleton";
import Image from "next/image";
import { Suspense } from "react";

const Page = () => {
	return (
		<div className="py-6">
			<div className="relative md:pt-[88px] md:px-4 space-y-[26px]">
				<div className="space-y-1">
					<div className="grid grid-cols-3 md:flex items-center px-2 w-full justify-between gap-3 md:mb-0 mb-2">
						<Image
							src="/logo.png"
							height={41}
							width={41}
							alt="logo"
							className="md:hidden "
						/>
						<h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8]  text-center">
							Settings
						</h1>
						<div className="md:hidden" />
					</div>
				</div>
				<Suspense
					fallback={<TabLoadingSkeleton className="pt-4 md:pt-6" variant="list" />}
				>
					<SettingsPageContent />
				</Suspense>
			</div>
		</div>
	);
};

export default Page;
