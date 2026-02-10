'use client';

import type { MediaType, MessageType } from '@/types/global';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComponentLoader } from './ui/component-loader';
import { useParams } from 'next/navigation';
import { getConversationByIdService } from '@/lib/services';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSharedMediaTab } from '@/hooks/use-shared-media-tab';
import { useGlobal } from '@/context/global-context-provider';
import { AuthenticatedMedia } from './authenticated-media';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';
import { Button } from './ui/button';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import { MessageMediaDialog } from './message-media-dialog';
import { ArrowLeft, Lock, Play } from 'lucide-react';

const validTabs = [
  'all',
  'purchased',
  'unlocked',
  'locked',
  'images',
  'videos',
] as const;
type SharedMediaTab = (typeof validTabs)[number];

const mediaMessageTypes = new Set(['media', 'menu', 'in_message_media']);

type SharedMediaItem = {
  media: MediaType;
  messageId: string;
  conversationId: string;
  isPurchased: boolean;
  isLocked: boolean;
  price?: string;
  messageTitle?: string;
};

type LockedBundle = {
  messageId: string;
  conversationId: string;
  price?: string;
  messageTitle?: string;
  previewMedia: MediaType;
  itemCount: number;
  imageCount: number;
  videoCount: number;
};

const getPriceLabel = (price?: string) => {
  if (!price) {
    return '';
  }

  const numericPrice = Number(price);
  if (Number.isFinite(numericPrice)) {
    return `$${numericPrice.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${price}`;
};

const isMediaLockedForViewer = (
  message: MessageType,
  media: MediaType,
  viewerDiscordId?: string,
) => {
  if (!viewerDiscordId) {
    return false;
  }

  const isReceiver = message.reciever?.discordId === viewerDiscordId;
  if (!isReceiver) {
    return false;
  }

  if (!message.isPayable || message.paid || media.paid) {
    return false;
  }

  if (message.type === 'in_message_media') {
    const caption = (media.caption ?? '').toLowerCase();
    const isFreePreview =
      caption.includes('free preview') || caption.includes('cover image');
    return !isFreePreview;
  }

  return true;
};

export const MessageSharedMediaContainer = ({ showTitle = true }) => {
  const [{ mediaTab: currentTab }, setCurrentTab] = useSharedMediaTab();

  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversationMessages = useCallback(
    async (background = false) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        if (!background) {
          setLoading(true);
        }

        const response = await getConversationByIdService(conversationId, {
          limit: 200,
          force: true,
        });

        setMessages(Array.isArray(response) ? response : []);
      } catch (error: any) {
        setMessages([]);
        toast.error('Error fetching shared media', {
          description: error?.message ?? 'Something went wrong.',
        });
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [conversationId],
  );

  useEffect(() => {
    void fetchConversationMessages();
  }, [fetchConversationMessages]);

  const { user } = useGlobal();
  const isBuyer = user?.role === 'buyer';

  const sharedMedia = useMemo<SharedMediaItem[]>(() => {
    return messages.flatMap((message) => {
      if (!mediaMessageTypes.has(message.type) || !Array.isArray(message.media)) {
        return [];
      }

      return message.media.flatMap((entry) => {
        if (!entry || typeof entry === 'string') {
          return [];
        }

        if (entry.type !== 'image' && entry.type !== 'video') {
          return [];
        }

        const isLocked = isMediaLockedForViewer(message, entry, user?.discordId);
        const isReceiver = message.reciever?.discordId === user?.discordId;
        const isPayable = Boolean(message.isPayable);
        const isPurchased =
          isReceiver && isPayable && Boolean(message.paid || entry.paid);

        return [
          {
            media: entry,
            messageId: message._id,
            conversationId: message.conversation,
            isPurchased,
            isLocked,
            price: message.price,
            messageTitle: message.title || message.text || '',
          },
        ];
      });
    });
  }, [messages, user?.discordId]);

  const mediaByTab = useMemo(
    () => ({
      all: sharedMedia,
      purchased: sharedMedia.filter((item) => item.isPurchased),
      unlocked: sharedMedia.filter((item) => !item.isLocked),
      locked: sharedMedia.filter((item) => item.isLocked),
      images: sharedMedia.filter((item) => item.media.type === 'image'),
      videos: sharedMedia.filter((item) => item.media.type === 'video'),
    }),
    [sharedMedia],
  );

  const lockedBundles = useMemo<LockedBundle[]>(() => {
    const groupedByMessageId = new Map<string, SharedMediaItem[]>();

    mediaByTab.locked.forEach((item) => {
      const existing = groupedByMessageId.get(item.messageId) ?? [];
      existing.push(item);
      groupedByMessageId.set(item.messageId, existing);
    });

    return Array.from(groupedByMessageId.entries())
      .map(([messageId, items]) => {
        const imageCount = items.filter(
          (entry) => entry.media.type === 'image',
        ).length;
        const videoCount = items.length - imageCount;
        const firstItem = items[0];
        const messageTitle =
          items.find((entry) => entry.messageTitle?.trim())?.messageTitle?.trim() ||
          '';

        return {
          messageId,
          conversationId: firstItem.conversationId,
          price: firstItem.price,
          messageTitle,
          previewMedia: firstItem.media,
          itemCount: items.length,
          imageCount,
          videoCount,
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.previewMedia.createdAt ?? 0).getTime();
        const bTime = new Date(b.previewMedia.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
  }, [mediaByTab.locked]);

  const handleJumpToMessage = useCallback((messageId: string) => {
    if (!messageId || typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('messages:jump-to', {
        detail: { messageId },
      }),
    );
  }, []);

  const tabConfig = useMemo<Array<{ tab: SharedMediaTab; label: string }>>(() => {
    if (isBuyer) {
      return [
        { tab: 'all', label: 'All' },
        { tab: 'purchased', label: 'Purchased' },
        { tab: 'unlocked', label: 'Unlocked' },
        { tab: 'locked', label: 'Locked' },
        { tab: 'images', label: 'Images' },
        { tab: 'videos', label: 'Videos' },
      ];
    }

    return [
      { tab: 'all', label: 'All' },
      { tab: 'unlocked', label: 'Unlocked' },
      { tab: 'locked', label: 'Locked' },
      { tab: 'images', label: 'Images' },
      { tab: 'videos', label: 'Videos' },
    ];
  }, [isBuyer]);

  const allowedTabs = tabConfig.map((item) => item.tab);
  const activeTab: SharedMediaTab = allowedTabs.includes(
    currentTab as SharedMediaTab,
  )
    ? (currentTab as SharedMediaTab)
    : (allowedTabs[0] ?? 'all');

  if (loading) {
    return (
      <ComponentLoader className="flex items-center justify-center w-full" />
    );
  }

  const emptyLabels: Record<SharedMediaTab, string> = {
    all: 'No shared media yet',
    purchased: 'No purchased media yet',
    unlocked: 'No unlocked media yet',
    locked: 'No locked media found',
    images: 'No shared images found',
    videos: 'No shared videos found',
  };

  return (
    <div className="px-1.5">
      {showTitle && <h3 className="py-0 text-sm font-medium">Shared Media</h3>}

      <div className={cn('space-y-3', showTitle ? 'pt-3' : 'pt-0')}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setCurrentTab({
              mediaTab: validTabs.includes(value as SharedMediaTab)
                ? (value as SharedMediaTab)
                : 'all',
            });
          }}
        >
          <TabsList className="bg-transparent p-0 -mb-[1px] gap-2 flex-wrap h-auto justify-start">
            {tabConfig.map((item) => (
              <TabsTrigger
                key={item.tab}
                value={item.tab}
                className="text-xs text-[#D4D4D8] font-medium data-[state=active]:rounded-[8px] data-[state=active]:px-3 px-0 py-1 h-auto border-none data-[state=active]:bg-[#2E2E32]"
              >
                {item.label} (
                {item.tab === 'locked' && isBuyer
                  ? lockedBundles.length
                  : mediaByTab[item.tab].length}
                )
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfig.map(({ tab }) => (
            <TabsContent key={tab} value={tab} className="mt-3">
              {tab === 'locked' && isBuyer ? (
                lockedBundles.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-[#8A8C95]">
                      Grouped by locked bundle
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {lockedBundles.map((bundle) => (
                        <LockedBundlePreview
                          key={bundle.messageId}
                          bundle={bundle}
                          onJumpToMessage={handleJumpToMessage}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyStates className="mt-10">
                    <EmptyStates.Icon icon={Icon.image}>
                      {emptyLabels[tab]}
                    </EmptyStates.Icon>
                  </EmptyStates>
                )
              ) : mediaByTab[tab].length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {mediaByTab[tab].map((item, index) => (
                    <SharedMediaPreview
                      key={`${item.messageId}-${item.media._id}-${index}`}
                      item={item}
                      onJumpToMessage={handleJumpToMessage}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStates className="mt-10">
                  <EmptyStates.Icon icon={Icon.image}>
                    {emptyLabels[tab]}
                  </EmptyStates.Icon>
                </EmptyStates>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

const LockedBundlePreview = ({
  bundle,
  onJumpToMessage,
}: {
  bundle: LockedBundle;
  onJumpToMessage: (messageId: string) => void;
}) => {
  const previewUrl = getProxiedMediaUrl(
    bundle.previewMedia._id,
    bundle.previewMedia.url,
  );

  const mediaBreakdownParts = [
    bundle.imageCount > 0
      ? `${bundle.imageCount} image${bundle.imageCount > 1 ? 's' : ''}`
      : '',
    bundle.videoCount > 0
      ? `${bundle.videoCount} video${bundle.videoCount > 1 ? 's' : ''}`
      : '',
  ].filter(Boolean);

  return (
    <div className="relative aspect-square overflow-hidden rounded-[10px] border border-[#1E2227] bg-[#0F1114]">
      {bundle.previewMedia.type === 'image' ? (
        <AuthenticatedMedia
          type="image"
          src={previewUrl}
          alt={bundle.messageTitle || 'Locked bundle'}
          fill
          className="object-cover blur-2xl scale-110 brightness-45"
        />
      ) : (
        <AuthenticatedMedia
          type="video"
          src={previewUrl}
          alt={bundle.messageTitle || 'Locked bundle'}
          className="h-full w-full object-contain blur-2xl scale-110 brightness-45"
          videoProps={{
            muted: true,
            playsInline: true,
            preload: 'metadata',
          }}
        />
      )}

      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/35 via-black/45 to-black/80 p-2.5">
        <div className="flex items-center justify-between gap-1">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] text-white">
            <Lock className="size-3" />
            Locked bundle
          </div>
          {bundle.price && (
            <div className="rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-medium text-white/90">
              {getPriceLabel(bundle.price)}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-white/95">
            {bundle.itemCount} locked item{bundle.itemCount > 1 ? 's' : ''}
          </p>
          {bundle.messageTitle && (
            <p className="truncate text-[10px] text-white/75">
              {bundle.messageTitle}
            </p>
          )}
          <p className="text-[10px] text-white/65">
            {mediaBreakdownParts.join(' • ')}
          </p>
        </div>

        <Button
          type="button"
          onClick={() => onJumpToMessage(bundle.messageId)}
          className={cn(
            'h-8 w-full rounded-md px-2 text-[11px] font-medium',
            'bg-black/55 hover:bg-black/70 border border-white/20 text-white',
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span className="truncate">Open in chat</span>
        </Button>
      </div>
    </div>
  );
};

const SharedMediaPreview = ({
  item,
  onJumpToMessage,
}: {
  item: SharedMediaItem;
  onJumpToMessage: (messageId: string) => void;
}) => {
  const mediaUrl = getProxiedMediaUrl(item.media._id, item.media.url);

  if (item.isLocked) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[10px] border border-[#1E2227] bg-[#0F1114]">
        {item.media.type === 'image' ? (
          <AuthenticatedMedia
            type="image"
            src={mediaUrl}
            alt={item.media.caption || 'Locked media'}
            fill
            className="object-cover blur-2xl scale-110 brightness-50"
          />
        ) : (
          <AuthenticatedMedia
            type="video"
            src={mediaUrl}
            alt={item.media.caption || 'Locked video'}
            className="h-full w-full object-contain blur-2xl scale-110 brightness-50"
            videoProps={{
              muted: true,
              playsInline: true,
              preload: 'metadata',
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/35 via-black/45 to-black/75 p-2.5">
          <div className="flex items-center justify-between gap-1">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] text-white">
              <Lock className="size-3" />
              Locked
            </div>
            {item.price && (
              <div className="rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-medium text-white/90">
                {getPriceLabel(item.price)}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => onJumpToMessage(item.messageId)}
            className={cn(
              'h-8 w-full rounded-md px-2 text-[11px] font-medium',
              'bg-black/55 hover:bg-black/70 border border-white/20 text-white',
            )}
          >
            <ArrowLeft className="size-3.5" />
            <span className="truncate">Open in chat</span>
          </Button>
        </div>
      </div>
    );
  }

  if (item.media.type === 'image') {
    return (
      <MessageMediaDialog media={[item.media]} activeMediaIndex={0}>
        <div className="relative aspect-square overflow-hidden rounded-[10px] border border-[#1E2227] bg-[#0F1114] cursor-zoom-in">
          <AuthenticatedMedia
            type="image"
            src={mediaUrl}
            alt={item.media.caption || 'Shared image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
      </MessageMediaDialog>
    );
  }

  return (
    <MessageMediaDialog media={[item.media]} activeMediaIndex={0}>
      <div className="relative aspect-square overflow-hidden rounded-[10px] border border-[#1E2227] bg-black cursor-zoom-in">
        <AuthenticatedMedia
          type="video"
          src={mediaUrl}
          alt={item.media.caption || 'Shared video'}
          className="h-full w-full object-contain"
          videoProps={{
            muted: true,
            playsInline: true,
            preload: 'metadata',
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 p-3 text-white">
            <Play className="size-6 fill-current" />
          </div>
        </div>
      </div>
    </MessageMediaDialog>
  );
};
