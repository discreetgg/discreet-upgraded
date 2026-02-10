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
// import { getSubscriptionPlansService } from '@/lib/services';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import type { Tag } from '@/types/global';
import { createPostService } from '@/lib/services';
import { createMenuCategory } from '@/actions/menu-item';
import { useMenuCategories } from '@/hooks/queries/use-menu-categories';
import { toastPresets } from '@/lib/toast-presets';

const FormSchema = z
  .object({
    content: z.string({ required_error: 'Content is required' }),
    visibility: z.string({ required_error: 'Visibility is required.' }),
    // price: z.string().optional(),
    categoryInput: z.string().optional(),
    tippingEnabled: z.boolean(),
    subscription: z.string().optional(),
    // categories are optional now
    categories: z.array(z.string()).optional(),
    scheduledPost: z.object({
      isScheduled: z.boolean(),
      scheduledFor: z.string().datetime().optional(),
    }),
    isDraft: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Price is required when visibility is 'subscribers'
    // if (
    //   data.visibility === 'subscribers' &&
    //   (!data.price || data.price.trim() === '')
    // ) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: 'Price is required for paid content',
    //     path: ['price'],
    //   });
    // }

    // Subscription is required when visibility is 'custom_plan'
    // if (
    //   data.visibility === 'custom_plan' &&
    //   (!data.subscription || data.subscription.trim() === '')
    // ) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: 'Subscription plan is required for subscription content',
    //     path: ['subscription'],
    //   });
    // }

    // Scheduled date is only required when isScheduled is true (optional validation)
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
  const {
    user,
    // subscriptionPlans,
    // setSubscriptionPlans,
  } = useGlobal();

  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: '',
      visibility: '',
      // price: '',
      categoryInput: '',
      tippingEnabled: false,
      subscription: '',
      categories: [],
      scheduledPost: {
        isScheduled: false,
        scheduledFor: undefined,
      },
      isDraft: false,
    },
  });

  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  // const [subscriptionIsLoading, setIsSubscriptionsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSubmitting, setIsDraftSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagPosition, setHashtagPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Use React Query hook for menu categories
  const {
    data: menuCategories = [],
  } = useMenuCategories(user?.discordId || '');

  // Media handling functions
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaFiles((prev) => [...prev, file]);

        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!user?.discordId) {
      toast.error('User not authenticated');
      return;
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
      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add basic form fields
      formData.append('content', data.content);
      formData.append('visibility', 'general'); // Temporary hardcode cause visibility is removed and no subscriptions yet
      formData.append('tippingEnabled', data.tippingEnabled.toString());
      formData.append('isDraft', data.isDraft.toString());

      // Add visibility-specific fields
      // if (data.visibility === 'subscribers' && data.price) {
      //   const priceNumber = Number.parseFloat(data.price.replace(/,/g, ''));
      //   formData.append('priceToView', priceNumber.toString());
      // }

      // if (data.visibility === "custom_plan") {
      // 	if (data.subscription) {
      // 		formData.append("visibleToPlan", data.subscription);
      // 	} else {
      // 		// This should be caught by form validation, but adding as safety check
      // 		throw new Error(
      // 			"Subscription plan is required for custom plan visibility"
      // 		);
      // 	}
      // }

      // Add categories (optional)
      for (const categoryId of data.categories || []) {
        formData.append('categories[]', categoryId);
      }

      // Add scheduled post data as JSON string
      const scheduledPostData = {
        isScheduled: data.scheduledPost.isScheduled,
        ...(data.scheduledPost.isScheduled &&
          data.scheduledPost.scheduledFor && {
          scheduledFor: data.scheduledPost.scheduledFor,
        }),
      };
      formData.append('scheduledPost', JSON.stringify(scheduledPostData));

      // Compress and add media files
      const compressedFiles: File[] = [];
      for (const file of mediaFiles) {
        if (file.type.startsWith('image/')) {
          try {
            // Compress images to speed up upload (max 1MB, 1920px)
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
            compressedFiles.push(compressed);
          } catch (err) {
            console.warn('Image compression failed, using original:', err);
            compressedFiles.push(file);
          }
        } else {
          // Don't compress videos
          compressedFiles.push(file);
        }
      }

      // Add compressed files
      for (const file of compressedFiles) {
        formData.append('files', file);
      }

      // Add media metadata as JSON string
      if (compressedFiles.length > 0) {
        const mediaMetaData = compressedFiles.map((file) => {
          const generalType = file.type.startsWith('image/')
            ? 'image'
            : 'video';
          return {
            type: generalType,
            caption: '', // Empty caption for now
          };
        });

        // Append as a single JSON string with comma-separated objects
        formData.append('mediaMeta', JSON.stringify(mediaMetaData).slice(1, -1));
      }

      // Create optimistic post for instant feedback
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

        // Add optimistic post to feed immediately
        queryClient.setQueryData(['posts', 'general', 10], (oldData: any) => {
          if (!oldData?.pages?.[0]) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            posts: [optimisticPost, ...(newPages[0].posts || [])],
          };
          return { ...oldData, pages: newPages };
        });

        // Close dialog immediately for better UX
        setIsOpen(false);
      }

      // Create the post in background
      const response = await createPostService({ formData });

      if (response.data || response.statusText === 'Created') {
        // Replace optimistic post with real post
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

        // Reset form and state
        form.reset();
        setMediaFiles([]);
        setMediaPreview([]);
        setShowTagInput(false);

        // Invalidate and refetch menu categories after successful posting to refresh the list
        if (user?.discordId) {
          queryClient.invalidateQueries({
            queryKey: ['menu_categories', user.discordId],
          });
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

      // Remove optimistic post on error
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
                      
                      // Check if user just typed # or is typing after #
                      if (e.key === '#' || (e.key !== 'Escape' && lastHashIndex !== -1)) {
                        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
                        const hasSpace = textAfterHash.includes(' ');
                        
                        if (!hasSpace && lastHashIndex !== -1) {
                          setHashtagQuery(textAfterHash);
                          setShowHashtagSuggestions(true);
                          
                          // Calculate position for suggestions dropdown
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
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                {/* Media Preview */}
                {mediaPreview.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {mediaPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        {mediaFiles[index]?.type.startsWith('image/') ? (
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={preview}
                            className="w-full h-32 object-cover rounded-lg"
                            muted
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    {/* <span className='text-[#8A8C95] font-medium'>
                    Who can see this:
                  </span> */}
                    {/* <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                icon={Icon.downIcon}
                                className="px-4 py-[14px] h-auto shadow-[2px_2px_0_0_#1F2227] text-[15px]  text-[#FF007F] border-[#1F2227] bg-[#0A0A0A] rounded-[4px]"
                              >
                                <SelectValue
                                  placeholder="Select Visibility"
                                  asChild
                                >
                                  <span>
                                    {visibility.find(
                                      (v) => v.value === field.value
                                    )?.label || 'Select Visibility'}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded shadow-[2px_2px_0_0_#1F2227] p-4 border-[#1F2227] border !bg-[#0F1114]">
                              {visibility.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  className="py-4 first:pt-0 last:pb-0 last:border-none text-[15px] text-[#D4D4D8] hover:text-white border-b rounded-none"
                                  value={option.value}
                                >
                                  <option.icon className="size-5 mr-2" />
                                  {option.label}
                                  {option.description &&
                                    ` (${option.description})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    /> */}
                  </div>
                </div>
                <div className="space-y-[18px]">
                  {/* {form.watch('visibility') === 'subscribers' && ( */}
                  {/* <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Icon.moneySendOutline className="absolute -translate-y-1/2 top-1/2 left-4" />
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="Prices"
                              className="bg-[#0F1114] border-[#0F1114] h-auto p-4 pl-12 placeholder:text-[#9E9E9E] rounded-[8px]"
                              onChange={(e) => {
                                const raw = e.target.value.replace(
                                  /[^\d]/g,
                                  ''
                                );
                                const formatted = raw
                                  ? new Intl.NumberFormat('en-US').format(
                                      Number(raw)
                                    )
                                  : '';
                                field.onChange(formatted);
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                  {/* )} */}

                  {/* {form.watch('visibility') === 'custom_plan' && (
                    <FormField
                      control={form.control}
                      name="subscription"
                      render={({ field }) => (
                        <FormItem className="space-y-6">
                          <FormLabel className="text-[15px] text-[#8A8C95] font-medium">
                            Select subscription Tiers
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 !overflow-y-scroll max-h-[100px]"
                            >
                              {subscriptionIsLoading ? (
                                <ComponentLoader />
                              ) : subscriptionPlans ? (
                                subscriptionPlans?.map((subscription) => (
                                  <FormItem
                                    key={subscription._id}
                                    className="relative"
                                  >
                                    <FormControl>
                                      <FormLabel
                                        htmlFor={subscription._id}
                                        className="flex items-center gap-4 p-4 rounded-[8px] border border-[#1F2227] justify-between w-full  transition-colors peer-data-[state=checked]:border-[#FF007F]"
                                      >
                                        <div className="flex items-center gap-4">
                                          <Icon.all />
                                          <div className="flex flex-col">
                                            <span className="text-[15px] font-medium text-[#D4D4D8]">
                                              {subscription.name}
                                            </span>
                                            <span className="text-xs text-[#8A8C95]">
                                              {subscription.amount} USD/monthly
                                            </span>
                                          </div>
                                        </div>
                                        <RadioGroupItem
                                          id={subscription._id}
                                          value={subscription._id}
                                          className="peer"
                                        />
                                      </FormLabel>
                                    </FormControl>
                                  </FormItem>
                                ))
                              ) : (
                                <EmptyStates>
                                  <EmptyStates.Icon icon={IconMoodSad}>
                                    You've don't have any subscription plans
                                    yet.
                                  </EmptyStates.Icon>
                                </EmptyStates>
                              )}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )} */}

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
                                        // Create menu category via API
                                        const response = await createMenuCategory({
                                          owner: user.discordId,
                                          category: newTag,
                                        });

                                        if (response.data) {
                                          // Invalidate query to trigger background refetch
                                          queryClient.invalidateQueries({
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
                      // Get last 5 menu categories
                      const displayCategories = (menuCategories ?? []).slice(-5);
                      
                      return (
                        <FormItem className="flex gap-2 flex-wrap">
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
                                    
                                    // Add hashtag to content
                                    const contentField = form.getValues('content');
                                    const textarea = textareaRef.current;
                                    if (textarea) {
                                      const cursorPosition = textarea.selectionStart;
                                      const newContent = 
                                        contentField.substring(0, cursorPosition) +
                                        `#${item.text} ` +
                                        contentField.substring(cursorPosition);
                                      form.setValue('content', newContent);
                                      
                                      // Set cursor position after inserted hashtag
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
                          // Use selected date or today's date if no date is selected yet
                          const baseDate = dateValue ?? new Date();
                          const combined = setMinutes(setHours(new Date(baseDate), h), m);
                          field.onChange(combined.toISOString());
                        };
                        
                        // Get time value for the input
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
                                      {/* Hours */}
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
                                      
                                      {/* Minutes */}
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

// const visibility = [
//   {
//     value: 'general',
//     label: 'Everyone',
//     description: 'Free content',
//     icon: Icon.subscription,
//   },
//   {
//     value: 'subscribers',
//     label: 'All Subscribers',
//     description: 'Paid content for all subscribers',
//     icon: Icon.subscription,
//   },
//   {
//     value: 'custom_plan',
//     label: 'Specific Subscription Tier',
//     description: 'Content for selected tier only',
//     icon: Icon.subscription,
//   },
// ];
