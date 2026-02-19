'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobal } from '@/context/global-context-provider';
import { useSharedMediaTab } from '@/hooks/use-shared-media-tab';
import { getConversationSharedMediaService } from '@/lib/services';
import { getMessageBundleSummary } from '@/lib/message-media-bundle';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import type { MediaType, MessageType } from '@/types/global';
import { useParams } from 'next/navigation';
import { Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthenticatedMedia } from './authenticated-media';
import { MessageMediaDialog } from './message-media-dialog';
import { Button } from './ui/button';
import { ComponentLoader } from './ui/component-loader';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';

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
const SHARED_MEDIA_PAGE_LIMIT = 40;

type SharedMediaTile = {
  media: MediaType;
  messageId: string;
  createdAt: string;
  isLocked: boolean;
  isPurchased: boolean;
};

const getVideoTilePosterUrl = (rawUrl?: string) => {
  const normalizedUrl = (rawUrl ?? '').trim();
  if (!normalizedUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (
      !parsedUrl.hostname.includes('res.cloudinary.com') ||
      !parsedUrl.pathname.includes('/video/upload/')
    ) {
      return '';
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = pathSegments.findIndex((segment) => segment === 'upload');
    if (uploadIndex === -1) {
      return '';
    }

    const versionIndex = pathSegments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
    );
    const publicIdSegments =
      versionIndex >= 0
        ? pathSegments.slice(versionIndex + 1)
        : pathSegments.slice(uploadIndex + 1);

    if (publicIdSegments.length === 0) {
      return '';
    }

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(
      /\.[^/.]+$/,
      '',
    );

    const basePrefix = pathSegments.slice(0, uploadIndex + 1).join('/');
    const versionPath = versionIndex >= 0 ? `/${pathSegments[versionIndex]}` : '';

    parsedUrl.pathname = `/${basePrefix}/so_0,w_260,h_260,c_fill,f_jpg,q_auto${versionPath}/${publicIdSegments.join('/')}.jpg`;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

export const MessageSharedMediaContainer = ({ showTitle = true }) => {
  const [{ mediaTab: currentTab }, setCurrentTab] = useSharedMediaTab();

  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBackfillingHistory, setIsBackfillingHistory] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const sharedMediaRequestIdRef = useRef(0);
  const tileScrollRef = useRef<HTMLDivElement | null>(null);

  const appendUniqueMessages = useCallback(
    (currentMessages: MessageType[], incomingMessages: MessageType[]) => {
      if (incomingMessages.length === 0) {
        return currentMessages;
      }

      const seenMessageIds = new Set(
        currentMessages
          .map((message) => message?._id)
          .filter((messageId): messageId is string => Boolean(messageId)),
      );
      const mergedMessages = [...currentMessages];

      for (const incoming of incomingMessages) {
        if (!incoming?._id || seenMessageIds.has(incoming._id)) {
          continue;
        }
        seenMessageIds.add(incoming._id);
        mergedMessages.push(incoming);
      }

      return mergedMessages;
    },
    [],
  );

  const dedupeMessageBatch = useCallback((batch: MessageType[]) => {
    const uniqueMessages: MessageType[] = [];
    const seenMessageIds = new Set<string>();
    for (const message of batch) {
      if (!message?._id || seenMessageIds.has(message._id)) {
        continue;
      }
      seenMessageIds.add(message._id);
      uniqueMessages.push(message);
    }
    return uniqueMessages;
  }, []);

  const fetchConversationMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setNextCursor(null);
      setHasMoreHistory(false);
      setIsBackfillingHistory(false);
      return;
    }

    const requestId = sharedMediaRequestIdRef.current + 1;
    sharedMediaRequestIdRef.current = requestId;
    let hasRenderedMessages = false;

    try {
      setLoading(true);
      setIsBackfillingHistory(false);
      setNextCursor(null);
      setHasMoreHistory(false);

      const firstPage = await getConversationSharedMediaService(conversationId, {
        limit: SHARED_MEDIA_PAGE_LIMIT,
      });
      if (sharedMediaRequestIdRef.current !== requestId) {
        return;
      }

      const firstBatch = dedupeMessageBatch(firstPage?.messages ?? []);
      setMessages(firstBatch);
      hasRenderedMessages = firstBatch.length > 0;
      setNextCursor(firstPage?.nextCursor ?? null);
      setHasMoreHistory(Boolean(firstPage?.hasMore && firstPage?.nextCursor));
      setLoading(false);
    } catch (error: any) {
      if (!hasRenderedMessages) {
        setMessages([]);
        setNextCursor(null);
        setHasMoreHistory(false);
        toast.error('Error fetching shared media', {
          description: error?.message ?? 'Something went wrong.',
        });
      } else {
        toast.warning('Some older shared media could not be loaded');
      }
    } finally {
      if (sharedMediaRequestIdRef.current === requestId) {
        setLoading(false);
        setIsBackfillingHistory(false);
      }
    }
  }, [conversationId, dedupeMessageBatch]);

  const loadMoreConversationMessages = useCallback(async () => {
    if (
      !conversationId ||
      isBackfillingHistory ||
      !hasMoreHistory ||
      !nextCursor
    ) {
      return;
    }

    const requestId = sharedMediaRequestIdRef.current;

    try {
      setIsBackfillingHistory(true);
      const response = await getConversationSharedMediaService(conversationId, {
        limit: SHARED_MEDIA_PAGE_LIMIT,
        cursor: nextCursor,
      });

      if (sharedMediaRequestIdRef.current !== requestId) {
        return;
      }

      const batch = dedupeMessageBatch(response?.messages ?? []);
      if (batch.length > 0) {
        setMessages((currentMessages) =>
          appendUniqueMessages(currentMessages, batch),
        );
      }
      setNextCursor(response?.nextCursor ?? null);
      setHasMoreHistory(Boolean(response?.hasMore && response?.nextCursor));
    } catch {
      toast.warning('Some older shared media could not be loaded');
    } finally {
      if (sharedMediaRequestIdRef.current === requestId) {
        setIsBackfillingHistory(false);
      }
    }
  }, [
    appendUniqueMessages,
    conversationId,
    dedupeMessageBatch,
    hasMoreHistory,
    isBackfillingHistory,
    nextCursor,
  ]);

  useEffect(() => {
    void fetchConversationMessages();
  }, [fetchConversationMessages]);

  const { user } = useGlobal();
  const isBuyer = user?.role === 'buyer';

  const sharedTiles = useMemo<SharedMediaTile[]>(() => {
    return messages
      .flatMap((message) => {
        if (!mediaMessageTypes.has(message.type) || !Array.isArray(message.media)) {
          return [];
        }

        const summary = getMessageBundleSummary(message, user?.discordId);
        if (summary.totalCount === 0) {
          return [];
        }
        const purchasedByContext = Boolean(
          summary.isReceiver &&
            (summary.purchaseType === 'menu' || summary.purchaseType === 'media'),
        );

        const tiles: SharedMediaTile[] = [];
        for (const slot of summary.allSlots) {
          if (slot.media.type !== 'image' && slot.media.type !== 'video') {
            continue;
          }

          tiles.push({
            media: slot.media,
            messageId: message._id,
            createdAt:
              slot.media.createdAt || slot.media.uploadedAt || message.createdAt,
            isLocked: slot.isLocked,
            isPurchased:
              (summary.isPurchasedByReceiver || purchasedByContext) &&
              !slot.isLocked,
          });
        }
        return tiles;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [messages, user?.discordId]);

  const tilesByTab = useMemo(
    () => ({
      all: sharedTiles,
      purchased: sharedTiles.filter((tile) => tile.isPurchased),
      unlocked: sharedTiles.filter((tile) => !tile.isLocked),
      locked: sharedTiles.filter((tile) => tile.isLocked),
      images: sharedTiles.filter((tile) => tile.media.type === 'image'),
      videos: sharedTiles.filter((tile) => tile.media.type === 'video'),
    }),
    [sharedTiles],
  );

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
  const activeTiles = tilesByTab[activeTab];

  useEffect(() => {
    const scrollNode = tileScrollRef.current;
    if (!scrollNode) {
      return;
    }

    const handleScroll = () => {
      if (isBackfillingHistory || !hasMoreHistory) {
        return;
      }

      const thresholdPx = 120;
      const distanceToBottom =
        scrollNode.scrollHeight - (scrollNode.scrollTop + scrollNode.clientHeight);
      if (distanceToBottom <= thresholdPx) {
        void loadMoreConversationMessages();
      }
    };

    scrollNode.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollNode.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, hasMoreHistory, isBackfillingHistory, loadMoreConversationMessages]);

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
    <div className="min-h-0 px-1.5">
      {showTitle && <h3 className="py-0 text-sm font-medium">Shared Media</h3>}
      {isBackfillingHistory && (
        <p className="text-[11px] text-muted-foreground py-1">
          Loading older shared media...
        </p>
      )}

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
          className="min-h-0"
        >
          <TabsList className="grid w-full grid-cols-3 gap-1.5 bg-transparent p-0 h-auto">
            {tabConfig.map((item) => (
              <TabsTrigger
                key={item.tab}
                value={item.tab}
                className="min-w-0 text-[11px] text-[#D4D4D8] font-medium rounded-[8px] px-2 py-1.5 h-auto border border-transparent leading-tight text-center data-[state=active]:border-[#2D3342] data-[state=active]:bg-[#1D2230]"
              >
                {item.label} ({tilesByTab[item.tab].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {tabConfig.map(({ tab }) => (
            <TabsContent key={tab} value={tab} className="mt-3">
              {tilesByTab[tab].length > 0 ? (
                <div
                  ref={activeTab === tab ? tileScrollRef : undefined}
                  className="max-h-[62dvh] overflow-y-auto pr-1 hidden_scrollbar"
                >
                  {tab === 'locked' && (
                    <p className="mb-2 text-[11px] text-[#8A8C95]">
                      Locked tiles: tap one to jump to the message in chat.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {tilesByTab[tab].map((tile, index) => (
                      <SharedMediaTileCard
                        key={`${tile.messageId}-${tile.media._id || tile.media.url || index}`}
                        tile={tile}
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
              )}
            </TabsContent>
          ))}
        </Tabs>
        {hasMoreHistory && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBackfillingHistory}
              className="h-8 rounded-md px-3 text-xs"
              onClick={() => {
                void loadMoreConversationMessages();
              }}
            >
              {isBackfillingHistory
                ? 'Loading more...'
                : activeTiles.length > 0
                  ? 'Load more tiles'
                  : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SharedMediaTileCard = ({
  tile,
  onJumpToMessage,
}: {
  tile: SharedMediaTile;
  onJumpToMessage: (messageId: string) => void;
}) => {
  const mediaUrl = getProxiedMediaUrl(tile.media._id, tile.media.url);
  const posterUrl = tile.media.type === 'video' ? getVideoTilePosterUrl(mediaUrl) : '';

  const tileBody = (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-[14px] border',
        tile.isLocked
          ? 'border-[#2A2F3A] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#20242D_0%,#141821_100%)]'
          : 'border-[#232A37] bg-[#0F131C]',
      )}
      onContextMenu={(event) => event.preventDefault()}
    >
      {tile.isLocked ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-white/20 bg-black/45 p-2 text-white">
            <Icon.lock className="h-4 w-4" />
          </div>
        </div>
      ) : tile.media.type === 'image' ? (
        <AuthenticatedMedia
          type="image"
          src={mediaUrl}
          alt={tile.media.caption || 'Shared image'}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 33vw, 140px"
        />
      ) : posterUrl ? (
        <AuthenticatedMedia
          type="image"
          src={posterUrl}
          alt={tile.media.caption || 'Shared video preview'}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 33vw, 140px"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1B2233_0%,#0F1422_100%)]" />
      )}

      {tile.media.type === 'video' && !tile.isLocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-2 text-white">
            <Play className="size-4 fill-current" />
          </div>
        </div>
      )}

      {tile.media.type === 'video' && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
          <Icon.videoIcon className="h-2.5 w-2.5" />
          <span>Video</span>
        </div>
      )}
    </div>
  );

  if (tile.isLocked) {
    return (
      <button
        type="button"
        onClick={() => onJumpToMessage(tile.messageId)}
        className="text-left"
      >
        {tileBody}
      </button>
    );
  }

  return (
    <MessageMediaDialog media={[tile.media]} activeMediaIndex={0}>
      {tileBody}
    </MessageMediaDialog>
  );
};
