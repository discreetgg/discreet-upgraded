/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import { Icon } from "../ui/icons";
import { ImageWithFallback } from "./image-with-fallback";

interface SelectedImageState {
	index: number;
	rect: DOMRect;
}

interface Props {
	width?: number;
	height?: number;
	image: string;

	alt?: string;
	imageClassName?: HTMLImageElement["className"];
	containerClassName?: HTMLDivElement["className"];
	transitionDurationMs?: number;
	crossfadeDurationMs?: number;
	quality?: number;
	isBanner?: boolean;
}

export default function ViewImageModal({
	image,
	imageClassName,
	containerClassName,
	transitionDurationMs = 250,
	crossfadeDurationMs = 200,
	width = 500,
	height = 500,
	alt = "Image",
	quality = 75,
	isBanner = false,
}: Props) {
	const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(
		null
	);
	const [modalImageContainerStyle, setModalImageContainerStyle] =
		useState<CSSProperties>({});
	const [isAnimating, setIsAnimating] = useState(false);

	const [modalBgOpacity, setModalBgOpacity] = useState(0);

	const galleryRef = useRef<HTMLDivElement>(null);

	const getGridImageElement = (index: number) => {
		if (!galleryRef.current) return null;
		return galleryRef.current.querySelector(`[data-image-index="${index}"]`);
	};

	const calculateModalTargetStyle = useCallback(
		(imgIndex: number, initialRect: DOMRect) => {
			if (!image || imgIndex < 0) {
				console.error(
					"Invalid image index or images array in calculateModalTargetStyle"
				);
				return {};
			}

			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			const padding = Math.min(40, viewportWidth * 0.05, viewportHeight * 0.05);

			const maxModalWidth = viewportWidth - padding * 2;
			const maxModalHeight = viewportHeight - padding * 2;

			const originalWidth = width ?? initialRect.width;
			const originalHeight = height ?? initialRect.height;

			const aspectRatio =
				originalHeight > 0 ? originalWidth / originalHeight : 1;

			let targetWidth = maxModalWidth;
			let targetHeight = targetWidth / aspectRatio;

			if (targetHeight > maxModalHeight) {
				targetHeight = maxModalHeight;
				targetWidth = targetHeight * aspectRatio;
			}

			targetWidth = Math.max(initialRect.width, targetWidth);
			targetHeight = Math.max(initialRect.height, targetHeight);

			const finalTop = (viewportHeight - targetHeight) / 2;
			const finalLeft = (viewportWidth - targetWidth) / 2;

			return {
				top: `${finalTop}px`,
				left: `${finalLeft}px`,
				width: `${targetWidth}px`,
				height: `${targetHeight}px`,
			};
		},
		[height, image, width]
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const openModal = useCallback(
		(index: number) => {
			if (!image) return;

			const imgElementWrapper = getGridImageElement(index);
			if (!imgElementWrapper || isAnimating) return;

			const rect = imgElementWrapper.getBoundingClientRect();
			setSelectedImage({ index, rect });
			setIsAnimating(true);
			setModalBgOpacity(0);

			setModalImageContainerStyle({
				top: `${rect.top}px`,
				left: `${rect.left}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				transform: "translate(0, 0) scale(1)",
				transition: "none",
				visibility: "visible",
				opacity: 1,
			});

			setTimeout(() => setModalBgOpacity(1), 50);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const targetStyle = calculateModalTargetStyle(index, rect);
					setModalImageContainerStyle({
						...targetStyle,
						transform: "translate(0, 0) scale(1)",
						transition: `all ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
						visibility: "visible",
						opacity: 1,
					});

					setTimeout(() => {
						setIsAnimating(false);
					}, transitionDurationMs);
				});
			});
		},
		[isAnimating, calculateModalTargetStyle, image, transitionDurationMs]
	);
	const closeModal = useCallback(() => {
		if (!selectedImage || isAnimating) return;

		setIsAnimating(true);
		const { rect } = selectedImage;

		setModalBgOpacity(0);

		setModalImageContainerStyle((prevStyle) => ({
			...prevStyle,
			top: `${rect.top}px`,
			left: `${rect.left}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			transform: "translate(0, 0) scale(1)",
			transition: `all ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
			opacity: 1,
		}));

		setTimeout(() => {
			setSelectedImage(null);
			setIsAnimating(false);
			setModalImageContainerStyle({});
		}, transitionDurationMs);
	}, [selectedImage, isAnimating, transitionDurationMs]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (selectedImage === null || isAnimating) return;

			switch (event.key) {
				case "Escape":
					closeModal();
					break;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedImage, isAnimating, closeModal]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handleResize = () => {
			if (selectedImage && !isAnimating) {
				const imgElementWrapper = getGridImageElement(selectedImage.index);
				const currentRect = imgElementWrapper
					? imgElementWrapper.getBoundingClientRect()
					: selectedImage.rect ?? new DOMRect(0, 0, 0, 0);

				const targetStyle = calculateModalTargetStyle(
					selectedImage.index,
					currentRect
				);

				setModalImageContainerStyle((prev) => ({
					...prev,
					...targetStyle,
					transition: "none",
				}));
				setTimeout(() => {
					setModalImageContainerStyle((prev) => ({
						...prev,
						transition: `all ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
					}));
				}, 50);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [
		selectedImage,
		isAnimating,
		calculateModalTargetStyle,
		transitionDurationMs,
	]);

	if (!image) return null;

	return (
		<>
			<div
				ref={galleryRef}
				className={cn("relative size-full", containerClassName)}
			>
				<button
					data-image-index={0}
					className="group aspect-square overflow-hidden md:rounded-lg transition-shadow duration-300 size-full outline-none"
					onClick={() => openModal(0)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							openModal(0);
						}
					}}
					tabIndex={-1}
					type="button"
				>
					<ImageWithFallback
						src={image}
						alt={alt ?? "Image"}
						width={width ?? 1000}
						height={height ?? 1000}
						className={cn(
							"relative h-full w-full object-cover",
							imageClassName
						)}
						loading="eager"
						priority
						quality={quality}
					/>
				</button>
			</div>

			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center"
				style={{
					opacity: modalBgOpacity > 0 ? 1 : 0,
					visibility: modalBgOpacity > 0 ? "visible" : "hidden",
					transition: `opacity ${transitionDurationMs}ms ease-in-out, visibility 0s linear ${
						modalBgOpacity > 0 ? 0 : transitionDurationMs
					}ms`,
					pointerEvents:
						selectedImage !== null && !isAnimating ? "auto" : "none",
				}}
				aria-modal="true"
			>
				<div
					className="absolute inset-0 size-full cursor-pointer bg-black/80 backdrop-blur"
					onClick={closeModal}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							closeModal();
						}
					}}
					style={{
						opacity: modalBgOpacity,
						transition: `opacity ${transitionDurationMs}ms ease-in-out`,
					}}
				/>

				<div
					className="absolute pointer-events-none isolate z-[51] cursor-default "
					style={{
						...modalImageContainerStyle,
					}}
					onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
					onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
						// Prevent propagation for keyboard events as well
						e.stopPropagation();
					}}
				>
					<div
						data-banner={isBanner}
						className="absolute left-1/2 top-1/2 z-10 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center data-[banner=true]:text-[6vw] text-2xl text-white/10"
					>
						<p>DISCREET</p>
						<p>IMAGE LOADING...</p>
					</div>
					<div className="pointer-events-none absolute inset-0">
						{/* Vertical lines */}
						<div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
						<div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/20" />

						{/* Horizontal lines */}
						<div className="absolute left-0 right-0 top-1/3 h-px bg-white/20" />
						<div className="absolute left-0 right-0 top-2/3 h-px bg-white/20" />
					</div>

					{selectedImage !== null && (
						<ImageWithFallback
							key={selectedImage.index}
							width={isBanner ? 1500 : 500}
							height={isBanner ? 500 : 500}
							src={image ?? ""}
							alt={alt ?? "Image"}
							data-banner={isBanner}
							className="relative z-20 block object-contain data-[banner=false]:rounded-xl"
							style={{
								transition: `opacity ${crossfadeDurationMs}ms ease-in-out`,
							}}
							quality={quality}
						/>
					)}
					<Icon.dialogAddIcon className=" absolute -left-[7.9616445px] -top-[7.9616445px]" />
					<Icon.dialogAddIcon className=" absolute -right-[7.9616445px] -top-[7.9616445px]" />
					<Icon.dialogAddIcon className=" absolute -left-[7.9616445px] -bottom-[7.9616445px]" />
					<Icon.dialogAddIcon className=" absolute -right-[7.9616445px] -bottom-[7.9616445px]" />
				</div>
				<p className="absolute bottom-2 italic text-neutral-400 font-inter font-light text-sm">
					or click outside image box to close
				</p>

				{/* Close Button */}
				<Button
					type="button"
					onClick={closeModal}
					disabled={isAnimating}
					aria-label="Close image modal"
					style={{
						opacity: modalBgOpacity,
						transition: `opacity ${transitionDurationMs}ms ease-in-out`,
					}}
					className="rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap text-[#D4D4D8]  flex items-center gap-2 border-[#1E1E21] bg-[#0F1114] shadow-[2px_2px_0_0_#1E1E21] absolute right-6 top-[46px]"
				>
					<Icon.close />
					<span className="text-[15px] font-medium">Close</span>
				</Button>
			</div>
		</>
	);
}
