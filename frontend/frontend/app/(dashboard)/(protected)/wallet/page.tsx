import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletBalanceSection } from "@/components/wallet-balance-section";
import { WalletTransactionsSection } from "@/components/wallet-transactions-section";
import Image from "next/image";

const Page = () => {
	return (
		<div className="relative pt-5 md:pt-[88px] px-4 space-y-[26px] mb-10">
			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3 md:mb-0 mb-6">
					<div className="flex items-center gap-4">
						<Image
							src="/logo.png"
							height={48}
							width={48}
							alt="logo"
							className="md:hidden rounded-xl shadow-lg"
						/>
						<div>
							<h1 className="md:text-4xl text-2xl font-bold text-[#F8F8F8] tracking-tight">
								Wallet
							</h1>
							<p className="text-[#8A8C95] text-sm font-medium mt-1">
								Manage your digital assets and track history
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto">
				<WalletBalanceSection />

				<div className="space-y-4">
					<div className="flex items-center justify-between px-1">
						<h2 className="text-xl font-bold text-white tracking-tight">Recent Activity</h2>
						<div className="h-[1px] flex-1 bg-[#2E2E32] mx-6 hidden md:block" />
					</div>

					<div className="rounded-3xl border border-[#2E2E32] bg-[#0F1114]/50 backdrop-blur-md overflow-hidden">
						<ScrollArea className="h-[500px] md:h-[600px] xl:h-[700px]">
							<div className="overflow-y-auto">
								<WalletTransactionsSection />
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Page;
