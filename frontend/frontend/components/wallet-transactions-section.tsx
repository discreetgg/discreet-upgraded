"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGlobal } from "@/context/global-context-provider";
import { cn, getSectionLabel } from "@/lib/utils";
import { WalletTransactionType } from "@/types/global";
import {
	IconCalendar,
	IconFilter,
	IconMoodSad,
	IconX,
} from "@tabler/icons-react";
import { format, isSameDay } from "date-fns";
import { useEffect, useState } from "react";
import { EmptyStates } from "./ui/empty-states";
import { useWalletTransaction } from "@/hooks/mutations/use-wallet-transaction";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Image from "next/image";

const TYPES = ["ALL", "CREDIT", "DEBIT"] as const;
const STATUS = ["ALL", "COMPLETED", "PROCESSING"] as const;
const META_TYPES = ["ALL", "MENU_PURCHASE", "SUBSCRIPTION", "TIP"] as const;

export const WalletTransactionsSection = () => {
	const { user } = useGlobal();

	const { data: walletTransactions, isLoading } = useWalletTransaction(
		user?.discordId!
	);

	// Filters
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [type, setType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
	const [status, setStatus] = useState<"ALL" | "COMPLETED" | "PROCESSING">(
		"ALL"
	);
	const [metaType, setMetaType] = useState<
		"ALL" | "MENU_PURCHASE" | "SUBSCRIPTION" | "TIP"
	>("ALL");

	const filteredTransactions = walletTransactions?.filter((txn) => {
		// Date Filter
		if (date && !isSameDay(new Date(txn.createdAt), date)) {
			return false;
		}

		// Type Filter
		if (type !== "ALL" && txn.type !== type) {
			return false;
		}

		// Status Filter
		if (status !== "ALL" && txn.status !== status) {
			return false;
		}

		// Meta Type Filter
		if (metaType !== "ALL" && txn.meta?.type !== metaType) {
			return false;
		}

		return true;
	});
	useEffect(() => {
		console.log("WALLET TRANSACTION", walletTransactions);
	});

	const grouped = filteredTransactions?.reduce((acc, txn) => {
		const section = getSectionLabel(txn.createdAt);
		if (!acc[section]) {
			acc[section] = [];
		}
		acc[section].push(txn);
		return acc;
	}, {} as Record<string, WalletTransactionType[]>);

	const clearFilters = () => {
		setDate(undefined);
		setType("ALL");
		setStatus("ALL");
		setMetaType("ALL");
	};

	const hasActiveFilters =
		date || type !== "ALL" || status !== "ALL" || metaType !== "ALL";

	if (isLoading) {
		return (
			<div className="relative min-h-[300px]">
				<div className="absolute inset-0  z-10 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] rounded-xl" />
			</div>
		);
	}
	if (!walletTransactions || !walletTransactions.length) {
		return (
			<EmptyStates className="min-h-[300px] flex items-center justify-center">
				<EmptyStates.Icon icon={IconMoodSad}>
					You don't have any transactions yet.
				</EmptyStates.Icon>
			</EmptyStates>
		);
	}

	return (
		<div className="h-full">
			{/* Mobile Filters */}
			<div className="md:hidden flex justify-end items-center gap-x-4 px-6 mt-4 mb-4">
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size={"ghost"}
						onClick={clearFilters}
						className="text-muted-foreground font-normal hover:text-white text-base shrink-0 items-center gap-x-1 flex "
					>
						<X className="size-4" />
						<span>Reset</span>
					</Button>
				)}
				<Drawer>
					<DrawerTrigger asChild>
						<Button
							data-filters={hasActiveFilters ? "true" : "false"}
							variant="outline"
							className="text-accent-color  data-[filters=true]:bg-accent-color/20 hover:bg-accent-color/10 transition-colors duration-200"
						>
							<IconFilter className="h-4 w-4" />
							<span>Filters</span>
						</Button>
					</DrawerTrigger>
					<DrawerContent className="pb-10">
						<DrawerHeader className="text-left">
							<DrawerTitle>Filter Transactions</DrawerTitle>
						</DrawerHeader>
						<div className="p-4 flex flex-col gap-4">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
										className={cn(
											"w-full h-12 justify-start text-left font-medium bg-[#1E1E21]/50 border-[#2E2E32] text-[#8A8C95] hover:bg-[#2E2E32] hover:text-white transition-all rounded-xl",
											date && "text-white border-accent-color/50 bg-accent-color/5"
										)}
									>
										<IconCalendar className={cn("mr-2 h-4 w-4 shrink-0", date ? "text-accent-color" : "text-[#8A8C95]")} />
										{date ? format(date, "PPP") : <span>Pick a date</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0 border-[#2E2E32] bg-[#161618]" align="start">
									<Calendar
										mode="single"
										selected={date}
										onSelect={setDate}
										initialFocus
									/>
								</PopoverContent>
							</Popover>

							<Select
								value={type}
								onValueChange={(val) =>
									setType(val as "ALL" | "CREDIT" | "DEBIT")
								}
							>
								<SelectTrigger className={cn(
									"w-full h-12 bg-[#1E1E21]/50 border-[#2E2E32] text-[#8A8C95] rounded-xl focus:ring-0",
									type !== "ALL" && "text-white border-accent-color/50 bg-accent-color/5"
								)}>
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-[#2E2E32] bg-[#161618]">
									{TYPES.map((t) => (
										<SelectItem
											key={t}
											value={t}
											className="hover:bg-[#2E2E32] focus:bg-[#2E2E32]"
										>
											{t === "ALL"
												? "All Types"
												: t.charAt(0) + t.slice(1).toLowerCase()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={status}
								onValueChange={(val) => setStatus(val as "ALL" | "COMPLETED" | "PROCESSING")}
							>
								<SelectTrigger className={cn(
									"w-full h-12 bg-[#1E1E21]/50 border-[#2E2E32] text-[#8A8C95] rounded-xl focus:ring-0",
									status !== "ALL" && "text-white border-accent-color/50 bg-accent-color/5"
								)}>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-[#2E2E32] bg-[#161618]">
									{STATUS.map((t) => (
										<SelectItem
											key={t}
											value={t}
											className="hover:bg-[#2E2E32] focus:bg-[#2E2E32]"
										>
											{t === "ALL"
												? "All Status"
												: t.charAt(0) + t.slice(1).toLowerCase()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={metaType}
								onValueChange={(val) =>
									setMetaType(
										val as "ALL" | "MENU_PURCHASE" | "SUBSCRIPTION" | "TIP"
									)
								}
							>
								<SelectTrigger className={cn(
									"w-full h-12 bg-[#1E1E21]/50 border-[#2E2E32] text-[#8A8C95] rounded-xl focus:ring-0",
									metaType !== "ALL" && "text-white border-accent-color/50 bg-accent-color/5"
								)}>
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent className="rounded-xl border-[#2E2E32] bg-[#161618]">
									{META_TYPES.map((t) => (
										<SelectItem
											key={t}
											value={t}
											className="hover:bg-[#2E2E32] focus:bg-[#2E2E32] capitalize"
										>
											{t === "ALL"
												? "All Categories"
												: t.charAt(0) +
												t.slice(1).toLowerCase().replace("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{hasActiveFilters && (
								<Button
									variant="ghost"
									onClick={clearFilters}
									className="text-accent-color hover:text-accent-color/80 hover:bg-accent-color/10 h-12 rounded-xl"
								>
									<IconX className="mr-2 h-4 w-4" />
									Clear Filters
								</Button>
							)}
						</div>
					</DrawerContent>
				</Drawer>
			</div>

			{/* Desktop Filters */}
			<div className="hidden md:flex flex-wrap items-center gap-6 px-6 py-3 border-b border-[#2E2E32]/50 bg-[#0F1114] backdrop-blur-xl sticky top-0 z-20">
				<div className="flex items-center gap-2.5 text-[#8A8C95] text-[10px] font-bold uppercase tracking-[0.15em] opacity-80 mr-4">
					<IconFilter className="size-3.5" />
					<span>Filter History</span>
				</div>

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant={"ghost"}
							className={cn(
								"h-10 px-4 hover:bg-white/5 rounded-xl text-[#8A8C95] hover:text-white transition-all flex items-center gap-3 font-medium border border-transparent hover:border-[#2E2E32]/50",
								date && "text-accent-color font-bold bg-accent-color/5 border-accent-color/20"
							)}
						>
							<IconCalendar className="size-4 opacity-70" />
							<span className="text-sm">{date ? format(date, "MMM d, yyyy") : "Date Range"}</span>
							<div className={cn("size-1.5 rounded-full bg-accent-color transition-all shadow-[0_0_8px_rgba(255,0,127,0.5)]", date ? "opacity-100 scale-100" : "opacity-0 scale-0")} />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0 border-[#2E2E32] bg-[#161618] shadow-2xl rounded-2xl overflow-hidden" align="start">
						<Calendar
							mode="single"
							selected={date}
							onSelect={setDate}
							initialFocus
						/>
					</PopoverContent>
				</Popover>

				<Select
					value={type}
					onValueChange={(val) => setType(val as "ALL" | "CREDIT" | "DEBIT")}
				>
					<SelectTrigger className={cn(
						"w-fit h-10 px-4 bg-transparent border border-transparent hover:border-[#2E2E32]/50 hover:bg-white/5 rounded-xl text-[#8A8C95] hover:text-white transition-all focus:ring-0 gap-3 font-medium",
						type !== "ALL" && "text-accent-color font-bold bg-accent-color/5 border-accent-color/20"
					)}>
						<span className="text-sm opacity-60">Type</span>
						<SelectValue placeholder="All" />
						<div className={cn("size-1.5 rounded-full bg-accent-color transition-all shadow-[0_0_8px_rgba(255,0,127,0.5)]", type !== "ALL" ? "opacity-100 scale-100" : "opacity-0 scale-0")} />
					</SelectTrigger>
					<SelectContent className="rounded-2xl border-[#2E2E32] bg-[#161618] overflow-hidden shadow-2xl p-1">
						{TYPES.map((t) => (
							<SelectItem
								key={t}
								value={t}
								className="rounded-xl hover:bg-[#2E2E32] focus:bg-[#2E2E32] transition-colors py-2.5 px-4"
							>
								{t === "ALL"
									? "All Types"
									: t.charAt(0) + t.slice(1).toLowerCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={status}
					onValueChange={(val) =>
						setStatus(val as "ALL" | "COMPLETED" | "PROCESSING")
					}
				>
					<SelectTrigger className={cn(
						"w-fit h-10 px-4 bg-transparent border border-transparent hover:border-[#2E2E32]/50 hover:bg-white/5 rounded-xl text-[#8A8C95] hover:text-white transition-all focus:ring-0 gap-3 font-medium",
						status !== "ALL" && "text-accent-color font-bold bg-accent-color/5 border-accent-color/20"
					)}>
						<span className="text-sm opacity-60">Status</span>
						<SelectValue placeholder="All" />
						<div className={cn("size-1.5 rounded-full bg-accent-color transition-all shadow-[0_0_8px_rgba(255,0,127,0.5)]", status !== "ALL" ? "opacity-100 scale-100" : "opacity-0 scale-0")} />
					</SelectTrigger>
					<SelectContent className="rounded-2xl border-[#2E2E32] bg-[#161618] overflow-hidden shadow-2xl p-1">
						{STATUS.map((t) => (
							<SelectItem
								key={t}
								value={t}
								className="rounded-xl hover:bg-[#2E2E32] focus:bg-[#2E2E32] transition-colors py-2.5 px-4"
							>
								{t === "ALL"
									? "All Status"
									: t.charAt(0) + t.slice(1).toLowerCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={metaType}
					onValueChange={(val) =>
						setMetaType(
							val as "ALL" | "MENU_PURCHASE" | "SUBSCRIPTION" | "TIP"
						)
					}
				>
					<SelectTrigger className={cn(
						"w-fit h-10 px-4 bg-transparent border border-transparent hover:border-[#2E2E32]/50 hover:bg-white/5 rounded-xl text-[#8A8C95] hover:text-white transition-all focus:ring-0 gap-3 font-medium",
						metaType !== "ALL" && "text-accent-color font-bold bg-accent-color/5 border-accent-color/20"
					)}>
						<span className="text-sm opacity-60">Category</span>
						<SelectValue placeholder="All" />
						<div className={cn("size-1.5 rounded-full bg-accent-color transition-all shadow-[0_0_8px_rgba(255,0,127,0.5)]", metaType !== "ALL" ? "opacity-100 scale-100" : "opacity-0 scale-0")} />
					</SelectTrigger>
					<SelectContent className="rounded-2xl border-[#2E2E32] bg-[#161618] overflow-hidden shadow-2xl p-1">
						{META_TYPES.map((t) => (
							<SelectItem
								key={t}
								value={t}
								className="rounded-xl hover:bg-[#2E2E32] focus:bg-[#2E2E32] transition-colors py-2.5 px-4 capitalize"
							>
								{t === "ALL"
									? "All Categories"
									: t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex-1" />

				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="text-white bg-accent-color/20 hover:bg-accent-color border border-accent-color/30 px-5 h-9 font-bold transition-all rounded-xl flex items-center gap-2 text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,127,0.2)]"
					>
						<X className="size-3" />
						<span>Clear All</span>
					</Button>
				)}
			</div>

			<div className="space-y-6 py-6">
				{(!filteredTransactions || filteredTransactions.length === 0) &&
					hasActiveFilters ? (
					<EmptyStates className="min-h-[200px]">
						<EmptyStates.Icon icon={IconMoodSad}>
							No transactions found matching your filters.
						</EmptyStates.Icon>
					</EmptyStates>
				) : (
					Object.entries(grouped || {}).map(([section, records]) => (
						<div key={section} className="space-y-4 px-6">
							<h3 className="text-[13px] text-[#8A8C95] font-bold uppercase tracking-widest py-4">
								{section}
							</h3>
							<div className="space-y-1">
								{records.map((record) => {
									const profileImage = record.meta?.fromUser.profileImage
										? record.meta?.fromUser.profileImage.url
										: `https://cdn.discordapp.com/avatars/${record.meta?.fromUser.discordId}/${record.meta?.fromUser.discordAvatar}.png`;
									return (
										<div key={record._id} className="group relative">
											<div className="flex items-center justify-between py-4 px-3 rounded-2xl transition-all duration-300 group-hover:bg-[#1E1E21]/40 border border-transparent group-hover:border-[#2E2E32]">
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<p className={cn(
															"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
															record.type === "CREDIT" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
														)}>
															{record.type}
														</p>
														<p className="text-[11px] text-[#8A8C95] font-medium lowercase first-letter:uppercase">
															{record.meta?.type === "MENU_PURCHASE"
																? record.meta?.menu?.title || "Menu Purchase"
																: record.meta?.type?.replace("_", " ")}
														</p>
													</div>
													<div className="flex items-center gap-2.5">
														<Avatar className="size-5 border border-[#2E2E32]">
															<AvatarImage src={profileImage} />
															<AvatarFallback>
																<Image src="/user.svg" height={14} width={14} alt="" />
															</AvatarFallback>
														</Avatar>
														<span className="text-sm font-semibold text-off-white">
															{record.meta?.fromUser.username}
														</span>
														<div className="size-1 bg-[#2E2E32] rounded-full" />
														<span className="text-[11px] text-[#8A8C95]">
															{format(new Date(record.createdAt), "HH:mm")}
														</span>
													</div>
												</div>
												<div className="text-right space-y-1.5">
													<p className={cn(
														"text-base font-bold tracking-tight",
														record.type === "CREDIT" ? "text-emerald-400" : "text-white"
													)}>
														{record.type === "CREDIT" ? "+" : "-"}$
														{record.amount.toLocaleString(undefined, {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</p>
													<span className={cn(
														"text-[10px] font-medium px-2 py-0.5 rounded-full border shadow-sm capitalize",
														record.status === "COMPLETED"
															? "border-emerald-500/20 text-emerald-500/90 bg-emerald-500/5"
															: "border-yellow-500/20 text-yellow-500/90 bg-yellow-500/5"
													)}>
														{record.status.toLowerCase().replace("_", " ")}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};
