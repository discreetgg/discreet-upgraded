"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/constants/constants";

interface ImageWithFallbackProps
	extends Omit<ImageProps, "src" | "onError" | "onLoad"> {
	onImageError?: (src: string) => void;
	onImageLoad?: (src: string) => void;
	setErrorImage?: (hasError: boolean) => void;
	src: string;
	fallbackSrc?: string;
	containerClassName?: string;
	showErrorText?: boolean;
}
const RETRY_AFTER = 30000; // 30 seconds
export function ImageWithFallback({
	src,
	alt,
	fallbackSrc = FALLBACK_IMAGE,
	className,
	containerClassName,
	showErrorText = true,
	onImageError,
	onImageLoad,
	setErrorImage,
	...props
}: ImageWithFallbackProps) {
	const [imgSrc, setImgSrc] = useState(src);

	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [retryCount, setRetryCount] = useState(0);
	const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
		};
	}, []);

	const handleError = () => {
		if (retryCount < 2 && imgSrc !== fallbackSrc) {
			setRetryCount((prev) => prev + 1);

			retryTimerRef.current = setTimeout(() => {
				console.log(
					`Retrying image load for "${src}" (attempt ${retryCount + 1})`
				);
				setImgSrc(src + `?retry=${Date.now()}`);
			}, RETRY_AFTER);
			return;
		}

		if (imgSrc !== fallbackSrc) {
			setImgSrc(fallbackSrc);
		}
		setHasError(true);
		setErrorImage?.(true);
		setIsLoading(false);
		onImageError?.(src);
	};

	const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
		if (event.currentTarget.width === 0) {
			handleError();
		} else {
			setIsLoading(false);
			setHasError(false);
			onImageLoad?.(src);
		}
	};

	return (
		<div
			className={cn(
				"size-full relative flex items-center justify-center overflow-hidden",
				containerClassName
			)}
		>
			{isLoading && (
				<div className="absolute inset-0 z-10 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] rounded-xl" />
			)}
			<Image
				{...props}
				src={imgSrc}
				alt={alt}
				className={cn("data-[error=true]:opacity-60 ", className)}
				data-error={hasError}
				onError={handleError}
				onLoad={handleLoad}
				onContextMenu={(e) => e.preventDefault()}
				draggable={false}
			/>
			{hasError && (
				<div
					data-error={showErrorText}
					className="absolute left-1/2 -translate-x-1/2 rounded-full text-neutral-800 px-3 z-30 py-1 text-sm md:text-2xl font-bold w-full uppercase text-center opacity-0 data-[error=true]:opacity-100 transition-all duration-300 ease-in-out"
				>
					unable to load Image
				</div>
			)}
		</div>
	);
}
