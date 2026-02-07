import {
	SubscribeDialog,
	SubscribeDialogContent,
	SubscribeDialogDescription,
	SubscribeDialogFooter,
	SubscribeDialogHeader,
	SubscribeDialogTitle,
} from "@/components/ui/subscribe-dialog";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { blockUser } from "@/actions/block-unblock";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
	blockModal: boolean;
	setBlockModal: Dispatch<SetStateAction<boolean>>;
	authorDiscordId: string;
	authorUsername: string;
}
export const HOLD_DURATION = 2000;
export default function BlockUserModal({
	blockModal,
	setBlockModal,
	authorDiscordId,
	authorUsername,
}: Props) {
	const [isHolding, setIsHolding] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isBlocking, setIsBlocking] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	const timeoutRef = useRef<NodeJS.Timeout>(null);
	const intervalRef = useRef<NodeJS.Timeout>(null);

	const handleMouseDown = () => {
		if (isBlocking) return;

		setIsHolding(true);
		const startTime = Date.now();

		intervalRef.current = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
			setProgress(newProgress);

			if (newProgress >= 100) {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
				}
				setIsBlocking(true);
				setBlockModal(false);
				blockUser(authorDiscordId)
					.then(() => {
						toast.success("User blocked successfully");
					})
					.catch(() => {
						toast.error("Failed to block user");
					});
			}
		}, 16); // ~60fps

		timeoutRef.current = setTimeout(() => {
			setIsBlocking(true);
		}, HOLD_DURATION);
	};

	const handleMouseUp = () => {
		setIsHolding(false);
		setProgress(0);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
	};

	const handleMouseLeave = () => {
		handleMouseUp();
	};

	const handleReset = () => {
		setModalOpen(false);
		setIsBlocking(false);
		setProgress(0);
		setIsHolding(false);
		setIsPending(false);
	};

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			handleReset();
		};
	}, []);

	return (
		<SubscribeDialog open={blockModal} onOpenChange={setBlockModal}>
			<SubscribeDialogContent className="bg-dark-charcoal px-8 sm:max-w-[542px] flex justify-center md:rounded-3xl">
				<div className="w-full max-w-[368px]">
					<SubscribeDialogHeader className="items-center pt-10  gap-y-6 flex flex-col">
						<SubscribeDialogTitle className="md:text-2xl ">
							Block{" "}
							<span className="text-accent-color ">@{authorUsername}</span>?
						</SubscribeDialogTitle>
						<SubscribeDialogDescription className="text-center md:text-base text-neutral-100 font-inter font-light">
							They will be able to see your public posts, but will no longer be
							able to engage with them. they will also not be able to follow or
							message you, and you will not see notifications from them.
						</SubscribeDialogDescription>
					</SubscribeDialogHeader>
					<SubscribeDialogFooter className="w-full gap-y-8 items-center flex flex-col mt-10">
						<motion.button
							className="relative  cursor-pointer select-none  justify-center overflow-hidden  transition-all duration-150 active:scale-95 rounded flex items-center w-full gap-2.5 border  active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-red-500 bg-transparent shadow-[2px_2px_0_0_#FF007F] text-red-500"
							onMouseDown={handleMouseDown}
							onMouseUp={handleMouseUp}
							onMouseLeave={handleMouseLeave}
							onTouchStart={handleMouseDown}
							onTouchEnd={handleMouseUp}
							whileTap={{ scale: 0.97 }}
							disabled={isBlocking || isPending}
						>
							{/* Background fill animation */}
							{!isBlocking && (
								<motion.span
									className="absolute inset-0 bg-red-500"
									initial={{ x: "-100%" }}
									animate={{ x: isHolding ? `${progress - 100}%` : "-100%" }}
									transition={{ duration: 0, ease: "easeInOut" }}
								/>
							)}

							{isPending ? (
								<span className="flex items-center gap-x-1">
									<span
										className={cn(
											`relative z-10 bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent transition-colors duration-150`
										)}
									>
										Blocking...
									</span>
									<span>
										<Loader className="size-5 animate-spin text-red-500" />
									</span>
								</span>
							) : (
								<span
									className={cn(
										`relative z-10 block bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent transition-colors duration-150`,
										isHolding ? "mix-blend-difference" : ""
									)}
								>
									{isHolding ? "Hold to Block" : "Block"}
								</span>
							)}
						</motion.button>

						<Button
							onClick={() => setBlockModal(false)}
							className="text-accent-text bg-transparent"
						>
							Cancel
						</Button>
					</SubscribeDialogFooter>
				</div>
			</SubscribeDialogContent>
		</SubscribeDialog>
	);
}
