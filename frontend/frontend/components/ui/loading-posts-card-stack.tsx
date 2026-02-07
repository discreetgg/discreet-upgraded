"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

let interval: any;

const CARDS = [
	{
		id: 0,
		content: <div />,
	},
	{
		id: 1,
		content: <div />,
	},
	{
		id: 2,
		content: <div />,
	},
];

type Card = {
	id: number;
	content: React.ReactNode;
};

export const LoadingPostsCardStack = ({
	offset,
	scaleFactor,
	title,
	className,
}: {
	offset?: number;
	scaleFactor?: number;
	className?: string;
	title?: string;
}) => {
	const CARD_OFFSET = offset || 10;
	const SCALE_FACTOR = scaleFactor || 0.06;
	const [cards, setCards] = useState<Card[]>(CARDS);

	useEffect(() => {
		startFlipping();

		return () => clearInterval(interval);
	}, []);
	const startFlipping = () => {
		interval = setInterval(() => {
			setCards((prevCards: Card[]) => {
				const newArray = [...prevCards];
				const last = newArray.pop();
				if (last !== undefined) {
					newArray.unshift(last);
				}
				return newArray;
			});
		}, 5000);
	};

	return (
		<div
			className={cn(
				"relative flex flex-col items-center gap-[145px]",
				className
			)}
		>
			<div className="relative w-[331px] ">
				{cards.map((card, index) => {
					return (
						<motion.div
							key={card.id}
							className="absolute bg-[#0F1114] w-full rounded-[8px] p-4 shadow-[2px_2px_0_0_#1E1E21] border border-[#1E1E21]  flex flex-col gap-[17px] justify-between"
							style={{
								transformOrigin: "top center",
							}}
							animate={{
								top: index * -CARD_OFFSET,
								scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
								zIndex: cards.length - index, //  decrease z-index for the cards that are behind
							}}
						>
							<div className="flex gap-4 items-center">
								<Skeleton className="rounded-full size-4 p-4" />
								<div className="space-y-1">
									<Skeleton className="rounded-[21px] bg-[#1F2227] w-[74px] h-[10px]" />
									<Skeleton className="rounded-[21px] bg-[#1F2227] w-[145px] h-[10px]" />
								</div>
							</div>
							<div className="space-y-1.5">
								<Skeleton className="rounded-[21px] bg-[#1F2227] w-[247px] h-[10px]" />
								<Skeleton className="rounded-[21px] bg-[#1F2227] w-[301px] h-[10px]" />
								<Skeleton className="rounded-[21px] bg-[#1F2227] w-[247px] h-[10px]" />
							</div>
						</motion.div>
					);
				})}
			</div>
			<p className="text-[#8A8C95] text-lg text-center">{title}</p>
		</div>
	);
};
