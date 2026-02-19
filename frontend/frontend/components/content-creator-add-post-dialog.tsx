'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, setHours, setMinutes } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Icon } from './ui/icons';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { useGlobal } from '@/context/global-context-provider';
import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import { createPostService } from '@/lib/services';
import { createMenuCategory } from '@/actions/menu-item';
import { useMenuCategories } from '@/hooks/queries/use-menu-categories';
import { toastPresets } from '@/lib/toast-presets';
import { PostComposerUnlockMediaPanel } from './post-composer-unlock-media-panel';
import { PostComposerLivePreview } from './post-composer-live-preview';
const MAX_POST_CONTENT_LENGTH = 560;

const FormSchema = z
  .object({
    content: z
      .string({ required_error: 'Content is required' })
      .max(
        MAX_POST_CONTENT_LENGTH,
        `Keep post content under ${MAX_POST_CONTENT_LENGTH} characters.`
      ),
    visibility: z.string({ required_error: 'Visibility is required.' }),
    categoryInput: z.string().optional(),
    tippingEnabled: z.boolean(),
    categories: z.array(z.string()).optional(),
    unlockableType: z.enum(['none', 'single', 'bundle']),
    unlockPrice: z.string().optional(),
    menuTitle: z.string().optional(),
    noteToBuyer: z.string().optional(),
    scheduledPost: z.object({
      isScheduled: z.boolean(),
      scheduledFor: z.string().datetime().optional(),
    }),
    isDraft: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.unlockableType !== 'none') {
      const unlockPrice = Number(data.unlockPrice);
      if (!Number.isFinite(unlockPrice) || unlockPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid unlock price greater than 0.',
          path: ['unlockPrice'],
        });
      }
      if (!data.categories || data.categories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select at least one menu category for unlockable content.',
          path: ['categories'],
        });
      }
    }

    if (
      data.scheduledPost.isScheduled &&
      (!data.scheduledPost.scheduledFor ||
        data.scheduledPost.scheduledFor.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scheduled date is required when scheduling is enabled',
        path: ['scheduledPost', 'scheduledFor'],
      });
    }
  });

export const ContentCreatorAddPostDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useGlobal();

  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: '',
      visibility: '',
      categoryInput: '',
      tippingEnabled: false,
      categories: [],
      unlockableType: 'none',
      unlockPrice: '',
      menuTitle: '',
      noteToBuyer: '',
      scheduledPost: {
        isScheduled: false,
        scheduledFor: undefined,
      },
      isDraft: false,
    },
  });

  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSubmitting, setIsDraftSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [unlockMediaFiles, setUnlockMediaFiles] = useState<File[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagPosition, setHashtagPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: menuCategories = [] } = useMenuCategories(user?.discordId || '');

  const appendMediaFiles = (
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setPreview?: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue;
      }
      setFiles((prev) => [...prev, file]);
      if (setPreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendMediaFiles(
      Array.from(event.target.files || []),
      setMediaFiles,
      setMediaPreview
    );
  };

  const handleUnlockMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendMediaFiles(Array.from(event.target.files || []), setUnlockMediaFiles);
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUnlockMedia = (index: number) => {
    setUnlockMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!user?.discordId) {
      toast.error('User not authenticated');
      return;
    }

    if (data.unlockableType !== 'none') {
      if (unlockMediaFiles.length === 0) {
        toast.error('Add locked media files for this unlockable offer.');
        return;
      }
      if (data.unlockableType === 'single' && unlockMediaFiles.length !== 1) {
        toast.error('Single unlockable posts require exactly 1 media file.');
        return;
      }
      if (data.unlockableType === 'bundle' && unlockMediaFiles.length < 2) {
        toast.error('Bundle unlockable posts require at least 2 media files.');
        return;
      }
    }

    setIsSubmitting(true);
    const postToastId = `post-submit-${Date.now()}`;
    toast.loading(data.isDraft ? 'Saving draft...' : 'Publishing post...', {
      ...toastPresets.loading,
      id: postToastId,
    });

    if (data.isDraft) {
      setIsDraftSubmitting(true);
    }

    try {
      const formData = new FormData();

      formData.append('content', data.content);
      formData.append('visibility', 'general'); // Temporary hardcode cause visibility is removed and no subscriptions yet
      formData.append('tippingEnabled', data.tippingEnabled.toString());
      formData.append('isDraft', data.isDraft.toString());
      formData.append('unlockableType', data.unlockableType);

      if (data.unlockableType !== 'none') {
        const priceNumber = Number.parseFloat(data.unlockPrice || '0');
        formData.append('priceToView', priceNumber.toString());
        formData.append('category', data.categories?.[0] || '');
        if (data.menuTitle?.trim()) {
          formData.append('menuTitle', data.menuTitle.trim());
        }
        if (data.noteToBuyer?.trim()) {
          formData.append('noteToBuyer', data.noteToBuyer.trim());
        }
      }

      for (const categoryId of data.categories || []) {
        formData.append('categories[]', categoryId);
      }

      const scheduledPostData = {
        isScheduled: data.scheduledPost.isScheduled,
        ...(data.scheduledPost.isScheduled &&
          data.scheduledPost.scheduledFor && {
          scheduledFor: data.scheduledPost.scheduledFor,
        }),
      };
      formData.append('scheduledPost', JSON.stringify(scheduledPostData));

      const compressFiles = async (inputFiles: File[]) => {
        const outputFiles: File[] = [];
        for (const file of inputFiles) {
          if (file.type.startsWith('image/')) {
            try {
              const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
              });
              outputFiles.push(compressed);
            } catch (err) {
              console.warn('Image compression failed, using original:', err);
              outputFiles.push(file);
            }
          } else {
            outputFiles.push(file);
          }
        }
        return outputFiles;
      };

      const compressedFiles = await compressFiles(mediaFiles);
      const compressedUnlockFiles = await compressFiles(unlockMediaFiles);

      for (const file of compressedFiles) {
        formData.append('files', file);
      }

      for (const file of compressedUnlockFiles) {
        formData.append('unlockFiles', file);
      }

      if (compressedFiles.length > 0) {
        const mediaMetaData = compressedFiles.map((file) => {
          const generalType = file.type.startsWith('image/')
            ? 'image'
            : 'video';
          return {
            type: generalType,
            caption: '',
          };
        });

        formData.append('mediaMeta', JSON.stringify(mediaMetaData).slice(1, -1));
      }

      const optimisticId = `temp_${Date.now()}`;
      if (!data.isDraft) {
        const optimisticPost = {
          _id: optimisticId,
          content: data.content,
          visibility: 'general',
          isDraft: false,
          media: mediaPreview.map((url, idx) => ({
            _id: `temp_media_${idx}`,
            url,
            type: mediaFiles[idx]?.type.startsWith('image/') ? 'image' : 'video',
            caption: '',
          })),
          author: {
            _id: user.discordId,
            username: user.username || '',
            profileImage: user.profileImage || '',
          },
          createdAt: new Date().toISOString(),
          isOptimistic: true,
        };

        queryClient.setQueryData(['posts', 'general', 10], (oldData: any) => {
          if (!oldData?.pages?.[0]) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            posts: [optimisticPost, ...(newPages[0].posts || [])],
          };
          return { ...oldData, pages: newPages };
        });

        setIsOpen(false);
      }

      const response = await createPostService({ formData });

      if (response.data || response.statusText === 'Created') {
        if (!data.isDraft && response.data) {
          queryClient.setQueryData(['posts', 'general', 10], (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            const newPages = [...oldData.pages];
            newPages[0] = {
              ...newPages[0],
              posts: newPages[0].posts.map((post: any) =>
                post._id === optimisticId ? response.data : post
              ),
            };
            return { ...oldData, pages: newPages };
          });
          toast.success('Post published.', {
            ...toastPresets.success,
            id: postToastId,
          });
        } else if (data.isDraft) {
          toast.success('Draft saved.', {
            ...toastPresets.success,
            id: postToastId,
          });
          setIsOpen(false);
        }

        form.reset();
        setMediaFiles([]);
        setMediaPreview([]);
        setUnlockMediaFiles([]);
        setShowTagInput(false);

        if (user?.discordId) {
          queryClient.invalidateQueries({
            queryKey: ['creatorPosts', user.discordId],
          });
          queryClient.invalidateQueries({
            queryKey: ['creator-posts'],
          });
          queryClient.invalidateQueries({
            queryKey: ['menu_categories', user.discordId],
          });
          if (data.unlockableType !== 'none') {
            queryClient.invalidateQueries({
              queryKey: ['menu_item', user.discordId],
            });
          }
        }
      } else {
        if (!data.isDraft) {
          queryClient.setQueryData(['posts', 'general', 10], (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            const newPages = [...oldData.pages];
            newPages[0] = {
              ...newPages[0],
              posts: newPages[0].posts.filter((post: any) => !post.isOptimistic),
            };
            return { ...oldData, pages: newPages };
          });
        }

        toast.error(
          data.isDraft ? 'Could not save draft.' : 'Could not publish post.',
          {
            ...toastPresets.error,
            id: postToastId,
            description: 'No confirmation was received from the server.',
            duration: 5000,
          }
        );
      }
    } catch (error: any) {
      console.error('Failed to create post:', error);

      if (!data.isDraft) {
        queryClient.setQueryData(['posts', 'general', 10], (oldData: any) => {
          if (!oldData?.pages?.[0]) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            posts: newPages[0].posts.filter((post: any) => !post.isOptimistic),
          };
          return { ...oldData, pages: newPages };
        });
      }

      toast.error(
        data.isDraft ? 'Could not save draft.' : 'Could not publish post.',
        {
          ...toastPresets.error,
          id: postToastId,
          description: error?.message || 'Please try again.',
          duration: 5000,
        }
      );
    } finally {
      setIsSubmitting(false);
      setIsDraftSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex items-center !max-w-2xl justify-center !w-full py-4 px-3 sm:py-10 sm:px-6">
        <Form {...form}>
          <form
            className=" w-full space-y-[27px]"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="bg-black rounded-2xl border border-[#232323] overflow-hidden">
              <div className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[650px] space-y-4 sm:space-y-8 p-3 sm:p-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => {
                    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      const textarea = e.currentTarget;
                      const cursorPosition = textarea.selectionStart;
                      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
                      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
                      
                      if (e.key === '#' || (e.key !== 'Escape' && lastHashIndex !== -1)) {
                        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
                        const hasSpace = textAfterHash.includes(' ');
                        
                        if (!hasSpace && lastHashIndex !== -1) {
                          setHashtagQuery(textAfterHash);
                          setShowHashtagSuggestions(true);
                          
                          const textareaRect = textarea.getBoundingClientRect();
                          const scrollTop = textarea.scrollTop;
                          const lineHeight = 20;
                          const linesBeforeCursor = textBeforeCursor.split('\n').length - 1;
                          const charsInCurrentLine = textBeforeCursor.split('\n').pop()?.length || 0;
                          
                          setHashtagPosition({
                            top: textareaRect.top + (linesBeforeCursor * lineHeight) + lineHeight + scrollTop,
                            left: textareaRect.left + (charsInCurrentLine * 8),
                          });
                        }
                      }
                      
                      if (e.key === 'Escape') {
                        setShowHashtagSuggestions(false);
                      }
                      
                      if (e.key === 'Enter' && showHashtagSuggestions && menuCategories.length > 0) {
                        const filtered = menuCategories.filter((cat) =>
                          cat.text.toLowerCase().includes(hashtagQuery.toLowerCase())
                        );
                        if (filtered.length > 0) {
                          e.preventDefault();
                          insertHashtag(textarea, field, filtered[0].text, lastHashIndex);
                        }
                      }
                    };
                    
                    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      field.onChange(e);
                      const cursorPosition = e.target.selectionStart;
                      const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
                      
                      if (lastHashIndex !== -1) {
                        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
                        const hasSpace = textAfterHash.includes(' ');
                        
                        if (!hasSpace) {
                          setHashtagQuery(textAfterHash);
                          setShowHashtagSuggestions(true);
                        } else {
                          setShowHashtagSuggestions(false);
                        }
                      } else {
                        setShowHashtagSuggestions(false);
                      }
                    };
                    
                    const insertHashtag = (
                      textarea: HTMLTextAreaElement,
                      field: any,
                      categoryText: string,
                      hashIndex: number
                    ) => {
                      const value = textarea.value;
                      const beforeHash = value.substring(0, hashIndex);
                      const afterCursor = value.substring(textarea.selectionStart);
                      const newValue = `${beforeHash}#${categoryText} ${afterCursor}`;
                      
                      field.onChange({ target: { value: newValue } });
                      setShowHashtagSuggestions(false);
                      setHashtagQuery('');
                      
                      setTimeout(() => {
                        const newPosition = hashIndex + categoryText.length + 2;
                        textarea.setSelectionRange(newPosition, newPosition);
                        textarea.focus();
                      }, 0);
                    };
                    
                    const filteredHashtagCategories = menuCategories.filter((cat) =>
                      cat.text.toLowerCase().includes(hashtagQuery.toLowerCase())
                    );
                    const contentLength = field.value?.length ?? 0;
                    return (
                      <FormItem className="relative">
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              {...field}
                              ref={(el) => {
                                textareaRef.current = el;
                              }}
                              placeholder="What do you want to post?"
                              className="!bg-transparent p-0 w-full border-0 !ring-0 font-medium resize-none placeholder:text-[#3C3C42] min-h-[90px]"
                              maxLength={MAX_POST_CONTENT_LENGTH}
                              onKeyDown={handleKeyDown}
                              onChange={handleChange}
                              onClick={() => {
                                const textarea = textareaRef.current;
                                if (textarea) {
                                  const cursorPosition = textarea.selectionStart;
                                  const textBeforeCursor = textarea.value.substring(0, cursorPosition);
                                  const lastHashIndex = textBeforeCursor.lastIndexOf('#');
                                  
                                  if (lastHashIndex !== -1) {
                                    const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
                                    if (!textAfterHash.includes(' ')) {
                                      const textareaRect = textarea.getBoundingClientRect();
                                      setHashtagPosition({
                                        top: textareaRect.top + 30,
                                        left: textareaRect.left + 10,
                                      });
                                    }
                                  }
                                }
                              }}
                              />
                            {showHashtagSuggestions && filteredHashtagCategories.length > 0 && (
                              <div
                                className="absolute z-50 bg-[#0A0A0A] border border-[#1F2227] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                style={{
                                  top: `${hashtagPosition.top}px`,
                                  left: `${hashtagPosition.left}px`,
                                  minWidth: '200px',
                                }}
                              >
                                {filteredHashtagCategories.map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                      const textarea = textareaRef.current;
                                      if (textarea) {
                                        const cursorPosition = textarea.selectionStart;
                                        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
                                        const lastHashIndex = textBeforeCursor.lastIndexOf('#');
                                        if (lastHashIndex !== -1) {
                                          insertHashtag(textarea, field, category.text, lastHashIndex);
                                        }
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-[#1F2227] text-[#D4D4D8] text-sm flex items-center gap-2"
                                  >
                                    <span className="text-[#FF007F]">#</span>
                                    {category.text}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <div className="mt-1 text-right text-[11px] text-[#6F7280]">
                          {contentLength}/{MAX_POST_CONTENT_LENGTH}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <div className="space-y-3 rounded-[10px] border border-[#1F2227] bg-[#0F1114] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#F8F8F8]">
                        Public preview (optional)
                      </p>
                      <p className="text-xs text-[#8A8C95]">
                        These files are visible in feed and profile posts.
                      </p>
                    </div>
                    <label
                      htmlFor="media-upload"
                      className="cursor-pointer rounded-md border border-[#FF007F]/50 bg-[#FF007F]/10 px-3 py-2 text-xs font-medium text-[#FF007F] hover:bg-[#FF007F]/20 transition-colors"
                    >
                      Add preview media
                      <input
                        id="media-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {mediaPreview.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mediaPreview.map((preview, index) => (
                        <div key={index} className="relative">
                          {mediaFiles[index]?.type.startsWith('image/') ? (
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg border border-[#1F2227]"
                            />
                          ) : (
                            <video
                              src={preview}
                              className="w-full h-32 object-cover rounded-lg border border-[#1F2227]"
                              muted
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#101014]/90 text-[#F8F8F8] border border-[#2A2D31]"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-[18px]">
                  <FormField
                    control={form.control}
                    name="tippingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-4">
                        <FormLabel className="text-[15px] text-[#8A8C95] font-medium">
                          Enable tipping
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unlockableType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[15px] text-[#8A8C95] font-medium">
                          Unlockable content
                        </FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'none', label: 'No unlock' },
                            { value: 'single', label: 'Single unlock' },
                            { value: 'bundle', label: 'Bundle unlock' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                'h-auto px-3 py-2 border rounded text-sm font-medium transition-all',
                                field.value === option.value
                                  ? 'border-[#34D399] text-[#34D399] bg-[#34D399]/10'
                                  : 'border-[#1F2227] text-[#8A8C95] bg-[#0A0A0A]'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('unlockableType') !== 'none' && (
                    <div className="space-y-3 rounded-[8px] border border-[#1F2227] bg-[#0F1114] p-3">
                      <FormField
                        control={form.control}
                        name="unlockPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[14px] text-[#8A8C95] font-medium">
                              Unlock price (USD)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="15.00"
                                className="bg-[#0A0A0A] border-[#1F2227] h-auto p-3 rounded-[8px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="menuTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[14px] text-[#8A8C95] font-medium">
                              Menu title (optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Holiday Bundle 2026"
                                className="bg-[#0A0A0A] border-[#1F2227] h-auto p-3 rounded-[8px]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="noteToBuyer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[14px] text-[#8A8C95] font-medium">
                              Buyer note (optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Thanks for unlocking."
                                className="!bg-[#0A0A0A] border-[#1F2227] min-h-[70px] p-3 rounded-[8px]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <PostComposerUnlockMediaPanel
                        files={unlockMediaFiles}
                        onSelect={handleUnlockMediaSelect}
                        onRemove={removeUnlockMedia}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] text-[#8A8C95] font-medium">
                      Menu Category (optional){' '}
                    </p>

                    {!showTagInput && (
                      <button
                        type="button"
                        className="text-[#FF007F] flex items-center gap-2 font-medium text-[15px]"
                        onClick={() => setShowTagInput((prev) => !prev)}
                      >
                        <Icon.addSquare />
                        <span className="hidden sm:inline">Add a new Category</span>
                      </button>
                    )}
                  </div>
                  {form.watch('unlockableType') !== 'none' && (
                    <p className="text-xs text-[#8A8C95]">
                      Unlockable posts require a category. The first selected
                      category is used for menu listing.
                    </p>
                  )}

                  {showTagInput && (
                    <FormField
                      control={form.control}
                      name="categoryInput"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Icon.hashTag className="absolute -translate-y-1/2 top-1/2 left-4" />
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Add tags"
                                className="bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E] rounded-[8px]"
                                value={field.value}
                                onChange={field.onChange}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const newTag = field.value?.trim();
                                    if (newTag && user?.discordId) {
                                      try {
                                        const response = await createMenuCategory({
                                          owner: user.discordId,
                                          category: newTag,
                                        });

                                        if (response.data) {
                                          const createdCategoryId =
                                            response.data?._id ||
                                            response.data?.id ||
                                            '';
                                          if (createdCategoryId) {
                                            const currentlySelected =
                                              form.getValues('categories') || [];
                                            form.setValue(
                                              'categories',
                                              Array.from(
                                                new Set([
                                                  ...currentlySelected,
                                                  createdCategoryId,
                                                ])
                                              ),
                                              { shouldValidate: true }
                                            );
                                          }

                                          await queryClient.invalidateQueries({
                                            queryKey: ['menu_categories', user.discordId],
                                          });
                                          await queryClient.refetchQueries({
                                            queryKey: ['menu_categories', user.discordId],
                                          });
                                          field.onChange('');
                                          setShowTagInput(false);
                                          toast.success(
                                            'Menu category created successfully'
                                          );
                                        }
                                      } catch (error: any) {
                                        console.error(
                                          'Failed to create menu category:',
                                          error
                                        );
                                        toast.error(
                                          error.message || 'Failed to create menu category'
                                        );
                                      }
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="categories"
                    render={() => {
                      const selectedValues = form.getValues('categories') || [];
                      const displayCategories = [...(menuCategories ?? [])].sort(
                        (first, second) => {
                          const firstSelected = selectedValues.includes(first.id);
                          const secondSelected = selectedValues.includes(second.id);
                          if (firstSelected !== secondSelected) {
                            return firstSelected ? -1 : 1;
                          }
                          return first.text.localeCompare(second.text);
                        }
                      );
                      
                      return (
                        <FormItem className="flex gap-2 flex-wrap max-h-[180px] overflow-y-auto pr-1">
                          {displayCategories.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              const values: string[] = field.value || [];
                              const isSelected = values.includes(item.id);

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      field.onChange(
                                        values.filter(
                                          (value) => value !== item.id
                                        )
                                      );
                                    } else {
                                      field.onChange([
                                        ...(values || []),
                                        item.id,
                                      ]);
                                    }
                                    
                                    const contentField = form.getValues('content');
                                    const textarea = textareaRef.current;
                                    if (textarea) {
                                      const cursorPosition = textarea.selectionStart;
                                      const newContent = 
                                        contentField.substring(0, cursorPosition) +
                                        `#${item.text} ` +
                                        contentField.substring(cursorPosition);
                                      form.setValue('content', newContent);
                                      
                                      setTimeout(() => {
                                        const newPosition = cursorPosition + item.text.length + 2; // +2 for # and space
                                        textarea.setSelectionRange(newPosition, newPosition);
                                        textarea.focus();
                                      }, 0);
                                    }
                                  }}
                                  className={cn(
                                    'h-auto flex items-center gap-2.5 white font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-[15px] border border-[#1F2227] bg-[#0A0A0A] rounded text-[#8A8C95] transition-all',
                                    isSelected &&
                                    'shadow-[2px_2px_0_0_#FF007F] text-white border-[#FF007F]'
                                  )}
                                >
                                  <span className="text-[#FF007F]">#</span>
                                  {item.text}
                                  {isSelected ? (
                                    <Icon.radioActive />
                                  ) : (
                                    <Icon.radioInactive />
                                  )}
                                </button>
                              );
                            }}
                          />
                          ))}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="scheduledPost.isScheduled"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-4">
                        <FormLabel className="text-[15px] text-[#8A8C95] font-medium">
                          Schedule for later
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch('scheduledPost.isScheduled') && (
                    <FormField
                      control={form.control}
                      name="scheduledPost.scheduledFor"
                      render={({ field }) => {
                        const dateValue = field.value
                          ? new Date(field.value)
                          : undefined;
                        const hours = dateValue
                          ? dateValue.getHours().toString().padStart(2, '0')
                          : '';
                        const minutes = dateValue
                          ? dateValue.getMinutes().toString().padStart(2, '0')
                          : '';

                        const updateDate = (newDate: Date | undefined) => {
                          if (!newDate) {
                            return field.onChange(undefined);
                          }
                          const current = dateValue ?? new Date();
                          const combined = setMinutes(
                            setHours(newDate, current.getHours()),
                            current.getMinutes()
                          );
                          field.onChange(combined.toISOString());
                        };

                        const updateTime = (timeString: string) => {
                          if (!timeString) {
                            return;
                          }
                          const [h, m] = timeString.split(':').map(Number);
                          const baseDate = dateValue ?? new Date();
                          const combined = setMinutes(setHours(new Date(baseDate), h), m);
                          field.onChange(combined.toISOString());
                        };
                        
                        const timeInputValue = hours && minutes 
                          ? `${hours}:${minutes}`
                          : '';

                        return (
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <FormItem className="w-full">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <button
                                      type="button"
                                      className={cn(
                                        'flex items-center w-full p-4 gap-1  rounded-[8px] border-[#0F1114] border bg-[#0F1114]',
                                        !dateValue &&
                                        'text-muted-foreground gap-4'
                                      )}
                                    >
                                      <Icon.calendar2 />
                                      {dateValue ? (
                                        format(dateValue, 'PPP')
                                      ) : (
                                        <span className="text-[#9E9E9E] whitespace-nowrap">
                                          Select date
                                        </span>
                                      )}
                                    </button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0 z-[1000]"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={dateValue}
                                    onSelect={updateDate}
                                    disabled={(date) => date < new Date()}
                                    captionLayout="dropdown"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>

                            <FormItem className="w-full">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <button
                                      type="button"
                                      className={cn(
                                        'flex items-center w-full p-4 gap-1 rounded-[8px] border-[#0F1114] border bg-[#0F1114] text-left',
                                        !timeInputValue &&
                                        'text-muted-foreground gap-4'
                                      )}
                                    >
                                      <Icon.calendar2 />
                                      {timeInputValue ? (
                                        <span className="text-[#D4D4D8]">
                                          {timeInputValue}
                                        </span>
                                      ) : (
                                        <span className="text-[#9E9E9E] whitespace-nowrap">
                                          Select time
                                        </span>
                                      )}
                                    </button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0 z-[1000] bg-[#0A0A0A] border-[#1F2227]"
                                  align="start"
                                >
                                  <div className="p-3 sm:p-4">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                      <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-[#8A8C95] font-medium mb-1">Hour</span>
                                        <div 
                                          className="flex flex-col max-h-[180px] sm:max-h-[200px] overflow-y-auto gap-1 pr-1 sm:pr-2"
                                          style={{
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#1F2227 transparent',
                                          }}
                                        >
                                          {Array.from({ length: 24 }, (_, i) => {
                                            const hour = i.toString().padStart(2, '0');
                                            const isSelected = hours === hour;
                                            return (
                                              <button
                                                key={hour}
                                                type="button"
                                                onClick={() => {
                                                  const currentMinutes = minutes || '00';
                                                  updateTime(`${hour}:${currentMinutes}`);
                                                }}
                                                className={cn(
                                                  'w-12 sm:w-14 h-8 sm:h-9 flex items-center justify-center text-xs sm:text-sm rounded transition-all font-medium',
                                                  isSelected
                                                    ? 'bg-[#FF007F] text-white shadow-[2px_2px_0_0_#FF007F]'
                                                    : 'text-[#D4D4D8] hover:bg-[#1F2227] hover:text-white'
                                                )}
                                              >
                                                {hour}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      
                                      <span className="text-[#D4D4D8] text-base sm:text-lg font-medium mt-7 sm:mt-8">:</span>
                                      
                                      <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs text-[#8A8C95] font-medium mb-1">Minute</span>
                                        <div 
                                          className="flex flex-col max-h-[180px] sm:max-h-[200px] overflow-y-auto gap-1 pr-1 sm:pr-2"
                                          style={{
                                            scrollbarWidth: 'thin',
                                            scrollbarColor: '#1F2227 transparent',
                                          }}
                                        >
                                          {Array.from({ length: 60 }, (_, i) => {
                                            const minute = i.toString().padStart(2, '0');
                                            const isSelected = minutes === minute;
                                            return (
                                              <button
                                                key={minute}
                                                type="button"
                                                onClick={() => {
                                                  const currentHours = hours || '00';
                                                  updateTime(`${currentHours}:${minute}`);
                                                }}
                                                className={cn(
                                                  'w-12 sm:w-14 h-8 sm:h-9 flex items-center justify-center text-xs sm:text-sm rounded transition-all font-medium',
                                                  isSelected
                                                    ? 'bg-[#FF007F] text-white shadow-[2px_2px_0_0_#FF007F]'
                                                    : 'text-[#D4D4D8] hover:bg-[#1F2227] hover:text-white'
                                                )}
                                              >
                                                {minute}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          </div>
                        );
                      }}
                    />
                  )}
                </div>
                <PostComposerLivePreview
                  authorUsername={user?.username}
                  authorAvatarUrl={user?.profileImage?.url}
                  content={form.watch('content') || ''}
                  media={mediaPreview.map((url, index) => ({
                    url,
                    type: mediaFiles[index]?.type.startsWith('video/')
                      ? 'video'
                      : 'image',
                  }))}
                  unlockableType={form.watch('unlockableType')}
                  unlockPrice={form.watch('unlockPrice')}
                  lockedMediaCount={unlockMediaFiles.length}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <Button
                type="button"
                disabled={isDraftSubmitting}
                onClick={() => {
                  form.setValue('isDraft', true);
                  form.handleSubmit(onSubmit)();
                }}
                className="gap-2 !flex-1 h-auto flex items-center justify-center font-medium px-3 py-2 sm:px-4 text-sm sm:text-lg shadow-[2px_2px_0_0_#1F2227] border-[#1F2227] bg-[#0A0A0A] rounded border text-[#8A8C95] disabled:opacity-50"
              >
                {isDraftSubmitting ? <ComponentLoader /> : <Icon.editContent />}
                <span className="hidden sm:inline">Save as draft</span>
                <span className="sm:hidden">Draft</span>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => form.setValue('isDraft', false)}
                className="gap-2 !flex-1 h-auto flex items-center justify-center font-medium px-3 py-2 sm:px-4 text-sm sm:text-lg shadow-[2px_2px_0_0_#FF007F] border-[#FF007F] bg-[#0A0A0A] rounded border text-[#D4D4D8] disabled:opacity-50"
              >
                {isSubmitting ? <ComponentLoader /> : null}
                Post
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
