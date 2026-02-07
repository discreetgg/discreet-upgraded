"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { cn, generateRandomId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DeleteMediaDialog } from "./delete-media-dialog";
import { z } from "zod";
import { Button } from "./ui/button";
import { Icon } from "./ui/icons";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useGlobal } from "@/context/global-context-provider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ComponentLoader } from "./ui/component-loader";
import { FileWarning, PlayIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import CircularLoader from "./miscellaneous/circular-loader";
import BlurImage from "./miscellaneous/blur-image";
import PreviewSideAdCard from "./cards/preview-side-ad-card";
import {
	createMenuItem,
	deleteMediaMenuItem,
	updateMenuItem,
} from "@/actions/menu-item";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const FormSchema = z.object({
	title: z.string().min(2, { message: "Title is required" }),
	description: z.string().min(3, { message: "Description is required" }),
	priceToView: z.string().min(1, { message: "Price is required" }),
	category: z
		.string()
		.min(1, { message: "Category is required" })
		.regex(/^[^\s]+$/, { message: "No spaces allowed in tag" }),
	noteToBuyer: z.string().optional(),
	type: z.enum(["single", "bundles"]),
});

interface MediaFile {
	_id: string;
	file?: File;
	url: string;
	type: "image" | "video";
}
interface CoverImage {
	_id: string;
	file?: File;
	url: string;
	type: "image";
}

interface Props {
	children: React.ReactNode;
	defaultValues?: MenuItemType;
	isUpdating?: boolean;
}

export const AddMenuItem = ({
	children,
	defaultValues,
	isUpdating = false,
}: Props) => {
	const { user } = useGlobal();
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			title: defaultValues?.title || "",
			description: defaultValues?.description || "",
			priceToView: defaultValues?.priceToView?.toString() || "",
			category: defaultValues?.category.category || "",
			noteToBuyer: defaultValues?.noteToBuyer || "",
			type: defaultValues?.type || "single",
		},
		mode: isUpdating ? "onChange" : "onBlur",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
		defaultValues?.media || [],
	);

	const [coverImage, setCoverImage] = useState<CoverImage | null>(
		defaultValues?.coverImage
			? {
					_id: defaultValues.coverImage._id || "",
					url: defaultValues.coverImage.url || "",
					type: "image",
				}
			: null,
	);

	const [fileError, setFileError] = useState("");

	const [open, setOpen] = useState(false);

	const [playingVideos, setPlayingVideos] = useState<{
		[key: string]: boolean;
	}>({});
	const [videoDurations, setVideoDurations] = useState<{
		[key: string]: number;
	}>({});
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [mediaToDelete, setMediaToDelete] = useState<{
		id: string;
		type: "image" | "video" | "cover";
	} | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const deleteMedia = useMutation({
		mutationFn: async (id: string) => {
			return await deleteMediaMenuItem(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["menu_item", user?.discordId],
			});
			localStorage.removeItem("temp_media");
		},
		onError: (error) => {
			console.error(error);
			toast.error("Failed to delete media", {
				description: error.message,
			});
			const restore = localStorage.getItem("temp_media");
			if (restore) {
				const restored = JSON.parse(restore);
				if (mediaToDelete?.type === "cover") {
					setCoverImage(restored);
				} else {
					setMediaFiles((prev) => [
						...prev,
						{
							_id: restored._id,
							type: restored.type,
							url: restored.url,
						} as MediaFile,
					]);
				}
				localStorage.removeItem("temp_media");
				setMediaToDelete(null);
			}
		},
		onSettled: () => {
			localStorage.removeItem("temp_media");
			setMediaToDelete(null);
		},
	});

	const shouldUpdateBtn = useCallback(() => {
		if (!defaultValues) return false;

		const formValues = form.getValues();

		// Check if basic form fields have changed
		const hasFormChanged =
			formValues.title.trim() !== defaultValues.title ||
			formValues.description.trim() !== defaultValues.description ||
			formValues.priceToView !== defaultValues.priceToView.toString() ||
			formValues.category !== defaultValues.category.category ||
			formValues.noteToBuyer !== defaultValues.noteToBuyer ||
			formValues.type !== defaultValues.type;

		// Check if media files have changed
		const defaultMediaIds = new Set(defaultValues.media.map((m) => m._id));
		const currentMediaIds = new Set(mediaFiles.map((m) => m._id));

		// Check if number of media items is different
		if (defaultMediaIds.size !== currentMediaIds.size) return true;

		// Check if all media IDs match
		const hasMediaChanged = [...defaultMediaIds].some(
			(id) => !currentMediaIds.has(id),
		);

		// Check if cover image has changed
		const hasCoverChanged = coverImage?._id !== defaultValues.coverImage._id;

		return hasFormChanged || hasMediaChanged || hasCoverChanged;
	}, [defaultValues, form, mediaFiles, coverImage, mediaFiles.length]);

	const isUploadedCoverImage = useMemo(() => {
		return coverImage?.url.startsWith("https") ?? false;
	}, [coverImage]);

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile.size > MAX_FILE_SIZE) {
			setFileError("File size exceeds 15MB");
			return;
		}

		setCoverImage({
			_id: `temp_${generateRandomId()}`,
			type: "image",
			url: URL.createObjectURL(droppedFile),
			file: droppedFile,
		});
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const selectedFile = e.target.files[0];
			if (selectedFile.size > MAX_FILE_SIZE) {
				setFileError("File size exceeds 15MB");
				e.target.value = "";
				return;
			}
			setCoverImage({
				_id: `temp_${generateRandomId()}`,
				type: "image",
				url: URL.createObjectURL(selectedFile),
				file: selectedFile,
			});
			e.target.value = "";
		}
	};

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
		[],
	);
	const handleVideoPlay = (videoId: string, videoElement: HTMLVideoElement) => {
		if (playingVideos[videoId]) {
			videoElement.pause();
			setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
		} else {
			videoElement.play();
			setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
		}
	};

	// Media handling functions
	const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);

		for (const file of files) {
			const fileId = generateRandomId();
			const fileType = file.type.startsWith("image/") ? "image" : "video";

			if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
				setMediaFiles((prev) => [
					...prev,
					{
						_id: fileId,
						file,
						type: fileType,
						url: URL.createObjectURL(file),
					} as MediaFile,
				]);
			}
		}
	};

	const removeCoverImage = (id: string) => {
		setMediaToDelete({ id, type: "cover" });
		setDeleteDialogOpen(true);
	};
	const removeMedia = (id: string) => {
		const fileToRemove = mediaFiles.find((file) => file._id === id);
		if (!fileToRemove) return;

		if (fileToRemove._id.startsWith("temp_")) {
			URL.revokeObjectURL(fileToRemove.url);
			setMediaFiles((prev) => prev.filter((file) => file._id !== id));
		} else {
			// Open confirmation dialog for existing media
			setMediaToDelete({ id, type: fileToRemove.type });
			setDeleteDialogOpen(true);
		}
	};

	const handleConfirmCoverImageDelete = () => {
		if (!defaultValues?.coverImage._id) return;
		localStorage.setItem("temp_media", JSON.stringify(coverImage));
		deleteMedia.mutate(defaultValues?.coverImage._id);
		setCoverImage(null);

		setDeleteDialogOpen(false);
	};
	const handleConfirmDelete = () => {
		if (!mediaToDelete) return;

		const fileToRemove = mediaFiles.find(
			(file) => file._id === mediaToDelete.id,
		);
		if (!fileToRemove) return;

		localStorage.setItem("temp_media", JSON.stringify(fileToRemove));
		deleteMedia.mutate(mediaToDelete.id);
		setMediaFiles((prev) =>
			prev.filter((file) => file._id !== mediaToDelete.id),
		);

		setDeleteDialogOpen(false);
	};

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		if (!user?.discordId) {
			toast.error("User not authenticated");
			return;
		}
		if (!coverImage) {
			toast.error("Cover image is required");
			return;
		}
		if (!data.category) {
			toast.error("Add a Category");
			return;
		}
		if (mediaFiles.length === 0) {
			toast.error("Add at least one media file");
			return;
		}
		setIsSubmitting(true);
		setOpen(false);

		try {
			const cacheKey = ["menu_item", user?.discordId];
			const formData = new FormData();

			// Add basic form fields
			formData.append("title", data.title);
			formData.append("description", data.description);
			formData.append("priceToView", data.priceToView);
			formData.append("itemCount", mediaFiles.length.toString());
			if (data.noteToBuyer) formData.append("noteToBuyer", data.noteToBuyer);
			formData.append("type", data.type);

			formData.append("category", data.category);

			if (isUpdating && defaultValues && defaultValues._id) {
				const updatedFiles = mediaFiles.filter((file) =>
					file._id.startsWith("temp_"),
				);
				const updatedCoverImage = coverImage._id.startsWith("temp_")
					? coverImage
					: null;
				const allUpdatedFiles = [updatedCoverImage, ...updatedFiles].filter(
					Boolean,
				);

				if (allUpdatedFiles.length > 0) {
					for (const file of allUpdatedFiles) {
						// @ts-expect-error any
						formData.append("files", file.file);
					}
					const mediaMetaData = allUpdatedFiles.map((file, idx) => {
						// @ts-expect-error any
						const fileType = file.type.startsWith("image") ? "image" : "video";
						return {
							caption:
								updatedCoverImage && idx === 0
									? "cover image"
									: "content media",
							type: fileType,
						};
					});

					formData.append("mediaMeta", JSON.stringify(mediaMetaData));
				}
				const previous = queryClient.getQueryData<MenuItemType[] | undefined>(
					cacheKey,
				);

				if (Array.isArray(previous)) {
					const optimisticUpdated = {
						...defaultValues,

						title: data.title,
						description: data.description,
						priceToView: data.priceToView,
						category: { category: data.category },
						noteToBuyer: data.noteToBuyer,
						type: data.type,
						coverImage: coverImage
							? {
									_id: coverImage._id,
									url: coverImage.url,
									type: coverImage.type,
								}
							: defaultValues.coverImage,
						media: mediaFiles.map((m) => ({
							_id: m._id,
							url: m.url,
							type: m.type,
						})),
						itemCount: mediaFiles.length,
						updatedAt: new Date().toISOString(),
					};

					queryClient.setQueryData(cacheKey, (old: MenuItemType[]) => {
						if (!Array.isArray(old)) return old;
						return old.map((it) =>
							it._id === defaultValues._id ? optimisticUpdated : it,
						);
					});
				}

				const response = await updateMenuItem({
					formData,
					menuId: defaultValues._id,
				});
				if (response.data || response.statusText === "Updated") {
					queryClient.invalidateQueries({
						queryKey: ["menu_item", user?.discordId],
					});
					toast.success("Menu item updated successfully", { duration: 5000 });
				}
			} else {
				const allFiles = [
					coverImage.file,
					...mediaFiles.map((file) => file.file),
				];
				for (const file of allFiles) {
					// @ts-expect-error any
					formData.append("files", file);
				}

				// Add media metadata as JSON array
				const mediaMetaData = allFiles.map((file, idx) => {
					const fileType =
						// @ts-ignore
						file.type.startsWith("image") ? "image" : "video";
					return {
						caption: idx === 0 ? "cover image" : "content media",
						type: fileType,
					};
				});

				formData.append("mediaMeta", JSON.stringify(mediaMetaData));

				// Optimistic update: insert a temp item into cache immediately

				const previousMenuItems = queryClient.getQueryData<
					MenuItemType[] | undefined
				>(cacheKey);
				const tempId = `temp_${generateRandomId()}`;
				const optimisticMenuItem = {
					...data,
					_id: tempId,
					type: data.type,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					coverImage: coverImage
						? {
								_id: coverImage._id || `${tempId}_c`,
								url: coverImage.url,
								type: "image",
							}
						: undefined,
					media: mediaFiles.map((m) => ({
						_id: m._id,
						url: m.url,
						type: m.type,
					})),
					itemCount: mediaFiles.length,
					author: {
						discordId: user.discordId,
					},
				} as unknown as MenuItemType;

				if (Array.isArray(previousMenuItems)) {
					queryClient.setQueryData(cacheKey, [
						optimisticMenuItem,
						...previousMenuItems,
					]);
				}

				// Create the post
				const response = await createMenuItem({ formData });

				if (response.data || response.statusText === "Created") {
					toast.success("Menu item created successfully", { duration: 5000 });

					form.reset();
					setMediaFiles([]);

					setCoverImage(null);
					const cacheKey = ["menu_item", user?.discordId];
					queryClient.setQueryData(
						cacheKey,
						(old: MenuItemType[] | undefined) => {
							if (!Array.isArray(old)) return old;

							return old.map((item) =>
								item._id === tempId
									? {
											...response.data,

											author: response.data.owner || response.data.author,

											owner: undefined,
										}
									: item,
							);
						},
					);
				}
			}
		} catch (error: any) {
			console.error("Failed to create post:", error);
			toast.error(`Failed to ${isUpdating ? "update" : "create"} post`, {
				description: error.response?.data?.message || error.message,
				duration: 5000,
			});
		} finally {
			setIsSubmitting(false);
			setOpen(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				tabIndex={-1}
				className="flex  !ring-0 !outline-none justify-center !w-full py-10 px-6 sm:max-w-full gap-8 bg-black"
			>
				<DialogDescription className="sr-only">
					{" "}
					Add new menu item
				</DialogDescription>

				<Form {...form}>
					<form
						className=" w-full space-y-[27px] sm:min-w-[450px] max-w-[600px]"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						<h1 className="text-[32px] font-semibold ">Add item to Menu</h1>
						<div className="bg-black rounded-2xl border border-[#232323]  overflow-hidden pb-5">
							<div className="overflow-y-auto max-h-[650px] space-y-8 p-4">
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Input
													{...field}
													placeholder="Title..."
													className="!bg-transparent p-0 w-full border-0 border-b !ring-0 font-medium  placeholder:text-[#3C3C42] md:text-xl text-lg rounded-none"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Textarea
													{...field}
													placeholder="Describe your item..."
													className="!bg-transparent p-0 w-full border-0 !ring-0  resize-none placeholder:text-[#3C3C42] min-h-[90px]"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{/* Media Preview */}
								{mediaFiles.length > 0 && (
									<div className="flex overflow-x-auto w-full gap-2 pb-4 pr-4">
										{mediaFiles.map((preview, index) => (
											<div
												key={index}
												className="relative aspect-square h-[160px] shrink-0 overflow-hidden rounded-lg"
											>
												{preview.type?.startsWith("image") ? (
													<img
														src={preview.url}
														alt="Preview"
														className="size-full object-cover rounded-lg hover:scale-105 duration-150 ease-in-out transition-transform"
													/>
												) : (
													<>
														<video
															src={preview.url}
															className="w-full h-full object-cover"
															loop
															muted
															id={`video-${preview._id}`}
															onLoadedMetadata={(e) =>
																handleLoadedMetadata(String(preview._id), e)
															}
														/>
														<Button
															variant="ghost"
															size="icon"
															className={`absolute inset-0 w-full h-full flex items-center justify-center ${
																playingVideos[preview._id]
																	? "opacity-0 group-hover:opacity-100 transition-opacity"
																	: ""
															}`}
															onClick={(e) => {
																e.preventDefault();
																const video = document.getElementById(
																	`video-${preview._id}`,
																) as HTMLVideoElement;
																handleVideoPlay(String(preview._id), video);
															}}
														>
															<div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
																<PlayIcon
																	className={`w-5 h-5 text-white ${
																		playingVideos[preview._id] ? "hidden" : ""
																	}`}
																/>
																<Icon.pause
																	className={`w-5 h-5 text-white ${
																		playingVideos[preview._id] ? "" : "hidden"
																	}`}
																/>
															</div>
														</Button>
														{videoDurations[preview._id] && (
															<div
																data-is-playing={playingVideos[preview._id]}
																className="absolute data-[is-playing=true]:opacity-0 transition-opacity  bottom-2 left-2 px-2 py-1 rounded text-white text-xs flex items-center gap-x-1"
															>
																<Icon.videoIcon className="w-4 h-4 mr-1" />
																{formatDuration(videoDurations[preview._id])}
															</div>
														)}
													</>
												)}
												<button
													type="button"
													onClick={() => removeMedia(preview._id)}
													className="absolute top-1 right-1 bg-primary text-white rounded-full size-5 flex items-center justify-center "
												>
													<X className="size-3" />
												</button>
											</div>
										))}
									</div>
								)}

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3 text-accent-text">
										<label htmlFor="media-upload" className="cursor-pointer">
											<Icon.image />
											<input
												id="media-upload"
												type="file"
												multiple
												accept="image/*,video/*"
												onChange={handleMediaSelect}
												className="hidden"
											/>
										</label>
										<label htmlFor="video-upload" className="cursor-pointer">
											<Icon.videoIcon />
											<input
												id="video-upload"
												type="file"
												multiple
												accept="video/*"
												onChange={handleMediaSelect}
												className="hidden"
											/>
										</label>
									</div>
								</div>
								{/* PRICE Selection */}
								<div>
									<FormField
										control={form.control}
										name="priceToView"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormControl>
													<div className="flex relative items-center h-14 w-full">
														<span className="absolute left-4 text-[#3C3C42]">
															{" "}
															<Icon.tip className="size-6" />
														</span>
														<Input
															type="number"
															placeholder={
																mediaFiles.length > 1 ? "Prices" : "Price"
															}
															{...field}
															className="h-full p-0 px-14 w-full border-0 !ring-0 font-medium placeholder:text-lg placeholder:font-normal   placeholder:text-[#9E9E9E] bg-main-bg"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div>
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem className="space-y-3">
												<FormControl>
													<RadioGroup
														onValueChange={field.onChange}
														defaultValue={field.value}
														className="flex items-center gap-10"
													>
														<FormItem className="flex items-center space-x-1 space-y-0">
															<FormControl>
																<RadioGroupItem
																	value="single"
																	className="size-8 border-accent-text text-accent-text"
																/>
															</FormControl>
															<Label className="font-medium text-lg text-muted-foreground">
																Single
															</Label>
														</FormItem>
														<FormItem className="flex items-center space-x-1 space-y-0">
															<FormControl>
																<RadioGroupItem
																	value="bundles"
																	className="size-8 border-accent-text text-accent-text"
																/>
															</FormControl>
															<Label className="font-medium text-lg text-muted-foreground">
																Bundles
															</Label>
														</FormItem>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<p className="text-[15px] text-[#8A8C95] font-medium">
											Add Item to Menu Category
										</p>

										{/* {!showTagInput && (
											<button
												type="button"
												className="text-[#[#FF007F]] flex items-center gap-2 font-medium text-[15px]"
												onClick={() => setShowTagInput((prev) => !prev)}
											>
												<Icon.addSquare />
												Add Category
											</button>
										)} */}
									</div>

									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<div className="relative">
													<Icon.hashTag className="absolute -translate-y-1/2 top-1/2 left-4" />
													<FormControl>
														<Input
															type="text"
															placeholder="Add tag"
															className="bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E] rounded-[8px]"
															{...field}
															onChange={(e) => {
																// Replace spaces immediately
																const value = e.target.value.replace(
																	/\s+/g,
																	"",
																);
																field.onChange(value);
															}}
														/>
													</FormControl>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="flex flex-col gap-y-2 px-3">
									<p className="text-accent-text">Cover Image</p>
									<div
										onDrop={handleDrop}
										onDragOver={handleDragOver}
										onDragEnter={handleDragEnter}
										onDragLeave={handleDragLeave}
										className="flex w-full h-[200px] flex-col gap-y-10 relative group "
									>
										{coverImage && (
											<div
												data-cover={isUploadedCoverImage}
												className="size-full  left-1/2 -translate-x-1/2 overflow-hidden rounded-xl absolute inset-0 data-[cover=true]:z-30"
											>
												<button
													type="button"
													data-cover={isUploadedCoverImage}
													onClick={() =>
														removeCoverImage(
															defaultValues?.coverImage._id ?? "",
														)
													}
													className="absolute top-1 right-1 bg-primary text-white rounded-full size-5 hidden items-center justify-center data-[cover=true]:flex"
												>
													<X className="size-3" />
												</button>
												<BlurImage
													src={coverImage.url}
													alt="cover"
													width={1000}
													height={300}
													className="size-full object-cover object-center rounded-xl"
												/>
											</div>
										)}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												fileInputRef.current?.click();
											}}
											data-image={coverImage !== null}
											className={cn(
												" flex h-full relative z-20 w-full justify-center items-center gap-y-4 rounded-2xl border border-dashed cursor-pointer  transition-all duration-300 bg-main-bg data-[image=true]:bg-main-bg/50 data-[image=true]:opacity-0 data-[image=true]:group-hover:opacity-100",
												isDragging
													? "border-accent-color bg-black/5 opacity-0 duration-300"
													: "border-neutral-600/80 opacity-100 duration-700 data-[image=true]:border-none",
											)}
										>
											<div className="flex flex-col items-center gap-y-1 font-inter">
												<Icon.selectPicture />
												<p className="md:text-2x  sm:text-xl">
													{isDragging
														? "Drop file(s) here"
														: "Choose a file or drag & drop"}
												</p>

												<p className="text-[10px]">
													Image size should not exceed{" "}
													{MAX_FILE_SIZE / 1024 / 1024}
													MB
												</p>
											</div>
											<input
												type="file"
												ref={fileInputRef}
												onChange={handleFileInput}
												multiple
												accept="image/*"
												className="sr-only"
											/>

											<AnimatePresence>
												{fileError !== "" && (
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: 40 }}
														exit={{ opacity: 0, height: 0 }}
														className="pointer-events-auto mt-2 flex items-center gap-x-2 rounded-xl bg-red-500/10 p-2 text-xs text-red-500"
													>
														<FileWarning className="size-4" />
														{fileError}
														<CircularLoader
															duration={5000}
															size={16}
															color="#ef4444"
															backgroundColor="#fca5a5 "
														/>
													</motion.div>
												)}
											</AnimatePresence>
										</button>
									</div>
								</div>
							</div>
						</div>
						<div className=" w-full">
							<Button
								type="submit"
								onClick={() => {
									if (isUpdating) return;
								}}
								disabled={
									isSubmitting ||
									(!shouldUpdateBtn() && isUpdating) ||
									form.formState.isValid === false
								}
								className="gap-2 !flex-1 h-auto w-full   flex items-center font-medium px-4 py-2 shadow-[2px_2px_0_0_#FF007F] text-lg border-[#FF007F] bg-[#0A0A0A] rounded border text-[#D4D4D8] disabled:border-accent-gray disabled:shadow-none disabled:opacity-50"
							>
								{isSubmitting ? <ComponentLoader /> : null}
								{defaultValues ? "Update" : "Publish"}
							</Button>
						</div>
					</form>
				</Form>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					exit={{ opacity: 0 }}
					className="flex w-full max-w-[400px] mt-20  flex-col gap-y-20"
				>
					<div className="hidden flex-col gap-y-3 ">
						<p className="text-lg font-medium">Preview</p>
						<PreviewSideAdCard
							description={form.watch("description")}
							priceToView={Number(form.watch("priceToView"))}
							title={form.watch("title")}
							tag={form.watch("category") ?? ""}
							image={coverImage?.url ? coverImage.url : "/logo.png"}
							isPlaceholder={!coverImage}
							itemsCount={mediaFiles.length}
						/>
					</div>
					<div className="flex flex-col gap-y-3">
						<p className="text-lg font-medium">Note to Buyers</p>
						<div className="flex flex-col p-2 bg-black border h-[210px] rounded-xl">
							<Textarea
								{...form.register("noteToBuyer")}
								value={form.watch("noteToBuyer")}
								placeholder="Say Something to buyers...."
								className="!bg-transparent p-0 w-full border-0 !ring-0  resize-none placeholder:text-[#3C3C42] h-full"
							/>
						</div>
						<p className="text-accent-color font-medium">
							Note: Once an item has been purchased, this menu can’t be edited.
							However, you can still edit
						</p>
					</div>
				</motion.div>
				<DeleteMediaDialog
					isOpen={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					onConfirm={
						mediaToDelete?.type === "cover"
							? handleConfirmCoverImageDelete
							: handleConfirmDelete
					}
					mediaType={mediaToDelete?.type || "image"}
				/>
			</DialogContent>
		</Dialog>
	);
};
