'use client';

import { useGlobal } from '@/context/global-context-provider';
import { getBuyerLibraryService } from '@/lib/services/buyer-library';
import { getMessageBundleSummary } from '@/lib/message-media-bundle';
import { cn, getProxiedMediaUrl } from '@/lib/utils';
import type { MediaType, MessageType } from '@/types/global';
import { Play, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthenticatedMedia } from './authenticated-media';
import { MessageMediaDialog } from './message-media-dialog';
import { Button } from './ui/button';
import { ComponentLoader } from './ui/component-loader';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';
import { Input } from './ui/input';

const LIBRARY_PAGE_LIMIT = 24;
const mediaMessageTypes = new Set(['media', 'menu', 'in_message_media']);

type LibraryTile = {
  media: MediaType;
  messageId: string;
  createdAt: string;
  sellerUsername: string;
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

    parsedUrl.pathname = `/${basePrefix}/so_0,w_300,h_300,c_fill,f_jpg,q_auto${versionPath}/${publicIdSegments.join('/')}.jpg`;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

export const BuyerLibraryContent = () => {
  const { user } = useGlobal();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBackfillingHistory, setIsBackfillingHistory] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<'all' | string>('all');
  const requestIdRef = useRef(0);
  const normalizedSearch = searchInput.trim().toLowerCase();

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

  const fetchPurchasedLibrary = useCallback(async () => {
    if (user?.role !== 'buyer') {
      setMessages([]);
      setNextCursor(null);
      setHasMoreHistory(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setIsBackfillingHistory(false);
      setNextCursor(null);
      setHasMoreHistory(false);
      const firstPage = await getBuyerLibraryService({
        limit: LIBRARY_PAGE_LIMIT,
      });
      if (requestIdRef.current !== requestId) {
        return;
      }

      const firstBatch = dedupeMessageBatch(firstPage?.messages ?? []);
      setMessages(firstBatch);
      setNextCursor(firstPage?.nextCursor ?? null);
      setHasMoreHistory(Boolean(firstPage?.hasMore && firstPage?.nextCursor));
    } catch (error: any) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setMessages([]);
      setNextCursor(null);
      setHasMoreHistory(false);
      toast.error('Error fetching purchased library', {
        description: error?.message ?? 'Something went wrong.',
      });
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setIsBackfillingHistory(false);
      }
    }
  }, [dedupeMessageBatch, user?.role]);

  const loadMorePurchasedLibrary = useCallback(async () => {
    if (
      user?.role !== 'buyer' ||
      isBackfillingHistory ||
      !hasMoreHistory ||
      !nextCursor
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    try {
      setIsBackfillingHistory(true);
      const response = await getBuyerLibraryService({
        limit: LIBRARY_PAGE_LIMIT,
        cursor: nextCursor,
      });
      if (requestIdRef.current !== requestId) {
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
      toast.warning('Some older purchases could not be loaded');
    } finally {
      if (requestIdRef.current === requestId) {
        setIsBackfillingHistory(false);
      }
    }
  }, [
    appendUniqueMessages,
    dedupeMessageBatch,
    hasMoreHistory,
    isBackfillingHistory,
    nextCursor,
    user?.role,
  ]);

  useEffect(() => {
    void fetchPurchasedLibrary();
  }, [fetchPurchasedLibrary]);

  const tiles = useMemo<LibraryTile[]>(() => {
    return messages
      .flatMap((message) => {
        if (!mediaMessageTypes.has(message.type) || !Array.isArray(message.media)) {
          return [];
        }
        const summary = getMessageBundleSummary(message, user?.discordId);
        if (!summary.isPurchasedByReceiver || summary.totalCount === 0) {
          return [];
        }

        const username = message.sender?.username ?? '';
        const sellerUsername = username.startsWith('@') ? username : `@${username}`;
        return summary.allSlots
          .filter(
            (slot) =>
              (slot.media.type === 'image' || slot.media.type === 'video') &&
              !slot.isLocked,
          )
          .map((slot) => ({
            media: slot.media,
            messageId: message._id,
            createdAt:
              slot.media.createdAt || slot.media.uploadedAt || message.createdAt,
            sellerUsername,
          }));
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [messages, user?.discordId]);

  const sellers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tile of tiles) {
      counts.set(tile.sellerUsername, (counts.get(tile.sellerUsername) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([seller, count]) => ({ seller, count }))
      .sort((a, b) => b.count - a.count || a.seller.localeCompare(b.seller));
  }, [tiles]);

  useEffect(() => {
    if (selectedSeller === 'all') {
      return;
    }
    const stillExists = sellers.some((seller) => seller.seller === selectedSeller);
    if (!stillExists) {
      setSelectedSeller('all');
    }
  }, [selectedSeller, sellers]);

  const visibleTiles = useMemo(() => {
    return tiles.filter((tile) => {
      const matchesSeller =
        selectedSeller === 'all' || tile.sellerUsername === selectedSeller;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        tile.sellerUsername.toLowerCase().includes(normalizedSearch);
      return matchesSeller && matchesSearch;
    });
  }, [normalizedSearch, selectedSeller, tiles]);

  const visibleImageTiles = useMemo(
    () => visibleTiles.filter((tile) => tile.media.type === 'image'),
    [visibleTiles],
  );
  const visibleVideoTiles = useMemo(
    () => visibleTiles.filter((tile) => tile.media.type === 'video'),
    [visibleTiles],
  );

  if (user?.role !== 'buyer') {
    return (
      <div className="pt-5 md:pt-[88px] px-4">
        <EmptyStates className="mt-8">
          <EmptyStates.Icon icon={Icon.lock}>Buyer library is buyer-only</EmptyStates.Icon>
        </EmptyStates>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-5 md:pt-[88px] px-4">
        <ComponentLoader className="flex items-center justify-center w-full mt-16" />
      </div>
    );
  }

  return (
    <div className="pt-5 md:pt-[88px] px-4 pb-8 space-y-4">
      <div className="space-y-1">
        <h1 className="md:text-[32px] text-[18px] font-semibold text-[#F8F8F8]">
          My Library
        </h1>
        <p className="text-[#8A8C95] text-sm">
          Purchased singles and bundles, including previews.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8C95]" />
        <Input
          id="library-seller-filter"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search seller username"
          className="h-11 rounded-2xl border-[#1E2430] bg-[#0D1119]/80 pl-9 pr-10"
        />
        {searchInput.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8C95] hover:text-white transition-colors"
            onClick={() => setSearchInput('')}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isBackfillingHistory && (
        <p className="text-[11px] text-muted-foreground">Loading older purchases...</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span className="font-medium text-white">All {visibleTiles.length}</span>
          <span>•</span>
          <span>Images {visibleImageTiles.length}</span>
          <span>•</span>
          <span>Videos {visibleVideoTiles.length}</span>
        </div>

        {sellers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hidden_scrollbar">
            <button
              type="button"
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-xs transition-colors',
                selectedSeller === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#151B27] text-[#A1A1AA] hover:text-white',
              )}
              onClick={() => setSelectedSeller('all')}
            >
              All sellers
            </button>
            {sellers.map((seller) => (
              <button
                key={seller.seller}
                type="button"
                className={cn(
                  'h-8 shrink-0 rounded-full px-3 text-xs transition-colors',
                  selectedSeller === seller.seller
                    ? 'bg-white text-black'
                    : 'bg-[#151B27] text-[#A1A1AA] hover:text-white',
                )}
                onClick={() => setSelectedSeller(seller.seller)}
              >
                {seller.seller} {seller.count}
              </button>
            ))}
          </div>
        )}

        {visibleTiles.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleTiles.map((tile, index) => (
              <LibraryTileCard
                key={`${tile.messageId}-${tile.media._id || tile.media.url || index}`}
                tile={tile}
              />
            ))}
          </div>
        ) : (
          <EmptyStates className="mt-10">
            <EmptyStates.Icon icon={Icon.gallery}>
              {searchInput || selectedSeller !== 'all'
                ? 'No matches for this filter'
                : 'No purchased media yet'}
            </EmptyStates.Icon>
          </EmptyStates>
        )}

        {hasMoreHistory && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBackfillingHistory}
              className="h-8 rounded-md px-3 text-xs"
              onClick={() => {
                void loadMorePurchasedLibrary();
              }}
            >
              {isBackfillingHistory ? 'Loading more...' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const LibraryTileCard = ({ tile }: { tile: LibraryTile }) => {
  const mediaUrl = getProxiedMediaUrl(tile.media._id, tile.media.url);
  const posterUrl = tile.media.type === 'video' ? getVideoTilePosterUrl(mediaUrl) : '';

  return (
    <MessageMediaDialog media={[tile.media]} activeMediaIndex={0}>
      <div
        className={cn('group relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#10141D] shadow-[0_10px_30px_rgba(0,0,0,0.28)]')}
        onContextMenu={(event) => event.preventDefault()}
      >
        {tile.media.type === 'image' ? (
          <AuthenticatedMedia
            type="image"
            src={mediaUrl}
            alt={tile.media.caption || 'Purchased image'}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 50vw, 180px"
          />
        ) : posterUrl ? (
          <AuthenticatedMedia
            type="image"
            src={posterUrl}
            alt={tile.media.caption || 'Purchased video preview'}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 50vw, 180px"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#1B2233_0%,#0F1422_100%)]" />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {tile.media.type === 'video' && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 p-2 text-white">
                <Play className="size-4 fill-current" />
              </div>
            </div>
            <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
              <Icon.videoIcon className="h-2.5 w-2.5" />
              <span>Video</span>
            </div>
          </>
        )}

        <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] text-white max-w-[90%] truncate">
          {tile.sellerUsername}
        </div>
      </div>
    </MessageMediaDialog>
  );
};
