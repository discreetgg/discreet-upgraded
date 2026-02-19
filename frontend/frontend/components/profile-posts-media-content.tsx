"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { LoadingPostsCardStack } from "./ui/loading-posts-card-stack";
import { useGlobal } from "@/context/global-context-provider";
import { ProfilePostMediaDialog } from "./profile-post-media-dialog";
import { cn, getBlurredImage } from "@/lib/utils";
import { AuthenticatedMedia } from "./authenticated-media";
import { Play } from "lucide-react";

const MEDIA_TABS = ["all", "images", "videos"];
const FALLBACK_IMAGE = "/logo.png";

interface Props {
	media: PostMediaType[];
}
export const ProfilePostsMediaContent = ({ media }: Props) => {
	const { showExplicitContent } = useGlobal();

	const [currTab, setCurrTab] = useState("all");

	const IMAGE_COUNT = media.filter((media) => media.type === "image").length;
	const VIDEO_COUNT = media.filter((media) => media.type === "video").length;

	const filteredMedia = media
		.map((entry, index) => ({
			entry,
			originalIndex: index,
		}))
		.filter(({ entry }) => {
			if (currTab === "all") return true;
			if (currTab === "images") return entry.type === "image";
			return entry.type === "video";
		});
	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
	const handleImageError = (src: string) => {
		setFailedImages((prev) => new Set([...prev, src]));
	};

	const getImageSrc = (originalSrc: string) => {
		return failedImages.has(originalSrc) ? FALLBACK_IMAGE : originalSrc;
	};

	if (media.length === 0) {
		return <LoadingPostsCardStack title="No media yet" className="mt-10" />;
	}
	return (
		<div className="flex flex-col w-full gap-y-5">
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-x-4">
					{MEDIA_TABS.map((tab) => (
						<Button
							key={tab}
							onClick={() => setCurrTab(tab)}
							data-state={currTab === tab ? "active" : "inactive"}
							className="px-4 w-fit text-sm text-accent-text capitalize  py-1 rounded-2xl border-none font-inter font-normal data-[state=active]:bg-gray-bg data-[state=active]:text-off-white"
							variant={"ghost"}
							size={"ghost"}
						>
							{tab === "all"
								? "All"
								: tab === "images"
								? `${IMAGE_COUNT} Images`
								: `${VIDEO_COUNT} Videos `}
						</Button>
					))}
				</div>
			</div>
			<div
				className={cn(
					"grid grid-cols-2 md:grid-cols-3 gap-1 lg:gap-2 min-h-[400px]"
				)}
			>
				{filteredMedia.map(({ entry: item, originalIndex }, index) => (
					<ProfilePostMediaDialog
						key={`${item.mediaUrl}-${originalIndex}`}
						media={media}
						activeMediaIndex={originalIndex}
						showExplicitContent={showExplicitContent ?? false}
					>
						<div
							className={cn(
								"relative w-full h-[200px] aspect-square overflow-hidden rounded-xl border border-[#1E2227] flex items-center justify-center",
								item.type === "video"
									? "bg-[linear-gradient(180deg,#190D1A_0%,#0C0A12_100%)]"
									: "bg-[#0F1114]"
							)}
						>
							{item.type === "image" ? (
								<AuthenticatedMedia
									type="image"
									src={
										showExplicitContent
											? getImageSrc(item.mediaUrl)
											: getBlurredImage(getImageSrc(item.mediaUrl))
									}
									alt={`Post media ${index + 1}`}
									fill
									className={cn(
										"object-cover duration-150",
										!showExplicitContent && "blur-2xl scale-110 brightness-50",
										failedImages.has(item.mediaUrl) && "opacity-50"
									)}
									sizes="(max-width: 768px) 50vw, 33vw"
									onMediaError={() => handleImageError(item.mediaUrl)}
								/>
							) : item.type === "video" ? (
								<>
									<AuthenticatedMedia
										type="video"
										src={item.mediaUrl}
										alt={`Post media ${index + 1}`}
										className={cn(
											"w-full h-full object-cover",
											!showExplicitContent && "blur-2xl scale-110 brightness-50"
										)}
										videoProps={{
											muted: true,
											playsInline: true,
											preload: "metadata",
										}}
										onMediaError={() => handleImageError(item.mediaUrl)}
									/>
									{showExplicitContent && (
										<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
											<div className="rounded-full bg-black/60 p-3 text-white">
												<Play className="size-6 fill-current" />
											</div>
										</div>
									)}
								</>
							) : null}
							{failedImages.has(item.mediaUrl) && (
								<div className="absolute left-1/2 -translate-x-1/2 rounded-full text-accent-gray px-3 py-1 text-xl font-bold w-full uppercase text-center">
									unable to load {item.type}
								</div>
							)}
						</div>
					</ProfilePostMediaDialog>
				))}
			</div>
		</div>
	);
};
