"use client";

import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { LoadingPostsCardStack } from "./ui/loading-posts-card-stack";
import Image from "next/image";
import { useGlobal } from "@/context/global-context-provider";
import { ProfilePostMediaDialog } from "./profile-post-media-dialog";
import { cn, getBlurredImage } from "@/lib/utils";

const MEDIA_TABS = ["all", "images", "videos"];
const FALLBACK_IMAGE = "/logo.png";

interface Props {
	media: PostMediaType[];
}
export const ProfilePostsMediaContent = ({ media }: Props) => {
	const { showExplicitContent } = useGlobal();

	const [currTab, setCurrTab] = useState("all");
	const [playingVideos, setPlayingVideos] = useState<{
		[key: string]: boolean;
	}>({});
	const [videoDurations, setVideoDurations] = useState<{
		[key: string]: number;
	}>({});

	const formatDuration = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const handleLoadedMetadata = useCallback(
		(videoId: string, event: React.SyntheticEvent<HTMLVideoElement>) => {
			const video = event.target as HTMLVideoElement;
			setVideoDurations((prev) => ({
				...prev,
				[videoId]: video.duration,
			}));
		},
		[]
	);

	const IMAGE_COUNT = media.filter((media) => media.type === "image").length;
	const VIDEO_COUNT = media.filter((media) => media.type === "video").length;

	const filteredMedia =
		currTab === "all"
			? media
			: currTab === "images"
			? media.filter((media) => media.type === "image")
			: media.filter((media) => media.type === "video");

	const handleVideoPlay = (videoId: string, videoElement: HTMLVideoElement) => {
		if (playingVideos[videoId]) {
			videoElement.pause();
			setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
		} else {
			videoElement.play();
			setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
		}
	};
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
					"grid grid-cols-2 md:grid-cols-3  gap-1 lg:gap-2 min-h-[400px]"
				)}
			>
				{filteredMedia.map((item, index) => (
					<ProfilePostMediaDialog
						key={item.mediaUrl ?? index}
						media={media}
						activeMediaIndex={index}
						showExplicitContent={showExplicitContent ?? false}
					>
						<div
							className={cn(
								"relative w-full h-[200px] aspect-square !overflow-hidden rounded-xl flex items-center justify-center bg-black"
							)}
						>
							{item.type === "image" ? (
								<Image
									src={
										showExplicitContent
											? getImageSrc(item.mediaUrl)
											: getBlurredImage(getImageSrc(item.mediaUrl))
									}
									alt={`Post media ${index + 1}`}
									width={700}
									height={700}
									data-error={failedImages.has(item.mediaUrl)}
									className="object-contain duration-150 size-full data-[error=true]:opacity-50"
									onContextMenu={(e) => e.preventDefault()}
									draggable={false}
									onError={() => handleImageError(item.mediaUrl)}
									onLoad={(result) => {
										if (result.currentTarget.width === 0) {
											handleImageError(item.mediaUrl);
										}
									}}
								/>
							) : item.type === "video" ? (
								<video
									controls
									className="w-full h-full object-contain"
									preload="metadata"
									onError={() => handleImageError(item.mediaUrl)}
									onLoad={(result) => {
										if (result.currentTarget.width === 0) {
											handleImageError(item.mediaUrl);
										}
									}}
								>
									<source src={item.mediaUrl} type="video/mp4" />
									<track kind="captions" label="English" />
								</video>
							) : null}
							{failedImages.has(item.mediaUrl) && (
								<div className="absolute  left-1/2 -translate-x-1/2 rounded-full text-accent-gray px-3 py-1 text-xl font-bold  w-full uppercase text-center">
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
