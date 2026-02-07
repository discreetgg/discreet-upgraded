"use client";

import { Button } from "./ui/button";

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { useGlobal } from "@/context/global-context-provider";
import { useSecurityDialogStepNavigation } from "@/hooks/use-step-navigation";
import { verifyOtpService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "./ui/input";
import { PageLoader } from "./ui/page-loader";

const FormSchema = z.object({
	code: z.string({ required_error: "Code is required" }).min(4, {
		message: "Code has to be at least 4 characters long",
	}),
});

export const SettingSecurityEnterConfirmationCode = () => {
	const { goToStep } = useSecurityDialogStepNavigation();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const { user } = useGlobal();

	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		const { code } = data;

		try {
			setIsLoading(true);
			toast.loading("Verifying OTP...", {
				id: "verify-otp",
			});
			await verifyOtpService({ discordId: user?.discordId ?? "", token: code });
			toast.success("OTP verified successfully!", {
				id: "verify-otp",
			});

			goToStep("done");
		} catch (error: any) {
			toast.error(`Failed to verify OTP: ${error.message}`, {
				id: "verify-otp",
			});
		} finally {
			setIsLoading(false);
			form.reset();
		}
	};

	if (isLoading) {
		return <PageLoader />;
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[39px]">
				<div className="space-y-[26px]">
					<h2 className="text-[#F8F8F8] text-[32px] font-semibold">
						Enter the confirmation code
					</h2>
					<p className="text-lg text-[#8A8C95] font-medium">
						Follow the instructions on the authentication app to link your
						Discreet account. Once the authentication app generates a
						confirmation code, enter it here.
					</p>
					<p className="text-lg text-[#8A8C95] font-medium">
						If the authentication process fails, go back to{" "}
						<Link href="#" className="text-[#FF0065] underline">
							link the app to your Discreet account
						</Link>{" "}
						and restart the process.
					</p>
				</div>
				<div className="space-y-[30px]">
					<FormField
						control={form.control}
						name="code"
						render={({ field }) => (
							<FormItem className="relative">
								<FormControl>
									<Input
										placeholder="Enter Code"
										className="!bg-transparent border-[#3C3C42] h-auto p-4 placeholder:text-[#9E9E9E]"
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
							"rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] w-full",
							"disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]"
						)}
					>
						Confirm
					</Button>
				</div>
			</form>
		</Form>
	);
};
