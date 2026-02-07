import { ScrollArea } from "@/components/ui/scroll-area";
import { WalletBalanceSection } from "@/components/wallet-balance-section";
import { WalletTransactionsSection } from "@/components/wallet-transactions-section";
import Image from "next/image";

const Page = () => {
	return (
		<div className="relative pt-5 md:pt-[88px] px-4 space-y-[26px] mb-10">
			<div className="space-y-1">
				<div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
					<Image
						src="/logo.png"
						height={41}
						width={41}
						alt="logo"
						className="md:hidden"
					/>
					<h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8] ">
						Wallet
					</h1>
					<div className="md:hidden" />
				</div>
				<p className="text-[#8A8C95] font-light mt-4 md:mt-0">
					Manage your credits and track transactions
				</p>
			</div>
			<div className="rounded-xl md:border  border-[#2E2E32] pb-4 ">
				<div className="  flex flex-col !relative md:px-6  bg-[#0F1114]  space-y-4 divide-y divide-[#2E2E32]">
					<WalletBalanceSection />
					<ScrollArea className="rounded-xl md:border  border-[#2E2E32]">
						<div className="  md:max-h-[700px] xl:max-h-[800px]  overflow-y-auto !relative  bg-[#0F1114]  space-y-4">
							<WalletTransactionsSection />
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
};

export default Page;
