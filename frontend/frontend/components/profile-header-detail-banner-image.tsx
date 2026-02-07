"use client";

import { useGlobal } from "@/context/global-context-provider";
import { uploadBannerImageService } from "@/lib/services";
import type { FileWithPreview, ProfileBannerType } from "@/types/global";
import type { AxiosProgressEvent } from "axios";
import { useCallback, useState } from "react";
import { type FileWithPath, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { BannerImageCropper } from "./ui/banner-image-cropper";
import { Icon } from "./ui/icons";

const accept = {
	"image/*": [],
};

export const ProfileHeaderDetailBannerImage = () => {
	const { user, setUser } = useGlobal();

	const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
		null,
	);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);

	const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
		if (acceptedFiles.length > 0) {
			const file = acceptedFiles[0];
			const fileWithPreview = Object.assign(file, {
				preview: URL.createObjectURL(file),
			});
			setDialogOpen(true);
			setSelectedFile(fileWithPreview);
		}
	}, []);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept,
	});

	const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
		if (progressEvent.total) {
			const percentage = Math.round(
				(progressEvent.loaded * 100) / progressEvent.total,
			);
			setProgress(percentage);
		}
	};

	const handleImageUpload = async (image: File) => {
		if (!image) {
			return;
		}
		setLoading(true);

		await uploadBannerImageService({
			discordId: user?.discordId ?? "",
			image,
			onUploadProgress,
		})
			.then((res) => {
				setLoading(false);
				toast.success(res.data.message);
				if (user) {
					setUser({
						...user,
						profileBanner: res.data.data as ProfileBannerType,
					});
				}
				setSelectedFile(res.data.url);
			})
			.catch((error) => {
				setLoading(false);
				console.error("Error uploading image:", error);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	return (
		<div>
			<BannerImageCropper
				dialogOpen={isDialogOpen}
				setDialogOpen={setDialogOpen}
				selectedFile={selectedFile}
				setSelectedFile={setSelectedFile}
				handleOnCropComplete={handleImageUpload}
				loading={loading}
				progress={progress}
			>
				<Avatar
					{...getRootProps()}
					className="rounded-none rounded-t-[10px]  bg-[#1E1E21] overflow-hidden aspect-3/1 size-full p-0 flex items-center justify-center relative max-h-[205px]  group"
				>
					<input {...getInputProps()} />
					<AvatarImage
						src={user?.profileBanner?.url}
						className="object-cover object-center rounded-none max-h-[205px]"
					/>
					<div
						title="Upload/Change Banner Image"
						className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
					>
						<Icon.selectPicture />
					</div>
					<AvatarFallback className="!rounded-none bg-[#1E1E21]">
						<Icon.selectPicture />
					</AvatarFallback>
				</Avatar>
			</BannerImageCropper>
		</div>
	);
};
