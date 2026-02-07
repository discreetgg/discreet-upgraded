"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { useGlobal } from "@/context/global-context-provider";
import { removePinService } from "@/lib/services";
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

const FormSchema = z.object({
	pin: z.string({ required_error: "Pin is required" }).min(4, {
		message: "Pin has to be at least 4 characters long",
	}),
});

export const SettingsRemovePinDialog = () => {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const { user, setUser } = useGlobal();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const EyeComponent = isPasswordVisible ? Icon.eyeOff : Icon.eyeOn;

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		const { pin } = data;
		const toastId = toast.loading("Removing pin...", {
			id: "remove-pin",
		});

		try {
			setIsLoading(true);

			await removePinService({ discordId: user?.discordId ?? "", pin });
			toast.success("Pin removed successfully!", {
				id: toastId,
			});

			if (user) {
				setUser({
					...user,
					hasAuthPin: false,
				});
			}
		} catch (error: any) {
			toast.error(`Failed to remove pin: ${error.message}`, {
				id: toastId,
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
				<Button className="rounded py-3.5 px-4 h-auto bg-[#F97066]/20 hover:bg-[#F97066]/80 text-[#F97066]">
					Remove Pin
				</Button>
			</DialogTrigger>
			<DialogContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-[26px] !max-w-[479px] w-full"
					>
						<h1 className="text-[32px] font-semibold  text-[#F97066] ">
							Remove Pin
						</h1>
						<p className="text-[15px] font-light">
							You would no longer have access to your account without this pin.
						</p>

						<FormField
							control={form.control}
							name="pin"
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
											placeholder="Enter Pin"
											className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
											autoComplete="current-password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							disabled={!form.formState.isValid || isLoading}
							className={cn(
								"rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#F97066] bg-[#0A0A0B] shadow-[2px_2px_0_0_#F97066] text-[#F97066] w-full",
								"disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]"
							)}
						>
							Remove
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
