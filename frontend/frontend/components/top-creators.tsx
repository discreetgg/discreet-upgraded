"use client";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { DotButton, useDotButton } from "@/hooks/use-dot-button";
import { useCreators } from "@/hooks/queries/use-creators";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState, useRef, useMemo } from "react";
import { TopCreatorsCard } from "./top-creators-card";
import { Icon } from "./ui/icons";

export const TopCreators = () => {
	const [api, setApi] = useState<CarouselApi>();
	const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(api);
	const { data: creators, isLoading } = useCreators();
	const autoplayRef = useRef<ReturnType<typeof Autoplay> | null>(null);

	// Initialize autoplay plugin
	const autoplayPlugin = useMemo(() => {
		const plugin = Autoplay({
			delay: 3000,
		});
		autoplayRef.current = plugin;
		return plugin;
	}, []);

	useEffect(() => {
		if (!api) {
			return;
		}

		api.on("select", () => {});
		api.selectedScrollSnap;
	}, [api]);

	// Group creators into chunks of 3 for carousel items
	const creatorsChunks = creators
		? creators.reduce((acc: any[][], creator, index) => {
				const chunkIndex = Math.floor(index / 3);
				if (!acc[chunkIndex]) {
					acc[chunkIndex] = [];
				}
				acc[chunkIndex].push(creator);
				return acc;
		  }, [])
		: [];

	const handleMouseEnter = () => {
		if (autoplayRef.current && api && typeof autoplayRef.current.stop === 'function') {
			try {
				autoplayRef.current.stop();
			} catch (error) {
				// Silently handle errors if plugin is in invalid state
				console.warn('Failed to stop autoplay:', error);
			}
		}
	};

	const handleMouseLeave = () => {
		if (autoplayRef.current && api && typeof autoplayRef.current.play === 'function') {
			try {
				autoplayRef.current.play();
			} catch (error) {
				// Silently handle errors if plugin is in invalid state
				console.warn('Failed to play autoplay:', error);
			}
		}
	};

	return (
		<div className="space-y-6 w-full">
			<div className="sticky lg:top-6 z-10 bg-inherit flex items-center justify-between py-2">
				<h3 className="text-lg font-semibold"> Creators</h3>
				<Icon.creatorsMenu />
			</div>
			<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
				<Carousel
					data-horizontal-mask
					className="space-y-10"
					plugins={[autoplayPlugin]}
					setApi={setApi}
				>
					<CarouselContent>
						{isLoading ? (
							// Loading state - show 3 carousel items with loading cards
							<>
								<CarouselItem className="space-y-4 relative">
									<TopCreatorsCard />
									<TopCreatorsCard />
									<TopCreatorsCard />
								</CarouselItem>
								<CarouselItem className="space-y-4 relative">
									<TopCreatorsCard />
									<TopCreatorsCard />
									<TopCreatorsCard />
								</CarouselItem>
								<CarouselItem className="space-y-4 relative">
									<TopCreatorsCard />
									<TopCreatorsCard />
									<TopCreatorsCard />
								</CarouselItem>
							</>
						) : (
							// Render creators data
							creatorsChunks.map((chunk, chunkIndex) => (
								<CarouselItem key={chunkIndex} className="space-y-4 relative">
									{chunk.map((creator, index) => (
										<TopCreatorsCard
											key={creator.discordId}
											creator={creator}
										/>
									))}
								</CarouselItem>
							))
						)}
					</CarouselContent>
					<div className="relative flex max-w-[162px] gap-4 mx-auto justify-between">
						<CarouselPrevious className="!relative !translate-0 !left-0 !p-4 !size-6 !shadow-[2px_2px_0_0_#1E1E21] rounded-[4px] !border-[#1F2227] !border !bg-[#0A0A0A]" />
						<div className=" gap-[3px] flex items-center">
							{scrollSnaps.map((_, index) => {
								return (
									<DotButton
										key={Math.random()}
										onClick={() => onDotButtonClick(index)}
										className={cn(
											"size-[6.75px] rounded-full bg-[#FF007F] duration-300",
											index === selectedIndex ? " opacity-100" : " bg-[#3C3C42]"
										)}
									/>
								);
							})}
						</div>
						<CarouselNext className="!relative !translate-0 !right-0 !p-4 !size-6 !shadow-[2px_2px_0_0_#1E1E21] rounded-[4px] !border-[#1F2227] !border !bg-[#0A0A0A]" />
					</div>
				</Carousel>
			</div>
		</div>
	);
};
