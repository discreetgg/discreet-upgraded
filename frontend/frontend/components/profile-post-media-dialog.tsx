"use client";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FALLBACK_IMAGE } from "@/constants/constants";
import { getBlurredImage } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export const ProfilePostMediaDialog = ({
	children,
	media,
	showExplicitContent,
	activeMediaIndex = 0,
}: {
	children?: React.ReactNode;
	media: PostMediaType[];
	showExplicitContent: boolean;
	activeMediaIndex?: number;
}) => {
	const [open, setOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(activeMediaIndex);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") {
				setCurrentIndex((prev) => (prev + 1) % media.length);
			} else if (e.key === "ArrowLeft") {
				setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [open, media.length]);
	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
	const handleImageError = (src: string) => {
		setFailedImages((prev) => new Set([...prev, src]));
	};

	const getImageSrc = (originalSrc: string) => {
		return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
	};
	const current = media[currentIndex];

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild onClick={() => setCurrentIndex(activeMediaIndex)}>
				{children}
			</DialogTrigger>
			<DialogTitle className="sr-only">Post Media</DialogTitle>
			<DialogContent
				className="p-0 max-w-full bg-black/90"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-center h-full w-full">
					{current.type === "image" ? (
						<div 
							className="relative w-full h-full flex items-center justify-center"
							onContextMenu={(e) => e.preventDefault()}
						>
							<Image
								src={
									showExplicitContent
										? getImageSrc(current.mediaUrl)
										: getBlurredImage(getImageSrc(current.mediaUrl))
								}
								alt={"Post media "}
								width={1200}
								height={1200}
								data-error={failedImages.has(current.mediaUrl)}
								className="object-cover hover:scale-105 aspect-square5 duration-150 size-full data-[error=true]:opacity-50"
								onContextMenu={(e) => e.preventDefault()}
								draggable={false}
								onError={() => handleImageError(current.mediaUrl)}
								onLoad={(result) => {
									if (result.currentTarget.width === 0) {
										handleImageError(current.mediaUrl);
									}
								}}
							/>
						</div>
					) : current.type === "video" ? (
						<video
							src={current.mediaUrl}
							controls
							autoPlay
							className="max-h-[90vh] w-auto mx-auto rounded-lg"
							onError={() => handleImageError(current.mediaUrl)}
							onLoad={(result) => {
								if (result.currentTarget.width === 0) {
									handleImageError(current.mediaUrl);
								}
							}}
						>
							<track
								kind="captions"
								src=""
								srcLang="en"
								label="English captions"
								default
							/>
						</video>
					) : null}
					{failedImages.has(current.mediaUrl) && (
						<div className="absolute  left-1/2 -translate-x-1/2 rounded-full text-accent-gray px-3 py-1 text-2xl font-bold  w-full uppercase text-center">
							unable to load {current.type}
						</div>
					)}
				</div>

				{media.length > 1 && (
					<>
						<button
							type="button"
							className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl z-40"
							onClick={() =>
								setCurrentIndex(
									(prev) => (prev - 1 + media.length) % media.length
								)
							}
						>
							<ChevronLeft />
						</button>
						<button
							type="button"
							className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl z-40"
							onClick={() =>
								setCurrentIndex((prev) => (prev + 1) % media.length)
							}
						>
							<ChevronRight />
						</button>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};
