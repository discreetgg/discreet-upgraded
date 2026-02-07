'use client';

import { useMemo, useState } from 'react';
import { Icon } from './ui/icons';
import { MediaType, MessageType } from '@/types/global';
import { useGlobal } from '@/context/global-context-provider';
import { toast } from 'sonner';
import { unlockMessageAssetService } from '@/lib/services';
import { MessageMediaDialog } from './message-media-dialog';
import { cn, getBlurredImage, getProxiedMediaUrl } from '@/lib/utils';
import { AuthenticatedMedia } from './authenticated-media';
import { useWallet } from '@/context/wallet-context-provider';
import { VideoPlayer } from './shared/video-player';

export const DMMenuPreview = ({
  mediaArray,
  message,
  onReloadMessages,
  onSendUnlockMessage,
}: {
  mediaArray: MediaType[];
  message: MessageType;
  onReloadMessages?: () => Promise<void>;
  onSendUnlockMessage?: (
    messageId: string,
    price: string,
    sellerId: string,
  ) => Promise<void>;
}) => {
  const { user } = useGlobal();
  const { setIsFundWalletDialogOpen } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(message.paid);
  const totalImages = mediaArray.length;
  const sellerId = message.sender.discordId ?? '';
  const isPaid = isUnlocked || message.paid;
  const pageLabel = useMemo(
    () => `${currentIndex + 1}/${totalImages}`,
    [currentIndex, totalImages]
  );

  const isReceiver = message.reciever.discordId === user?.discordId;

  const handleUnlock = async () => {
    if (
      !user?.discordId ||
      !(message.sender.discordId ?? message.sender) ||
      !message.conversation ||
      !message._id
    ) {
      toast.error('Missing required information to unlock media');
      return;
    }

    setIsUnlocking(true);

    unlockMessageAssetService({
      buyerId: user?.discordId,
      sellerId: message.sender.discordId,
      conversationId: message.conversation,
      messageId: message._id,
    })
      .then(async () => {
        toast.success('Media unlocked successfully!');
        setIsUnlocked(true);
        
        // Reload messages to update the message.paid status
        // This ensures the UI reflects the unlocked state without requiring a page refresh
        if (onReloadMessages) {
          try {
            await onReloadMessages();
          } catch (error) {
            console.error('❌ Error reloading messages:', error);
          }
        }
        
        // Send unlock notification message to both sender and receiver
        if (sellerId && message.price) {
          try {
            await onSendUnlockMessage?.(message._id, message.price, sellerId);
          } catch (error) {
            console.error('Failed to send unlock notification message:', error);
          }
        }
      })
      .catch((error: { message?: string }) => {
        toast.error('Failed to unlock media', {
          description: error?.message || 'Something went wrong',
        });

        if (error?.message === 'Insufficient funds') {
          setIsFundWalletDialogOpen(true);
        }

        setIsUnlocked(false);
      })
      .finally(() => {
        setIsUnlocking(false);
      });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const imagesNumber = useMemo(
    () => mediaArray.filter((media) => media.type === 'image').length,
    [mediaArray]
  );
  const videosNumber = useMemo(
    () => mediaArray.filter((media) => media.type === 'video').length,
    [mediaArray]
  );

  return (
    <div className="w-full h-full relative">
      <div className="flex flex-col gap-4 bg-[#15171B] rounded-[4px] max-h-[500px] py-[10px] px-[16px] max-w-[412px] h-full overflow-y-auto hidden_scrollbar mt-2.5">
        <div className="flex items-center gap-2 justify-between">
          <p className=" items-center text-[#8A8C95] text-[10px] flex gap-1">
            {isPaid ? <Icon.unlock /> : <Icon.lock />}{' '}
            <span className="">{isPaid ? 'Paid' : 'Not Paid'}</span>
          </p>
          <div className="flex justify-center items-center gap-1">
            <button
              id="previous-button"
              onClick={handlePrev}
              aria-label="View previous image"
              className="relative w-5 h-5  flex items-center bg-white/15 rounded-full  justify-center disabled:opacity-50"
            >
              {/* <div className="absolute inset-0 flex w-full aspect-square items-center justify-center bg-[#15171B] rounded-full "></div> */}
              {/* <div className="absolute inset-0 flex w-[90%] self-center mx-auto aspect-square items-center justify-center bg-white/15 rounded-full "/> */}
              {/* <Image width={120} height={120} alt="back-arrow" src="/back-arrow-bg.png" className="absolute w-full  h-full"/> */}
              <Icon.chevronDown className="rotate-90 bg-opacity-60" />
            </button>
            <p className="text-[10px] relative">{pageLabel}</p>
            <button
              id="next-button"
              onClick={handleNext}
              aria-label="View next image"
              className="relative w-5 h-5 flex items-center bg-white/15 rounded-full  justify-center disabled:opacity-50"
            >
              {/* <Image width={120} height={120} alt="back-arrow" src="/back-arrow-bg.png" className="absolute w-full  h-full"/> */}
              <Icon.chevronDown className="-rotate-90 " />
            </button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[12px]">
          <div
            className="flex gap-2 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {mediaArray.map((media, index) => {
              const isPaidContent =
                media.caption === 'content image' ||
                media.caption === 'content video' ||
                media.caption === 'video';
              const mediaIsPaid = isPaid || media.paid;
              const shouldShowBlurred =
                isReceiver && isPaidContent && !mediaIsPaid;

              return (
                <div key={media._id ?? index} className="min-w-full">
                  {media.type === 'image' ? (
                    <MessageMediaDialog
                      key={media._id ?? index}
                      media={mediaArray}
                      activeMediaIndex={index}
                      activeMedia={media}
                      isMediaLocked={(mediaItem) => {
                        const isPaidContent =
                          mediaItem.caption === 'content image' ||
                          mediaItem.caption === 'content video' ||
                          mediaItem.caption === 'video';
                        const mediaItemIsPaid = isPaid || mediaItem.paid;
                        return isReceiver && isPaidContent && !mediaItemIsPaid;
                      }}
                    >
                      <div className="relative w-full h-[226px]">
                        <AuthenticatedMedia
                          type="image"
                          src={
                            shouldShowBlurred
                              ? getBlurredImage(
                                  getProxiedMediaUrl(media._id, media.url),
                                  10000
                                )
                              : getProxiedMediaUrl(media._id, media.url)
                          }
                          alt={media.caption || 'Media preview'}
                          width={400}
                          height={400}
                          className={cn(
                            'w-full h-[226px] object-cover rounded-[12px]',
                            shouldShowBlurred && 'blur-xl'
                          )}
                        />
                        {shouldShowBlurred && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[12px]">
                            <div className="flex flex-col items-center gap-2">
                              <Icon.lock className="w-8 h-8 text-white/80" />
                              <span className="text-white/80 text-xs font-medium">
                                Locked Content
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </MessageMediaDialog>
                  ) : media.type === 'video' ? (
                    <div className="relative w-full h-[226px]">
                      {shouldShowBlurred ? (
                        <>
                          <AuthenticatedMedia
                            type="video"
                            src={getProxiedMediaUrl(media._id, media.url)}
                            alt={media.caption || 'Video'}
                            className="w-full h-[226px] object-cover rounded-[12px] blur-2xl"
                            videoProps={{
                              preload: 'metadata',
                              muted: true,
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[12px]">
                            <div className="flex flex-col items-center gap-2">
                              <Icon.lock className="w-8 h-8 text-white/80" />
                              <span className="text-white/80 text-xs font-medium">
                                Locked Content
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <VideoPlayer
                          key={media._id ?? index}
                          src={getProxiedMediaUrl(media._id, media.url)}
                          className="w-full h-[226px] object-contain rounded-[12px]"
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-accent-text">
            <div className="cursor-pointer flex items-center gap-1 text-xs">
              <Icon.image className="w-4 h-4" /> {imagesNumber}
            </div>
            <div className="cursor-pointer flex items-center gap-1 text-xs">
              <Icon.videoIcon className="w-4 h-4" /> {videosNumber}
            </div>
          </div>
          {isReceiver && !isPaid && (
            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className=" text-[#15171B] bg-[#FF007F]  text-[15px] font-bold  px-4 py-2 rounded-full"
            >
              {isUnlocking ? (
                <div className="flex items-center gap-2">
                  {/* <Icon.loadingIndicator fill="#15171B" stroke="#15171B"  className="w-5 h-5 animate-spin " /> */}
                  <span>Unlocking...</span>
                </div>
              ) : (
                <span>
                  Unlock for ${Number(message?.price).toLocaleString()}
                </span>
              )}
            </button>
          )}
        </div>
        <h1 className="text-[#F8F8F8] text-[22px] font-bold">
          {message.title || 'Lorem ipsum dolor sit amet.'}
        </h1>
        <p className="text-[#F8F8F8] text-[10px]">
          {message.description ||
            'Lorem ipsum dolor sit amet. you can unlock the content by clicking the button below. if you have any questions, please contact the creator.'}
        </p>
      </div>
    </div>
  );
};
