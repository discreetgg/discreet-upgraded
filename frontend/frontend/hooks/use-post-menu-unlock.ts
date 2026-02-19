import {
  buyMenuItem,
  getPurchasedMenuEntitlements,
} from '@/actions/menu-item';
import { useAuth } from '@/context/auth-context-provider';
import { useGlobal } from '@/context/global-context-provider';
import { getMenuMediaSummary } from '@/lib/menu-media-summary';
import { resolveMenuPrice } from '@/lib/menu-pricing';
import {
  clearConversationRequestCaches,
  getConversationBetweenUsersService,
} from '@/lib/services';
import type { PostType } from '@/types/global';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@bprogress/next/app';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const toCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

type UnlockDialogState = 'confirm' | 'processing' | 'success';
type UnlockOriginSurface = 'feed' | 'profile' | 'menu' | 'dm' | 'unknown';

const resolveConversationId = (payload: unknown): string | undefined => {
  const readId = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const objectValue = value as Record<string, unknown>;
    return (
      readId(objectValue.conversationId) ??
      readId(objectValue.conversation) ??
      readId(objectValue._id) ??
      readId(objectValue.id)
    );
  };

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const value = payload as Record<string, unknown>;
  return (
    readId(value.delivery) ??
    readId(value.conversation) ??
    readId(value.message) ??
    readId(value.meta)
  );
};

const resolveConversationLookupId = (payload: unknown): string | undefined => {
  const readId = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const objectValue = value as Record<string, unknown>;
    return (
      readId(objectValue._id) ??
      readId(objectValue.id) ??
      readId(objectValue.conversationId) ??
      readId(objectValue.conversation)
    );
  };

  return readId(payload);
};

export const usePostMenuUnlock = (
  post: PostType,
  options?: { originSurface?: UnlockOriginSurface },
) => {
  const { user: currentUser } = useGlobal();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLocallyUnlocked, setIsLocallyUnlocked] = useState(false);
  const [dialogState, setDialogState] = useState<UnlockDialogState>('confirm');
  const [resolvedConversationId, setResolvedConversationId] = useState<
    string | null
  >(null);
  const [isResolvingConversation, setIsResolvingConversation] = useState(false);
  const originSurface = options?.originSurface ?? 'unknown';

  const linkedMenu = post?.linkedMenu ?? null;
  const menuSummary = useMemo(
    () =>
      getMenuMediaSummary({
        itemCount: linkedMenu?.itemCount,
        imageCount: linkedMenu?.imageCount,
        videoCount: linkedMenu?.videoCount,
        collectionType: linkedMenu?.collectionType,
      }),
    [linkedMenu],
  );
  const menuPricing = useMemo(
    () =>
      linkedMenu
        ? resolveMenuPrice(linkedMenu.priceToView, linkedMenu.promo)
        : null,
    [linkedMenu],
  );
  const purchasedMenusQueryKey = [
    'menu_purchased_ids',
    currentUser?.discordId,
    post?.author?.discordId,
  ];
  const { data: purchasedMenuIds = [] } = useQuery({
    queryKey: purchasedMenusQueryKey,
    queryFn: async () => {
      if (!currentUser?.discordId || !post?.author?.discordId) {
        return [];
      }
      const entitlement = await getPurchasedMenuEntitlements({
        buyerId: currentUser.discordId,
        sellerId: post.author.discordId,
      });
      return entitlement.menuIds || [];
    },
    enabled:
      isAuthenticated &&
      Boolean(currentUser?.discordId) &&
      Boolean(post?.author?.discordId) &&
      Boolean(linkedMenu?._id) &&
      currentUser?.discordId !== post?.author?.discordId,
    staleTime: 2 * 60 * 1000,
  });

  const isAlreadyPurchased =
    isLocallyUnlocked ||
    (linkedMenu?._id ? purchasedMenuIds.includes(linkedMenu._id) : false);

  const openUnlockedConversation = useCallback(
    async (preferredConversationId?: string) => {
      if (
        !currentUser?.discordId ||
        !post?.author?.discordId ||
        isResolvingConversation
      ) {
        return;
      }

      setIsResolvingConversation(true);
      try {
        let conversationId = preferredConversationId ?? resolvedConversationId;

        if (!conversationId) {
          const conversation = await getConversationBetweenUsersService([
            post.author.discordId,
            currentUser.discordId,
          ]);
          conversationId = resolveConversationLookupId(conversation) ?? null;
        }

        if (!conversationId) {
          toast.info('Unlock complete. Open Messages to view your purchase.');
          return;
        }

        setResolvedConversationId(conversationId);
        clearConversationRequestCaches();
        setIsConfirmOpen(false);
        router.push(`/messages/${conversationId}`);
      } catch {
        toast.info('Unlock complete. Open Messages to view your purchase.');
      } finally {
        setIsResolvingConversation(false);
      }
    },
    [
      currentUser?.discordId,
      isResolvingConversation,
      post?.author?.discordId,
      resolvedConversationId,
      router,
    ],
  );

  const purchaseMutation = useMutation({
    mutationKey: ['post_unlock_menu', linkedMenu?._id, currentUser?.discordId],
    mutationFn: async () => {
      if (!linkedMenu?._id || !currentUser?.discordId) {
        throw new Error('Missing menu or buyer information');
      }

      return buyMenuItem({
        menuId: linkedMenu._id,
        sellerId: post.author.discordId,
        buyerId: currentUser.discordId,
        itemCount: menuSummary.totalCount,
        originSurface,
      });
    },
    onMutate: () => {
      setDialogState('processing');
      setResolvedConversationId(null);
    },
    onSuccess: (response) => {
      if (linkedMenu?._id) {
        queryClient.setQueryData<string[] | undefined>(
          purchasedMenusQueryKey,
          (old) => {
            const existing = Array.isArray(old) ? old : [];
            if (existing.includes(linkedMenu._id)) return existing;
            return [...existing, linkedMenu._id];
          },
        );
      }
      setIsLocallyUnlocked(true);
      setDialogState('success');

      const conversationId = resolveConversationId(response);
      if (conversationId) {
        setResolvedConversationId(conversationId);
      }

      if (response?.alreadyUnlocked) {
        toast.info('This unlock is already available in your DMs.');
      } else {
        const paidTotal = Number(
          response?.purchaseSummary?.totalPrice ??
            menuPricing?.effectiveUnitPrice,
        );
        toast.success(
          `Unlocked ${menuSummary.compositionLabel} for ${toCurrency(
            paidTotal,
          )}.`,
        );
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Unlock failed';

      if (errorMessage === 'Menu already unlocked') {
        if (linkedMenu?._id) {
          queryClient.setQueryData<string[] | undefined>(
            purchasedMenusQueryKey,
            (old) => {
              const existing = Array.isArray(old) ? old : [];
              if (existing.includes(linkedMenu._id)) return existing;
              return [...existing, linkedMenu._id];
            },
          );
        }
        setIsLocallyUnlocked(true);
        setDialogState('success');
        toast.info('This unlock is already available in your DMs.');
        return;
      }

      setDialogState('confirm');
      toast.error(errorMessage);
    },
  });

  const requestUnlock = () => {
    if (!linkedMenu || !menuPricing) {
      return;
    }
    if (!isAuthenticated || !currentUser?.discordId) {
      toast.error('Sign in to unlock this content.');
      return;
    }
    if (currentUser.discordId === post.author.discordId) {
      toast.info('You already own this listing.');
      return;
    }
    if (isAlreadyPurchased) {
      // Purchased media is delivered in DMs; never dead-end on "Unlocked".
      void openUnlockedConversation();
      return;
    }

    setDialogState('confirm');
    setResolvedConversationId(null);
    setIsConfirmOpen(true);
  };

  const unlockOverlay =
    linkedMenu && menuPricing
      ? {
          priceLabel: toCurrency(menuPricing.effectiveUnitPrice),
          lockedCount: menuSummary.totalCount,
          compositionLabel: menuSummary.compositionLabel,
          isUnlocked: isAlreadyPurchased,
          // Single action entrypoint: unlock when locked, open DM thread when unlocked.
          onUnlock: () => {
            if (isAlreadyPurchased) {
              void openUnlockedConversation();
              return;
            }
            requestUnlock();
          },
        }
      : undefined;

  return {
    unlockOverlay,
    linkedMenu,
    menuPricing,
    menuSummary,
    isAlreadyPurchased,
    isConfirmOpen,
    setIsConfirmOpen,
    dialogState,
    isResolvingConversation,
    openUnlockedConversation,
    confirmUnlock: () => purchaseMutation.mutate(),
    isUnlocking: purchaseMutation.isPending,
  };
};
