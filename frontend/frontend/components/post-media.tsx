import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { cn, getBlurredImage } from "@/lib/utils";
import type { CommentType, MediaType, PostType } from "@/types/global";
import { motion } from "motion/react";
import Image from "next/image";
import { AuthPromptDialog } from "./auth-prompt-dialog";
import { PostMediaDialog } from "./post-media-dialog";
import { useState } from "react";
import { FALLBACK_IMAGE } from "@/constants/constants";
import { VideoPlayer } from "./shared/video-player";

export const PostMedia = ({
	media,
	content,
}: {
	media: MediaType[];
	content: PostType | CommentType;
}) => {
	const { isAuthenticated } = useAuth();
	const { showExplicitContent } = useGlobal();

	if (!media || media.length === 0) {
		return null;
	}

	const MediaDialog = isAuthenticated ? PostMediaDialog : AuthPromptDialog;

	const gridClasses = (() => {
		if (media.length === 1) {
			return "grid-cols-1";
		}
		if (media.length === 2) {
			return "grid-cols-2";
		}
		return "grid-cols-2 md:grid-cols-2"; // Twitter uses 2x2 for 3+ images
	})();

	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
	const handleImageError = (src: string) => {
		setFailedImages((prev) => new Set([...prev, src]));
	};

	// Store aspect ratios for media (keyed by url) so we can size the container
	const [mediaAspects, setMediaAspects] = useState<Record<string, number>>({});
	const setAspectFor = (url: string, width: number, height: number) => {
		if (!width || !height) return;
		const raw = width / height;
		// Clamp to reasonable bounds to avoid extreme tall/wide containers
		const aspect = Math.max(0.45, Math.min(raw, 4));
		setMediaAspects((prev) => ({ ...prev, [url]: aspect }));
	};

	const getImageSrc = (originalSrc: string) => {
		return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
	};

	return (
		<div className="rounded-2xl overflow-hidden"
		onContextMenu={(e) => e.preventDefault()}
		>
			<div className={cn("grid gap-1", gridClasses)}>
				{media.slice(0, 4).map((item, index) => (
					<motion.div
						key={item._id ?? index}
						className={cn(
							"relative w-full !overflow-hiddenx bg-black py-4x cursor-auto",
							media.length > 1 ? "aspect-square" : "aspect-[16/9]"
						)}
						style={
							// If we have a computed aspect for this media and it's a single item, use it
							media.length === 1 && mediaAspects[item.url]
								? { aspectRatio: mediaAspects[item.url] }
								: undefined
						}
					>
						{item.type === "image" ? (
							<MediaDialog
								key={item._id ?? index}
								content={content}
								media={media}
								activeMediaIndex={index}
								activeMedia={item}
							>
								<Image
									src={
										showExplicitContent
											? getImageSrc(item.url)
											: getBlurredImage(getImageSrc(item.url))
									}
									alt={item.caption || `Post media ${index + 1}`}
									fill
									data-error={failedImages.has(item.url)}
									className="object-contain duration-150 data-[error=true]:opacity-50"
									sizes="(max-width: 768px) 100vw, 700px"
									onContextMenu={(e) => e.preventDefault()}
									draggable={false}
									onError={() => handleImageError(item.url)}
									onLoad={(result) => {
										const image = result.currentTarget;
										if (
											image.width === 0 ||
											!image.naturalWidth ||
											!image.naturalHeight
										) {
											handleImageError(item.url);
											return;
										}
										setAspectFor(item.url, image.naturalWidth, image.naturalHeight);
									}}
								/>
							</MediaDialog>
						) : item.type === "video" ? (
							<VideoPlayer src={item.url} key={item._id ?? index} />
						) : null}
						{failedImages.has(item.url) && (
							<div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full text-accent-gray px-3 py-1 text-xl font-bold  w-full uppercase text-center">
								unable to load {item.type}
							</div>
						)}
					</motion.div>
				))}
			</div>
			{media.length > 4 && (
				<div className="text-sm text-gray-500 mt-1">
					+{media.length - 4} more media not shown
				</div>
			)}
		</div>
	);
};
