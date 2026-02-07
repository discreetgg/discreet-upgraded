import {
  ALLOWED_MEDIA_TYPES,
  MAX_FILE_SIZE,
  isValidFileType,
} from '@/lib/file-utils';
import { cn, getEmojiSizeClass, getEmojiInlineStyle } from '@/lib/utils';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Theme, EmojiStyle } from 'emoji-picker-react';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { ComponentLoader } from './ui/component-loader';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { MessageUploadWithPaymentBox } from './message-upload-with-payment-box';
import { MessageSendTip } from './message-send-tip';
import { useGlobal } from '@/context/global-context-provider';
import { MediaPreview } from './media-preview';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="w-[280px] h-[320px] flex items-center justify-center bg-[#1f2227]">
      <ComponentLoader />
    </div>
  ),
});

interface MessageInputProps {
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMediaSelect: (files: FileList) => void;
  isDmMenuSubmit?: boolean;
  isLoading?: boolean;
  senderId?: string;
  receiverId?: string;
  receiverRole?: string;
  handleDMMenuClick?: () => void;
  handleDmMenuSubmit?: () => void;
  isDemenuSubmitting?: boolean;
  sendTipMessage?: (amount: number, receiverId: string) => Promise<void>;
}

export const MessageInput = ({
  className,
  value,
  onChange,
  onSubmit,
  onMediaSelect,
  isLoading = false,
  isDmMenuSubmit = false,
  handleDMMenuClick,
  handleDmMenuSubmit,
  senderId,
  receiverId,
  receiverRole,
  isDemenuSubmitting = false,
  sendTipMessage,
}: MessageInputProps) => {
  const { user } = useGlobal();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showPaymentBox, setShowPaymentBox] = useState(false);
  const [showTipBox, setShowTipBox] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce the value to reduce emoji checks during fast typing
  useEffect(() => {
    // For very short text or emojis, update immediately
    if (value.length <= 3) {
      setDebouncedValue(value);
      return;
    }

    // For longer text, debounce slightly
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 50); // Very short debounce, just enough to batch keystrokes

    return () => clearTimeout(timer);
  }, [value]);

  // Memoize emoji styling using debounced value
  const emojiSizeClass = useMemo(
    () => getEmojiSizeClass(debouncedValue),
    [debouncedValue]
  );
  const emojiInlineStyle = useMemo(
    () => getEmojiInlineStyle(debouncedValue),
    [debouncedValue]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDmMenuSubmit) {
      handleDmMenuSubmit?.();
      return;
    }
    if ((!value.trim() && selectedFiles.length === 0) || isLoading) return;
    onSubmit(e);
    setSelectedFiles([]);
    setShowPaymentBox(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Validate files
      const validFiles = newFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} is too large. Max size is 50MB.`);
          return false;
        }
        if (!isValidFileType(file, ALLOWED_MEDIA_TYPES)) {
          toast.error(`File ${file.name} is not a supported media type.`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        setShowPaymentBox(true);

        // Create FileList for the hook
        const dataTransfer = new DataTransfer();
        for (const file of validFiles) {
          dataTransfer.items.add(file);
        }
        onMediaSelect(dataTransfer.files);
      }
    }
    // Reset input value to allow selecting same files again
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setShowPaymentBox(false);
  };

  const handleEmojiClick = useCallback(
    (emojiData: { emoji: string }) => {
      // Create a synthetic event to update the textarea value
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const event = {
          target: {
            value: value + emojiData.emoji,
          },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
      }
      setIsEmojiPickerOpen(false);
    },
    [value, onChange]
  );

  const mediaIcons = [
    {
      icon: <Icon.gallery />,
      alt: 'Gallery',
      onClick: handleGalleryClick,
      isEmojiPicker: false,
    },
    {
      icon: <Icon.attachVideo />,
      alt: 'Video play',
      onClick: handleVideoClick,
      isEmojiPicker: false,
    },
    user?.role === 'seller' && {
      icon: <Icon.pockedollar />,
      alt: 'DM menu',
      onClick: handleDMMenuClick,
      isEmojiPicker: false,
    },
    {
      icon: <Icon.emoji />,
      alt: 'Emoji happy',
      onClick: () => {},
      isEmojiPicker: true,
    },

    // {
    //   icon: <Icon.sticker />,
    //   alt: 'Sticker',
    //   onClick: () => {}, // TODO: Implement sticker picker
    //   isEmojiPicker: false,
    // },
  ];

  const handlePaymentBoxSubmit = (data: {
    files: File[];
    isPayable: boolean;
    price?: string;
    details?: string;
  }) => {
    const syntheticEvent = {
      preventDefault: () => {},
      paymentData: {
        isPayable: data.isPayable,
        price: data.price,
        details: data.details,
      },
    };

    onSubmit(syntheticEvent as unknown as React.FormEvent);
    setSelectedFiles([]);
    setShowPaymentBox(false);
  };

  return (
    <div>
      {/* {showPaymentBox &&
        selectedFiles.length > 0 &&
        user?.role === 'seller' && (
          <MessageUploadWithPaymentBox
            files={selectedFiles}
            onRemove={handleRemoveFile}
            onClearAll={handleClearAllFiles}
            onClose={() => setShowPaymentBox(false)}
            onSubmit={handlePaymentBoxSubmit}
          />
        )} */}

      {showTipBox &&
        user?.role === 'buyer' &&
        receiverRole === 'seller' &&
        senderId &&
        receiverId && (
          <MessageSendTip
            receiverId={receiverId}
            onClose={() => setShowTipBox(false)}
            sendTipMessage={sendTipMessage}
          />
        )}

      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'bg-[#1f2227] rounded-lg border border-solid border-[#3c3c42] shadow-none',
            className
          )}
        >
          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "p-2.5 !bg-transparent border-none shadow-none resize-none [font-family:'Inter_Display-Regular',Helvetica] font-normal text-[#898c94] text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
              emojiSizeClass
            )}
            style={emojiInlineStyle}
            placeholder="Type here..."
          />
          
            <MediaPreview
              files={selectedFiles}
              onRemove={handleRemoveFile}
              onClearAll={handleClearAllFiles}
            />  
          <div className="flex items-center p-2.5 justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-[11px]">
                {mediaIcons.map((item, index) =>
                  !item ? null : item.isEmojiPicker ? (
                    <Popover
                      key={index}
                      open={isEmojiPickerOpen}
                      onOpenChange={setIsEmojiPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="w-[18.37px] h-[18.37px] p-0"
                        >
                          {item.icon}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 border-0 bg-[#1f2227]"
                        align="start"
                        side="top"
                      >
                        <div className="[&_.epr-emoji]:text-[8px] [&_.epr-emoji]:w-[8px] [&_.epr-emoji]:h-[8px] [&_button.epr-emoji-category-button]:text-[8px]">
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={280}
                            height={320}
                            theme={Theme.DARK}
                            previewConfig={{
                              showPreview: false,
                            }}
                            searchPlaceHolder="Search emoji..."
                            lazyLoadEmojis={true}
                            emojiStyle={EmojiStyle.NATIVE}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="w-[18.37px] h-[18.37px] p-0"
                      onClick={item.onClick}
                    >
                      {item.icon}
                    </Button>
                  )
                )}
              </div>

              <Separator
                orientation="vertical"
                className="h-[19px] bg-[#898c94]"
              />

              {user?.role === 'buyer' && receiverRole === 'seller' && (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="w-[17.32px] h-[17.32px] p-0"
                  onClick={() => setShowTipBox(!showTipBox)}
                >
                  <Icon.moneySend />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="w-6 h-6 p-0"
              disabled={
                isLoading || (!value.trim() && selectedFiles.length === 0 && !isDmMenuSubmit) || isDemenuSubmitting
              }
            >
              <Icon.send
                fill={
                  isLoading || (!value.trim() && selectedFiles.length === 0 && !isDmMenuSubmit) || isDemenuSubmitting
                    ? '#3C3C42'
                    : '#fff'
                }
              />
            </Button>
          </div>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </form>
    </div>
  );
};
