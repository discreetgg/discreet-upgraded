'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { cn, generateRandomId } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import { PlayIcon, X } from 'lucide-react';
import { useMediaAssetMutation } from '@/hooks/mutations/use-media-asset-mutation';
import type {
  AuthorType,
  MessageAuthorType,
  MessageType,
  UserType,
} from '@/types/global';
import { useChat } from '@/hooks/use-chat';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// export type MessageType = {
//   _id: string;
//   conversation: string;
//   sender: MessageAuthorType;
//   reciever: MessageAuthorType;
//   text: string;
//   type: MessageMediaType;
//   media: MediaType[];
//   isPayable?: boolean;
//   price?: string;
//   paid?: boolean;
//   paymentTx?: string;
//   callType: 'audio' | 'video';
//   callStatus: string;
//   callStartedAt: string;
//   missed: boolean;
//   status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
//   durationInSeconds: string;
//   title?: string;
//   description?: string;
//   createdAt: string;
//   updatedAt: string;
//   __v: number;
// };

const FormSchema = z.object({
  title: z.string().min(2, { message: 'Title is required' }),
  description: z.string().min(3, { message: 'Description is required' }),
  priceToView: z.string().min(1, { message: 'Price is required' }),
  // category: z
  // 	.string()
  // 	.min(1, { message: "Category is required" })
  // 	.regex(/^[^\s]+$/, { message: "No spaces allowed in tag" }),
  noteToBuyer: z.string().optional(),
});

interface MediaFile {
  _id: string;
  file?: File;
  url: string;
  type: 'image' | 'video';
}
interface CoverImage {
  _id: string;
  file?: File;
  url: string;
  type: 'image';
}

interface Props {
  defaultValues?: MenuItemType;
  setIsDemenuSubmitting?: (isDemenuSubmitting: boolean) => void;
  isUpdating?: boolean;
  onClose?: () => void;
  receiver?: AuthorType | UserType | null;
  onRegisterSubmit?: (submit: () => void) => void;
  onCreationSuccess?: () => void;
  conversationId?: string;
}

export const DmMenuCreation = ({
  defaultValues,
  isUpdating = false,
  onClose,
  receiver,
  onRegisterSubmit,
  onCreationSuccess,
  setIsDemenuSubmitting,
  conversationId,
}: Props) => {
  const { user } = useGlobal();
  const { receiver: receiverFromContext } = useMessage();
  const createMediaAsset = useMediaAssetMutation();
  useEffect(() => {
    if (createMediaAsset.isPending) {
      setIsDemenuSubmitting?.(true);
    } else {
      setIsDemenuSubmitting?.(false);
    }
  }, [createMediaAsset.isPending]);

  // Use receiver from props or context
  const actualReceiver = receiver || receiverFromContext;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      priceToView: defaultValues?.priceToView?.toString() || '',
      // category: defaultValues?.category.category || "",
      noteToBuyer: defaultValues?.noteToBuyer || '',
    },
    mode: isUpdating ? 'onChange' : 'onBlur',
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(
    defaultValues?.media || [],
  );

  const [coverImage, setCoverImage] = useState<CoverImage | null>(
    defaultValues?.coverImage
      ? {
          _id: defaultValues.coverImage._id || '',
          url: defaultValues.coverImage.url || '',
          type: 'image',
        }
      : null,
  );

  const [fileError, setFileError] = useState('');
  const [freePreviewMediaFiles, setFreePreviewMediaFiles] = useState<
    MediaFile[]
  >([]);

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
    type: 'image' | 'video' | 'cover';
  } | null>(null);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mediaFiles.forEach((file) => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
      freePreviewMediaFiles.forEach((file) => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
      if (coverImage?.url.startsWith('blob:')) {
        URL.revokeObjectURL(coverImage.url);
      }
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // API call removed temporarily
  // const deleteMedia = useMutation({
  // 	mutationFn: async (id: string) => {
  // 		return await deleteMediaMenuItem(id);
  // 	},
  // 	onSuccess: () => {
  // 		queryClient.invalidateQueries({
  // 			queryKey: ["menu_item", user?.discordId],
  // 		});
  // 		localStorage.removeItem("temp_media");
  // 	},
  // 	onError: (error) => {
  // 		console.error(error);
  // 		toast.error("Failed to delete media", {
  // 			description: error.message,
  // 		});
  // 		const restore = localStorage.getItem("temp_media");
  // 		if (restore) {
  // 			const restored = JSON.parse(restore);
  // 			if (mediaToDelete?.type === "cover") {
  // 				setCoverImage(restored);
  // 			} else {
  // 				setMediaFiles((prev) => [
  // 					...prev,
  // 					{
  // 						_id: restored._id,
  // 						type: restored.type,
  // 						url: restored.url,
  // 					} as MediaFile,
  // 				]);
  // 			}
  // 			localStorage.removeItem("temp_media");
  // 			setMediaToDelete(null);
  // 		}
  // 	},
  // 	onSettled: () => {
  // 		localStorage.removeItem("temp_media");
  // 		setMediaToDelete(null);
  // 	},
  // });

  const shouldUpdateBtn = useCallback(() => {
    if (!defaultValues) return false;

    const formValues = form.getValues();

    // Check if basic form fields have changed
    const hasFormChanged =
      formValues.title.trim() !== defaultValues.title ||
      formValues.description.trim() !== defaultValues.description ||
      formValues.priceToView !== defaultValues.priceToView.toString() ||
      // formValues.category !== defaultValues.category.category ||
      formValues.noteToBuyer !== defaultValues.noteToBuyer;

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
    return coverImage?.url.startsWith('https') ?? false;
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
      setFileError('File size exceeds 15MB');
      return;
    }

    setCoverImage({
      _id: `temp_${generateRandomId()}`,
      type: 'image',
      url: URL.createObjectURL(droppedFile),
      file: droppedFile,
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileError('File size exceeds 15MB');
        e.target.value = '';
        return;
      }
      setCoverImage({
        _id: `temp_${generateRandomId()}`,
        type: 'image',
        url: URL.createObjectURL(selectedFile),
        file: selectedFile,
      });
      e.target.value = '';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
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

  const handleFreePreviewMediaSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const fileId = generateRandomId();
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFreePreviewMediaFiles((prev: MediaFile[]) => [
          ...prev,
          {
            _id: `free_preview_${fileId}`,
            file,
            type: fileType,
            url: URL.createObjectURL(file),
          } as MediaFile,
        ]);
      }
    }
  };

  const removeFreePreviewMedia = (id: string) => {
    setFreePreviewMediaFiles((prev) => prev.filter((file) => file._id !== id));
  };

  const removeCoverImage = (id: string) => {
    setMediaToDelete({ id, type: 'cover' });
    setDeleteDialogOpen(true);
  };
  const removeMedia = (id: string) => {
    const fileToRemove = mediaFiles.find((file) => file._id === id);
    if (!fileToRemove) return;

    if (fileToRemove._id.startsWith('temp_')) {
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
    // API call removed temporarily
    // localStorage.setItem("temp_media", JSON.stringify(coverImage));
    // deleteMedia.mutate(defaultValues?.coverImage._id);
    setCoverImage(null);
    setDeleteDialogOpen(false);
  };
  const handleConfirmDelete = () => {
    if (!mediaToDelete) return;

    const fileToRemove = mediaFiles.find(
      (file) => file._id === mediaToDelete.id,
    );
    if (!fileToRemove) return;

    // API call removed temporarily
    // localStorage.setItem("temp_media", JSON.stringify(fileToRemove));
    // deleteMedia.mutate(mediaToDelete.id);
    setMediaFiles((prev) =>
      prev.filter((file) => file._id !== mediaToDelete.id),
    );
    setDeleteDialogOpen(false);
  };

  const { emitMediaAssetMessage, setMessages } = useChat(
    user,
    actualReceiver?.discordId || '',
    conversationId || undefined,
  );

  const onSubmit = useCallback(
    async (data: z.infer<typeof FormSchema>) => {
      if (!user?.discordId) {
        toast.error('User not authenticated');
        return;
      }

      if (!actualReceiver?.discordId) {
        toast.error('Please select a recipient before creating a menu');
        return;
      }

      // if (!coverImage) {
      //   toast.error("Cover image is required");
      //   return;
      // }

      if (mediaFiles.length === 0) {
        toast.error('Add at least one media file');
        return;
      }

      setOpen(false);

      try {
        // Prepare files array (coverImage + freePreviewMediaFiles + mediaFiles)
        const files: File[] = [];
        const mediaMeta = [];

        // 1. Add cover image file if it exists and is a new file
        if (coverImage?.file) {
          files.push(coverImage.file);
          mediaMeta.push({
            type: 'image' as const,
            caption: 'cover image',
          });
        }

        // 2. Add free preview media files (optional, shown without payment)
        for (const freePreviewFile of freePreviewMediaFiles) {
          if (freePreviewFile.file) {
            files.push(freePreviewFile.file);
            mediaMeta.push({
              type: freePreviewFile.type,
              caption: 'free preview',
            });
          }
        }

        // 3. Add locked content media files (requires payment)
        for (const mediaFile of mediaFiles) {
          if (mediaFile.file) {
            files.push(mediaFile.file);
            mediaMeta.push({
              type: mediaFile.type,
              caption: mediaFile.type === 'image' ? 'content image' : 'video',
            });
          }
        }

        // Ensure we have at least one file
        if (files.length === 0) {
          toast.error('No files to upload');
          return;
        }

        // Ensure mediaMeta matches files count
        if (mediaMeta.length !== files.length) {
          toast.error('Error preparing media files. Please try again.');
          console.error('Media metadata mismatch:', {
            mediaMeta: mediaMeta.length,
            files: files.length,
          });
          return;
        }

        // Ensure mediaMeta is a valid array with proper structure
        const validMediaMeta = mediaMeta.filter(
          (meta) => meta && typeof meta === 'object' && meta.type,
        );

        if (validMediaMeta.length !== files.length) {
          toast.error('Invalid media metadata structure');
          return;
        }

        // Call the mutation
        createMediaAsset.mutate(
          {
            sender: user.discordId,
            receiver: actualReceiver.discordId,
            title: data.title,
            description: data.description,
            priceToView: Number.parseFloat(data.priceToView),
            discount: undefined, // Add discount field to form if needed
            mediaMeta: validMediaMeta,
            files: files.length > 0 ? files : undefined,
          },
          {
            onSuccess: (responseData) => {
              // Emit message asset when mutation finishes
              console.log(responseData, 'responseData in dm menu creation');
              if (responseData?._id) {
                // reload();
                setMessages((prev: MessageType[]) => {
                  const newMessage: MessageType = {
                    _id: responseData._id,
                    conversation: responseData.conversation,
                    createdAt: responseData.createdAt,
                    description: responseData.description,
                    media: responseData.media,
                    title: responseData.title,
                    text: responseData.text,
                    paid: responseData.paid,
                    price: responseData.price,
                    reciever: responseData.reciever,
                    call: responseData.callType,
                    sender: {
                      discordId: user?.discordId,
                      name: user?.username,
                      avatar: user?.discordAvatar,
                      id: user?.discordId,
                      displayName: user?.displayName,
                      discordAvatar: user?.discordAvatar,
                      profileImage: user?.profileImage,
                      username: user?.username,
                      role: user?.role,
                    } as MessageAuthorType,
                    type: 'media',
                    status: 'sent',
                    callStartedAt: responseData.callStartedAt,
                    missed: false,
                    durationInSeconds: responseData.durationInSeconds,
                    // Add missing properties with default values
                    callStatus: '',
                    updatedAt: responseData.createdAt, // Use createdAt as fallback
                    __v: 0,
                  };
                
                  return [...prev, newMessage];
                });
                emitMediaAssetMessage(responseData._id);
              }
              // Reset form on success
              form.reset();
              setMediaFiles([]);
              setCoverImage(null);
              setFreePreviewMediaFiles([]);
              onCreationSuccess?.();
              if (onClose) {
                onClose();
              }
            },
            onError: () => {
              // Error handling is done in the hook
            },
          },
        );
      } catch (error: any) {
        console.error('Form submission error:', error);
        toast.error(
          `Failed to ${isUpdating ? 'update' : 'create'} media asset`,
          {
            description: error.message,
            duration: 5000,
          },
        );
      } finally {
      }
    },
    [
      user?.discordId,
      actualReceiver?.discordId,
      coverImage,
      freePreviewMediaFiles,
      mediaFiles,
      isUpdating,
      createMediaAsset,
      form,
      onClose,
      onCreationSuccess,
      emitMediaAssetMessage,
    ],
  );

  const submitForm = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  useEffect(() => {
    onRegisterSubmit?.(submitForm);
  }, [onRegisterSubmit, submitForm]);

  return (
    <div className="w-full h-full relative">
      <div className="flex flex-col gap-4 bg-[#15171B] rounded-[16px] border border-[#232323] relative py-[10px] px-[16px] w-[95%] mx-auto h-fit overflow-y-auto hidden_scrollbar mt-2.5 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:bg-[#151B] after:rounded-[16px] after:z-[-1]">
        <Form {...form}>
          <form
            className="w-full space-y-[27px] relative"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {createMediaAsset.isPending && (
              <div className="absolute inset-0 flex items-center z-[100]  justify-center ">
                <ComponentLoader className="text-white" />
              </div>
            )}
            <div className="overflow-hidden ">
              <div className="overflow-y-auto max-h-[650px] space-y-8 ">
                <div className="space-y-3.5">
                  {' '}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Title"
                            className="!bg-transparent p-0 w-full border-0 !ring-0 font-medium  placeholder:text-[#3C3C42] md:text-[24px] text-lg rounded-none"
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
                            placeholder="Description"
                            className="!bg-transparent p-0 w-full border-0 !ring-0  resize-none placeholder:text-[#3C3C42] min-h-[90px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Media Preview */}

                {/* <div className="flex gap-2 flex-col">
									<h2 className="text-[15px] text-start font-medium text-[#8A8C95]">
										Add Locked Content
									</h2>
									<label htmlFor="media-upload" className="text-[15px] font-medium text-[#9E9E9E] w-full min-h-[175px] rounded-[8px] bg-[#0F1114] flex items-center justify-center gap-2 flex-col">
										<Icon.imagePlaceholder width={36} height={34} className="text-[#9E9E9E]" />
										<p className="text-[16px] text-[#9E9E9E]">Add media</p>
                    <input
												id="media-upload"
												type="file"
												multiple
												accept="image/*,video/*"
												onChange={handleMediaSelect}
												className="hidden"
											/>
									</label>
								</div> */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-accent-text">
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Icon.image className="w-5 h-5" />
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
                      <Icon.videoIcon className="w-5 h-5" />
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

                {mediaFiles.length > 0 && (
                  <div className="flex overflow-x-auto w-full gap-2 pb-4 pr-4">
                    {mediaFiles.map((preview, index) => (
                      <div
                        key={index}
                        className="relative aspect-square h-[140px] shrink-0 overflow-hidden rounded-lg"
                      >
                        {preview.type?.startsWith('image') ? (
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
                                  ? 'opacity-0 group-hover:opacity-100 transition-opacity'
                                  : ''
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
                                    playingVideos[preview._id] ? 'hidden' : ''
                                  }`}
                                />
                                <Icon.pause
                                  className={`w-5 h-5 text-white ${
                                    playingVideos[preview._id] ? '' : 'hidden'
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
                          className="absolute top-1 right-1  text-white rounded-full size-4 flex items-center justify-center "
                        >
                          <Icon.close className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
                              <Icon.tip className="size-6" />
                            </span>
                            <Input
                              type="number"
                              placeholder={
                                mediaFiles.length > 1 ? 'Prices' : 'Price'
                              }
                              {...field}
                              className="h-full p-0 px-14 w-full border-0 !ring-0 font-medium placeholder:text-lg placeholder:font-normal placeholder:text-[#9E9E9E] bg-main-bg"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2 flex-col">
                  <h2 className="text-[15px] text-start font-medium text-[#8A8C95]">
                    Add Free Preview (
                    <span className=" text-[14px]">Optional</span>)
                  </h2>
                  {freePreviewMediaFiles.length === 0 && (
                    <label
                      htmlFor="free-preview-media-upload"
                      className="text-[15px] font-medium text-[#9E9E9E] w-full min-h-[175px] rounded-[8px] bg-[#0F1114] flex items-center justify-center gap-2 flex-col cursor-pointer"
                    >
                      <Icon.imagePlaceholder
                        width={36}
                        height={34}
                        className="text-[#9E9E9E]"
                      />
                      <p className="text-[16px] text-[#9E9E9E]">Add media</p>
                      <input
                        id="free-preview-media-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFreePreviewMediaSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {freePreviewMediaFiles.length > 0 && (
              <div className="flex overflow-x-auto w-full gap-2 pb-4 pr-4">
                <label
                  htmlFor="free-preview-media-upload"
                  className="text-[15px] font-medium text-[#9E9E9E] aspect-square h-[140px] rounded-[8px] bg-[#0F1114] flex items-center justify-center gap-2 flex-col cursor-pointer"
                >
                  <Icon.imagePlaceholder
                    width={36}
                    height={34}
                    className="text-[#9E9E9E]"
                  />
                  <p className="text-[16px] text-[#9E9E9E]">Add media</p>
                  <input
                    id="free-preview-media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFreePreviewMediaSelect}
                    className="hidden"
                  />
                </label>
                {freePreviewMediaFiles.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square h-[140px] shrink-0 overflow-hidden rounded-lg"
                  >
                    {preview.type?.startsWith('image') ? (
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
                              ? 'opacity-0 group-hover:opacity-100 transition-opacity'
                              : ''
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
                                playingVideos[preview._id] ? 'hidden' : ''
                              }`}
                            />
                            <Icon.pause
                              className={`w-5 h-5 text-white ${
                                playingVideos[preview._id] ? '' : 'hidden'
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
                      onClick={() => removeFreePreviewMedia(preview._id)}
                      className="absolute top-1 right-1  text-white rounded-full size-4 flex items-center justify-center "
                    >
                      <Icon.close className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};
