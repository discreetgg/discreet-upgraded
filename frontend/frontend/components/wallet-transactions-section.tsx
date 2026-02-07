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
		<div className="space-y-6 h-full px-4 ">
			{/* Filters */}
			<div className="flex flex-col gap-4 mt-4 relative">
				<div className="md:hidden flex justify-end items-center gap-x-4">
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
												"w-full justify-start text-left font-normal bg-transparent border-[#2E2E32] text-[#8A8C95] hover:bg-[#2E2E32] hover:text-white",
												!date && "text-muted-foreground"
											)}
										>
											<IconCalendar className="mr-2 h-4 w-4" />
											{date ? format(date, "PPP") : <span>Pick a date</span>}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
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
									<SelectTrigger className="w-full bg-transparent border-[#2E2E32] text-[#8A8C95]">
										<SelectValue placeholder="Type" />
									</SelectTrigger>
									<SelectContent className="rounded-md   ">
										{TYPES.map((t) => (
											<SelectItem
												key={t}
												value={t}
												data-state={type === t ? "active" : "inactive"}
												className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color "
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
									onValueChange={(val) => setStatus(val as "ALL" | "COMPLETED")}
								>
									<SelectTrigger className="w-full bg-transparent border-[#2E2E32] text-[#8A8C95]">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent className="rounded-md   ">
										{STATUS.map((t) => (
											<SelectItem
												key={t}
												value={t}
												data-state={status === t ? "active" : "inactive"}
												className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color "
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
									<SelectTrigger className="w-full bg-transparent border-[#2E2E32] text-[#8A8C95]">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent className="rounded-md   ">
										{META_TYPES.map((t) => (
											<SelectItem
												key={t}
												value={t}
												data-state={metaType === t ? "active" : "inactive"}
												className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color capitalize"
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
										className="text-muted-foreground hover:text-white w-full"
									>
										<IconX className="mr-2 h-4 w-4" />
										Clear Filters
									</Button>
								)}
							</div>
						</DrawerContent>
					</Drawer>
				</div>

				<div className="hidden md:flex flex-wrap gap-2 items-center justify-between ">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={"outline"}
								className={cn(
									"w-[200px] justify-start text-left font-normal bg-transparent border-[#2E2E32] text-[#8A8C95] hover:bg-[#2E2E32] hover:text-white",
									!date && "text-muted-foreground"
								)}
							>
								<IconCalendar className="mr-2 h-4 w-4" />
								{date ? format(date, "PPP") : <span>Pick a date</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
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
						<SelectTrigger className="w-[140px] bg-transparent border-[#2E2E32] text-[#8A8C95]">
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent className="rounded-md   max-w-[140px]">
							{TYPES.map((t) => (
								<SelectItem
									key={t}
									value={t}
									data-state={type === t ? "active" : "inactive"}
									className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color "
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
						<SelectTrigger className="w-[140px] bg-transparent border-[#2E2E32] text-[#8A8C95]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent className="rounded-md   max-w-[140px]">
							{STATUS.map((t) => (
								<SelectItem
									key={t}
									value={t}
									data-state={status === t ? "active" : "inactive"}
									className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color "
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
						<SelectTrigger className="w-[160px] bg-transparent border-[#2E2E32] text-[#8A8C95]">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent className="rounded-md   max-w-[160px]">
							{META_TYPES.map((t) => (
								<SelectItem
									key={t}
									value={t}
									data-state={metaType === t ? "active" : "inactive"}
									className="pl-2  data-[state=active]:text-[#FF007F] text-accent-text my-1 data-[state=active]:[&_svg:not([class*='text-'])]:text-accent-color capitalize "
								>
									{t === "ALL"
										? "All Categories"
										: t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

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
				</div>
			</div>

			{(!filteredTransactions || filteredTransactions.length === 0) &&
			hasActiveFilters ? (
				<EmptyStates className="min-h-[200px]">
					<EmptyStates.Icon icon={IconMoodSad}>
						No transactions found matching your filters.
					</EmptyStates.Icon>
				</EmptyStates>
			) : (
				Object.entries(grouped || {}).map(([section, records]) => (
					<div key={section} className="space-y-4 relative">
						<h3 className="text-[15px] text-[#8A8C95] font-light sticky top-0 bg-background z-10 py-2">
							{section}
						</h3>
						<div className="space-y-6">
							{records.map((record) => {
								const profileImage = record.meta?.fromUser.profileImage
									? record.meta?.fromUser.profileImage.url
									: `https://cdn.discordapp.com/avatars/${record.meta?.fromUser.discordId}/${record.meta?.fromUser.discordAvatar}.png`;
								return (
									<div key={record._id} className="space-y-6">
										<div className="flex items-center justify-between">
											<div className="space-y-3">
												<p className="text-sm text-[#D4D4D8] uppercase">
													{record.type}{" "}
													<span className="italic text-muted-foreground">
														-{" "}
														{record.meta?.type === "MENU_PURCHASE"
															? `${
																	record.meta?.menu?.title
																		? record.meta?.menu?.title + " Menu"
																		: "Menu Purchase"
															  }`
															: record.meta?.type}
													</span>
												</p>
												<p className="flex items-center gap-3">
													<span className="flex items-center gap-1 md:gap-x-1.5">
														<Avatar
															color="#1E1E21"
															className={cn("relative group size-3 ")}
														>
															<AvatarImage src={profileImage} />
															<AvatarFallback>
																<Image
																	src="/user.svg"
																	height={12}
																	width={12}
																	className="rounded-full"
																	alt=""
																/>
															</AvatarFallback>
														</Avatar>
														<span className="text-off-white">
															{record.meta?.fromUser.username}
														</span>
													</span>
													<span className="size-1.5 bg-accent-text rounded-full" />
													<span className="text-sm text-accent-text">
														{format(new Date(record.createdAt), "HH:mm")}
													</span>
												</p>
											</div>
											<div className="space-y-3 text-right">
												<p className="text-[#D4D4D8] font-medium">
													$
													{record.amount.toLocaleString(undefined, {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													}) || "0.00"}
												</p>
												<i className="text-sm text-[#8A8C95] font-medium">
													{record.status.charAt(0) +
														record.status
															.slice(1)
															.toLowerCase()
															.replace("_", " ")}
												</i>
											</div>
										</div>
										<Separator />
									</div>
								);
							})}
						</div>
					</div>
				))
			)}
		</div>
	);
};
