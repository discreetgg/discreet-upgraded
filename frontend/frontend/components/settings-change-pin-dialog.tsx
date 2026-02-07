"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { changePinService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "./ui/button";
import { Icon } from "./ui/icons";
import { Input } from "./ui/input";
import { PageLoader } from "./ui/page-loader";

const FormSchema = z
	.object({
		newPin: z.string({ required_error: "Pin is required" }).min(4, {
			message: "Pin has to be at least 4 characters long",
		}),
		oldPin: z.string({ required_error: "Pin is required" }).min(4, {
			message: "Pin has to be at least 4 characters long",
		}),
		confirmNewPin: z.string({ required_error: "Please confirm pin" }),
	})
	.refine((data) => data.newPin === data.confirmNewPin, {
		message: "Pins don't match",
		path: ["confirmNewPin"],
	});

export const SettingsChangePinDialog = () => {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const EyeComponent = isPasswordVisible ? Icon.eyeOff : Icon.eyeOn;

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		const { newPin, oldPin } = data;
		try {
			setIsLoading(true);
			toast.loading("Changing pin...", {
				id: "change-pin",
			});
			await changePinService({ discordId: "your-discord-id", oldPin, newPin });
			toast.success("Pin changed successfully!", {
				id: "change-pin",
			});
		} catch (error: any) {
			toast.error(`Failed to change pin: ${error.message}`, {
				id: "change-pin",
			});
		} finally {
			setIsLoading(false);
			setIsOpen(false);
			form.reset();
		}
	};

	if (isLoading) {
		return <PageLoader />;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button className="rounded py-3.5 px-4 h-auto bg-[#3C3C42] hover:bg-[#4A4A50]/80 text-white">
					Change Pin
				</Button>
			</DialogTrigger>
			<DialogContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-[26px] !max-w-[450px] w-full"
					>
						<h1 className="text-[32px] font-semibold  text-[#F8F8F8] ">
							Change pin
						</h1>
						<p className="text-[15px] font-light">
							You pin would be changed and you would be logged out to re-enter
							pin
						</p>

						<FormField
							control={form.control}
							name="oldPin"
							render={({ field }) => (
								<FormItem className="relative">
									<EyeComponent
										onClick={() => {
											setIsPasswordVisible((prev) => !prev);
										}}
										className="absolute -translate-y-1/2 top-1/2 right-4"
									/>
									<FormControl>
										<Input
											type={isPasswordVisible ? "text" : "password"}
											placeholder="Previous Pin"
											className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
											autoComplete="current-password"
											{...field}
										/>
									</FormControl>
									<FormMessage className="absolute right-0 -top-5" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="newPin"
							render={({ field }) => (
								<FormItem className="relative">
									<EyeComponent
										onClick={() => {
											setIsPasswordVisible((prev) => !prev);
										}}
										className="absolute -translate-y-1/2 top-1/2 right-4"
									/>
									<FormControl>
										<Input
											type={isPasswordVisible ? "text" : "password"}
											placeholder="New Pin"
											className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
											autoComplete="current-password"
											{...field}
										/>
									</FormControl>
									<FormMessage className="absolute right-0 -top-5" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="confirmNewPin"
							render={({ field }) => (
								<FormItem className="relative">
									<EyeComponent
										onClick={() => {
											setIsPasswordVisible((prev) => !prev);
										}}
										className="absolute -translate-y-1/2 top-1/2 right-4"
									/>
									<FormControl>
										<Input
											type={isPasswordVisible ? "text" : "password"}
											placeholder="Re-enter New Pin"
											className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
											autoComplete="current-password"
											{...field}
										/>
									</FormControl>
									<FormMessage className="absolute right-0 -top-5" />
								</FormItem>
							)}
						/>

						<Button
							disabled={!form.formState.isValid || isLoading}
							className={cn(
								"rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full",
								"disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]"
							)}
						>
							Change
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
