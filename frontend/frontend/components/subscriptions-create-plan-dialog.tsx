"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useGlobal } from "@/context/global-context-provider";

import {
	createSubscriptionPlanService,
	editSubscriptionPlanService,
} from "@/lib/services";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanType } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "./ui/button";
import { Icon } from "./ui/icons";
import { PageLoader } from "./ui/page-loader";
import { SUBSCRIPTION_PLAN_ICONS } from "@/constants/constants";
import { useQueryClient } from "@tanstack/react-query";

export const FormSchema = z.object({
	name: z.string().min(1, { message: "Name is required." }).trim(),
	amount: z.string({ required_error: "Amount is required." }).refine(
		(val) => {
			const numeric = val.replace(/,/g, "");
			if (!/^\d+(\.\d{1,2})?$/.test(numeric)) return false;
			return Number.parseFloat(numeric) > 0;
		},
		{ message: "Enter an amount greater than 0 (up to 2 decimal places)." }
	),
	description: z.string().min(3, { message: "Description is required." }),
	icon: z.string({
		required_error: "You need to select a subscription icon.",
	}),
});

export const SubscriptionsCreatePlanDialog = ({
	editData,
	isUpdating = false,
	children,
}: {
	editData?: SubscriptionPlanType;
	isUpdating?: boolean;
	children: React.ReactNode;
}) => {
	const { user } = useGlobal();
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: editData?.name || "",
			amount: editData?.amount || "",
			description: editData?.description || "",
			icon: editData?.icon || "1",
		},
		mode: isUpdating ? "onChange" : "onBlur",
	});

	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		setIsLoading(true);

		if (editData) {
			await editSubscriptionPlanService({
				...data,
				id: editData._id,
				amount: data.amount.replace(/,/g, ""),
			})
				.then(() => {
					queryClient.invalidateQueries({
						queryKey: ["subscriptions", user?.discordId],
					});
					toast.success("Subscription plan updated successfully!");
					form.reset();
				})
				.catch((error) => {
					toast.error("Failed to update subscription plan", {
						description: error.message,
					});
				})
				.finally(() => {
					setIsOpen(false);
					setIsLoading(false);
				});
			return;
		}

		await createSubscriptionPlanService(user?.discordId ?? "", {
			...data,
			amount: data.amount.replace(/,/g, ""),
			// @ts-expect-error any
			type: "tier",
		})
			.then(() => {
				toast.success("Subscription plan created successfully!");

				form.reset();
			})
			.catch((error) => {
				toast.error("Failed to create subscription plan", {
					description: error.message,
				});
			})
			.finally(() => {
				setIsOpen(false);
				setIsLoading(false);
			});
	};

	const [name, amount, description, icon] = form.watch([
		"name",
		"amount",
		"description",
		"icon",
	]);

	const shouldUpdateBtn = useMemo(() => {
		if (!editData || !isUpdating) return false;
		const hasFormChanged =
			(name ?? "").trim() !== editData.name.trim() ||
			(amount ?? "") !== editData.amount ||
			(description ?? "").trim() !== editData.description.trim() ||
			(icon ?? "") !== editData.icon;
		return hasFormChanged;
	}, [name, amount, description, icon, editData, isUpdating]);

	if (isLoading) {
		return <PageLoader />;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent className="space-y-[51px]">
				<DialogDescription className="sr-only">
					{" "}
					Create a subscription plan
				</DialogDescription>
				<h1 className="text-[32px] font-semibold  text-[#F8F8F8] ">
					{editData ? "Update" : "Create"} a subscription plan
				</h1>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-[105px]"
					>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<div className="relative">
											<Icon.subscription className="absolute -translate-y-1/2 top-1/2 left-4" />
											<FormControl>
												<Input
													placeholder="Subscription name"
													className="bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E]"
													{...field}
												/>
											</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<div className="relative">
											<Icon.money className="absolute -translate-y-1/2 top-1/2 left-4" />
											<FormControl>
												<Input
													{...field}
													type="text"
													inputMode="numeric"
													placeholder="Amount per Month"
													className="bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E]"
													onChange={(e) => {
														let value = e.target.value.replace(/[^0-9.]/g, ""); // allow digits and dot only
														// keep only first dot (if any)
														const firstDotIndex = value.indexOf(".");
														if (firstDotIndex !== -1) {
															value =
																value.slice(0, firstDotIndex + 1) +
																value
																	.slice(firstDotIndex + 1)
																	.replace(/\./g, "");
														}
														const [intPart, decPart = ""] = value.split(".");
														const intNumber = intPart ? Number(intPart) : 0;
														const intFormatted =
															intPart !== ""
																? new Intl.NumberFormat("en-US").format(
																		intNumber
																  )
																: "0";
														const decTruncated = decPart.slice(0, 2);
														const formatted = value.includes(".")
															? decTruncated.length
																? `${intFormatted}.${decTruncated}`
																: `${intFormatted}.`
															: intFormatted;
														field.onChange(formatted);
													}}
												/>
											</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="relative">
										<div className="relative">
											<Icon.description className="absolute -translate-y-1/2 top-1/2 left-4" />
											<FormControl>
												<Input
													placeholder="Description"
													className="!bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E]"
													{...field}
												/>
											</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="icon"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel className="text-[#8A8C95] font-">
											Subscription Icon
										</FormLabel>
										<div className="flex items-center gap-2">
											{SUBSCRIPTION_PLAN_ICONS.map(({ id, icon: Icon }) => (
												<Button
													key={id}
													type="button"
													title={id}
													className={cn(
														"h-auto p-3.5 bg-[#0F1114] text-white",
														field.value === id ? "border border-[#FF007F]" : ""
													)}
													onClick={() => field.onChange(id)}
												>
													<Icon className="size-6" />
												</Button>
											))}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoading || (!shouldUpdateBtn && isUpdating)}
							className="rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full disabled:opacity-50"
						>
							{editData ? "Edit subscription" : "Add subscription"}
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
