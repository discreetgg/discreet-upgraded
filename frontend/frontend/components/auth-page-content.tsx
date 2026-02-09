"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useState } from "react";

import { discordSigninService } from "@/lib/services";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { PageLoader } from "./ui/page-loader";

export const AuthPageContent = () => {
	const [isLoading, setIsLoading] = useState(false);

	async function onSubmit() {
		setIsLoading(true);
		try {
			await discordSigninService();
			toast.loading("Signing in with discord!");
		} catch (error: any) {
			toast.error("Login failed", {
				description: error.message,
			});
		} finally {
			setIsLoading(false);
		}
	}

	const motionVariants = {
		initial: { opacity: 0, x: 40 },
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: -40 },
	};

	if (isLoading) {
		return <PageLoader />;
	}

	return (
		<main className="h-screen w-full flex items-center justify-center bg-[#050505]">
			<div className="relative">
				<div className="blur-[50px] rounded-4xl opacity-20 bg-[#FF007F] h-[391px] w-[379px] absolute -translate-y-1/2 top-[55%] -translate-x-1/2 left-1/2" />
				<div className="max-w-[542px] rounded-[28px] bg-[#0A0A0B] w-full shadow-[2px_2px_0_0_#0F1114] p-10 space-y-10 relative overflow-hidden">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key="step1"
							{...motionVariants}
							transition={{ duration: 0.5, ease: "easeInOut" }}
							className="space-y-10"
						>
							<h1 className="text-center text-[32px] font-semibold text-[#D4D4D8]">
								Sign in with Discord
							</h1>
							<div>
								<div className="w-full rounded-[16px] bg-[#0F1114] border-[#0A0A0B] border-4 py-6 px-4 relative flex items-center justify-center">
									<Icon.discord />
								</div>
								{/* <div className='w-full max-w-[330px] mx-auto rounded-b-[16px] bg-[#0F1114] border-[#0A0A0B] border-4 py-[12.801px] px-[15.362px] flex justify-between gap-4 items-center'>
                    <div className='flex gap-4 items-center'>
                      <Image src='/user.svg' height={48} width={48} alt='' />
                      <div className='space-y-1 flex flex-col'>
                        <span className='text-[#D4D4D8] font-bold text-[15px]'>
                          Side effect
                        </span>
                        <span className='text-[15px] font-light text-[#8A8C95]'>
                          Siz.xyz
                        </span>
                      </div>
                    </div>
                    <Button
                      variant='link'
                      className='text-[#FF0065] text-[15px] p-0 hover:!bg-transparent'
                    >
                      This is not me
                    </Button>
                  </div> */}
							</div>
							<Button
								onClick={onSubmit}
								className="rounded w-full h-auto py-3.5 px-4 text-lg font-medium text-[#D4D4D8] bg-transparent hover:bg-transparent border-2 border-[#FF007F] shadow-[1px_2px_0_2px_#FF007F] hover:shadow-[4px_4px_0_2px_#FF007F] transition-all duration-300 ease-in-out"
							>
								Continue
							</Button>
						</motion.div>
					</AnimatePresence>

					<footer className="text-sm text-center text-[#B3B3B3]">
						By signing up you are agreeing to Discreet{" "}
						<Link className="underline" href="/terms-and-conditions">
							Terms & Conditions.
						</Link>
					</footer>
				</div>
			</div>
		</main>
	);
};
