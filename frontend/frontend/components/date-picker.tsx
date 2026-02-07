"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils";
import { Icon } from "./ui/icons";
import { useEarningsDate } from "@/hooks/filters/use-earnings-date";

export const DatePicker = () => {
	const [open, setOpen] = React.useState(false);
	const { earningDate, updateEarningDate } = useEarningsDate();

	return (
		<div className="flex flex-col gap-3">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						id="date"
						className="justify-between gap-2 !px-4 !py-2 !h-auto !bg-transparent !border-[#1F2227] rounded hover:bg-background/80 shadow-[2px_2px_0_0_#1F2227] text-[#8A8C95] font-medium"
					>
						<Icon.calendar />
						{earningDate ? formatDate(earningDate) : "Select date"}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto overflow-hidden bg-background rounded-lg "
					align="start"
				>
					<Calendar
						mode="single"
						selected={earningDate}
						captionLayout="dropdown"
						onSelect={(date) => {
							updateEarningDate(date!);
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
};
