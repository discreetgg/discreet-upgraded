"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "./ui/button";

export const AuthPromptDialog = ({
	children,
	open,
	onOpenChange,
}: {
	children?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="space-y-3">
				<div className="space-y-1">
					<h1 className="text-[32px] font-semibold  text-[#F97066] ">
						Authentication Required
					</h1>
					<p className="text-[15px] font-light">Please log in to continue.</p>
				</div>
				<Link
					href="/auth"
					className={cn(
						buttonVariants(),
						"rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#F97066] bg-[#0A0A0B] shadow-[2px_2px_0_0_#F97066] text-[#F97066] w-full",
						"disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]"
					)}
				>
					Log In
				</Link>
			</DialogContent>
		</Dialog>
	);
};
