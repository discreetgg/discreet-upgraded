import { cn, getBlurredImage } from '@/lib/utils';
import type { MediaType } from '@/types/global';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { unlockMessageAssetService } from '@/lib/services';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { useWallet } from '@/context/wallet-context-provider';

interface MessageMediaPaidProps {
  media: MediaType[];
  buyerId?: string;
  sellerId?: string;
  conversationId?: string;
  messageId?: string;
  price?: string;
  type?: string;
}

export const MessageMediaPaid = ({
  media,
  buyerId,
  sellerId,
  conversationId,
  messageId,
  price,
  type,
}: MessageMediaPaidProps) => {
  const { setIsFundWalletDialogOpen } = useWallet();
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const gridClasses = (() => {
    if (media.length === 1) {
      return 'grid-cols-1';
    }
    if (media.length === 2) {
      return 'grid-cols-2';
    }
    return 'grid-cols-2 md:grid-cols-2';
  })();

  const handleUnlock = async () => {
    if (!buyerId || !sellerId || !conversationId || !messageId) {
      toast.error('Missing required information to unlock media');
      return;
    }

    setIsUnlocking(true);

    unlockMessageAssetService({
      buyerId,
      sellerId,
      conversationId,
      messageId,
    })
      .then(() => {
        toast.success('Media unlocked successfully!');
        // Optionally reload or update the media state here
      })
      .catch((error: { message?: string }) => {
        toast.error('Failed to unlock media', {
          description: error?.message || 'Something went wrong',
        });

        if (error?.message === 'Insufficient funds') {
          setIsFundWalletDialogOpen(true);
        }
      })
      .finally(() => {
        setIsUnlocking(false);
      });
  };

  return (
    <div className="rounded-2xl overflow-hidden">
      <div className={cn('grid gap-1', gridClasses)}>
        {media.map((item, index) => {
          const mediaKey = `${item._id ?? 'media'}-${item.url ?? 'no-url'}-${index}`;
          return (
            <motion.div
              key={mediaKey}
            className={cn(
              'relative w-full aspect-[16/9] !overflow-hidden',
              media.length > 1 && 'aspect-square'
            )}
          >
            {item.type === 'image' ? (
              <>
                <Image
                  src={getBlurredImage(item.url, 2000)}
                  alt={item.caption || `Locked media ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
                {index === 0 && type !== 'in_message_media' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={handleUnlock}
                      disabled={isUnlocking}
                      className="bg-[#FF007F] hover:bg-[#FF007F]/80 text-black font-semibold px-6 py-3 rounded-lg flex text-sm items-center gap-2 shadow-lg"
                    >
                      {isUnlocking ? (
                        <>
                          <Icon.loadingIndicator className="w-5 h-5 animate-spin" />
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <Icon.lock className="w-5 h-5" />
                          <span>Unlock for: ${price}</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : item.type === 'video' && type !== 'in_message_media' ? (
              <>
                <video
                  className="w-full h-full object-cover blur-3xl"
                  preload="metadata"
                >
                  <source src={item.url} type="video/mp4" />
                  <track kind="captions" label="English" />
                </video>
                {index === 0 && type !== 'in_message_media' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={handleUnlock}
                      disabled={isUnlocking}
                      className="bg-[#FF007F] hover:bg-[#FF007F]/80 text-black font-semibold px-6 py-3 rounded-lg text-sm flex items-center gap-2 shadow-lg"
                    >
                      {isUnlocking ? (
                        <>
                          <Icon.loadingIndicator className="w-5 h-5 animate-spin" />
                          <span>Unlocking...</span>
                        </>
                      ) : (
                        <>
                          <Icon.lock className="w-5 h-5" />
                          <span>Unlock</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
