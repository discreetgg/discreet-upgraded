import { Button } from "../ui/button";
import { AddMenuItem } from "../add-menu-item";
import { UserType } from "@/types/global";
import { ImageWithFallback } from "../miscellaneous/image-with-fallback";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buyMenuItem,
  deleteMenuItem,
  getPurchasedMenuEntitlements,
} from "@/actions/menu-item";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context-provider";
import {
  SubscribeDialog,
  SubscribeDialogClose,
  SubscribeDialogContent,
  SubscribeDialogDescription,
  SubscribeDialogTitle,
} from "@/components/ui/subscribe-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DeleteMenuItemDialog } from "../delete-menu-item-dialog";
import { useRouter } from "@bprogress/next/app";
import { getConversationBetweenUsersService } from "@/lib/services";
import { useMessage } from "@/context/message-context";
import { useWallet } from "@/context/wallet-context-provider";
import { isAxiosError } from "axios";
import { resolveMenuPrice } from "@/lib/menu-pricing";
import { MenuPromoDialog } from "@/components/menu-promo-dialog";
import { MenuCardPricingMeta } from "@/components/menu-card-pricing-meta";
import { getMenuMediaSummary } from "@/lib/menu-media-summary";
import { MenuDetailsDialog } from "@/components/menu-details-dialog";

type NormalizedMenuPreviewMedia = {
  _id: string;
  url: string;
  type: "image" | "video";
};

const isVideoMediaUrl = (url: string) => {
  const lower = (url || "").toLowerCase();
  return (
    lower.includes("/video/upload/") ||
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".webm") ||
    lower.includes(".m4v")
  );
};

const normalizeMenuPreviewMedia = (
  entries:
    | Array<{
        _id?: string;
        url?: string;
        type?: string;
        media?: { _id?: string; url?: string; type?: string };
      }>
    | undefined,
): NormalizedMenuPreviewMedia[] => {
  return (Array.isArray(entries) ? entries : [])
    .map((entry: any) => {
      const source = entry?.url ? entry : entry?.media;
      if (!source?.url) return null;
      const url = String(source.url);
      const type = source.type === "video" || isVideoMediaUrl(url)
        ? "video"
        : "image";
      return {
        _id: String(source._id || entry?._id || url),
        url,
        type,
      } satisfies NormalizedMenuPreviewMedia;
    })
    .filter((entry): entry is NormalizedMenuPreviewMedia => Boolean(entry));
};

export default function ProfileSideAdCard({
  description,
  title,
  collectionType,
  coverImage,
  sourcePost,
  itemCount,
  media,
  priceToView,
  defaultValues,
  currentUser,
  author,
  _id,
}: MenuItemType & { defaultValues: MenuItemType; currentUser: UserType }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { setIsFundWalletDialogOpen } = useWallet();

  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [confirmPurchase, setConfirmPurchase] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const isCurrentUser = currentUser.discordId === author.discordId;
  const isSingle = collectionType === "single";
  const isOptimistic = _id.startsWith("temp_");
  const highQualityCoverImage = useMemo(
    () => getHighestQualityImageUrl(coverImage?.url || ""),
    [coverImage?.url],
  );
  const mediaSummary = useMemo(
    () =>
      getMenuMediaSummary({
        itemCount: itemCount || media.length,
        imageCount: media.filter((entry) => entry.type === "image").length,
        videoCount: media.filter((entry) => entry.type === "video").length,
        collectionType,
      }),
    [collectionType, itemCount, media],
  );
  const normalizedPreviewMedia = useMemo(
    () => {
      const previewList = normalizeMenuPreviewMedia(
        defaultValues.previewMedia as any,
      );
      if (previewList.length > 0) {
        return previewList;
      }
      if (!highQualityCoverImage) {
        return [];
      }
      return [
        {
          _id: "cover-preview",
          url: highQualityCoverImage,
          type: isVideoMediaUrl(highQualityCoverImage) ? "video" : "image",
        } satisfies NormalizedMenuPreviewMedia,
      ];
    },
    [defaultValues.previewMedia, highQualityCoverImage],
  );
  const activePreview = normalizedPreviewMedia[previewIndex] ?? null;
  const canCyclePreview = normalizedPreviewMedia.length > 1;

  useEffect(() => {
    setPreviewIndex((current) => {
      if (normalizedPreviewMedia.length === 0) return 0;
      return Math.min(current, normalizedPreviewMedia.length - 1);
    });
  }, [normalizedPreviewMedia.length]);
  const purchaseQuantity = mediaSummary.isBundle ? mediaSummary.totalCount : 1;
  const pricing = useMemo(
    () => resolveMenuPrice(priceToView, defaultValues?.promo),
    [defaultValues?.promo, priceToView],
  );
  const purchaseTotal = pricing.effectiveUnitPrice;
  const purchasedMenusQueryKey = [
    "menu_purchased_ids",
    currentUser.discordId,
    author.discordId,
  ];

  const { data: purchasedMenuIds = [] } = useQuery({
    queryKey: purchasedMenusQueryKey,
    queryFn: async () => {
      const entitlement = await getPurchasedMenuEntitlements({
        buyerId: currentUser.discordId,
        sellerId: author.discordId,
      });
      return entitlement.menuIds || [];
    },
    enabled:
      isAuthenticated && !isCurrentUser && Boolean(currentUser?.discordId),
    staleTime: 2 * 60 * 1000,
  });

  const isAlreadyPurchased = purchasedMenuIds.includes(_id);

  const { mutateAsync: buyItem, isPending } = useMutation({
    mutationKey: ["buy_menu_item", currentUser.discordId],
    mutationFn: async (payload: BuyMenuItemPayload) => {
      return await buyMenuItem(payload);
    },
    onSuccess: (response: any, variables) => {
      const summary = response?.purchaseSummary;
      const purchasedCount = Number(
        summary?.quantity ?? variables.itemCount ?? 1,
      );
      const totalPaid = Number(
        summary?.totalPrice ??
          pricing.effectiveUnitPrice,
      );
      if (response?.alreadyUnlocked) {
        toast.info("This item is already unlocked for you.");
      } else {
        toast.success(
          `Unlocked ${purchasedCount} item${
            purchasedCount > 1 ? "s" : ""
          } for ${formatPurchaseAmount(totalPaid)}.`,
        );
      }
      queryClient.setQueryData<string[] | undefined>(
        purchasedMenusQueryKey,
        (old) => {
          const existing = Array.isArray(old) ? old : [];
          if (existing.includes(_id)) return existing;
          return [...existing, _id];
        },
      );
      setOpenSuccessModal(true);
    },
    onError: (error) => {
      console.error("Error buying menu item:", error);
      if (
        isAxiosError(error) &&
        error.response?.data?.message === "Menu already unlocked"
      ) {
        queryClient.setQueryData<string[] | undefined>(
          purchasedMenusQueryKey,
          (old) => {
            const existing = Array.isArray(old) ? old : [];
            if (existing.includes(_id)) return existing;
            return [...existing, _id];
          },
        );
        toast.info("This item is already unlocked for you.");
        setOpenSuccessModal(true);
        return;
      }
      toast.error("Failed to buy menu item. Please try again.");
      if (
        isAxiosError(error) &&
        error.response?.data?.message === "Insufficient funds"
      ) {
        toast.error("Not enough balance");
        setIsFundWalletDialogOpen(true);
      }
    },
  });
  const { mutateAsync: deleteMenuMutation, isPending: isDeleting } =
    useMutation({
      mutationKey: ["delete_menu_item", currentUser.discordId],
      mutationFn: async () => {
        await deleteMenuItem(_id);
      },
      onMutate: async () => {
        await queryClient.cancelQueries({
          queryKey: ["menu_item", author.discordId],
        });

        const previous = queryClient.getQueryData<MenuItemType[] | undefined>([
          "menu_item",
          author.discordId,
        ]);

        if (Array.isArray(previous)) {
          queryClient.setQueryData(
            ["menu_item", author.discordId],
            previous.filter((item) => item._id !== _id),
          );
        }
        setDeleteMenu(false);

        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            ["menu_item", author.discordId],
            context.previous,
          );
        }
        console.error("Error deleting menu item:", error);
        toast.error("Failed to delete menu item. Please try again.");
      },

      onSettled: () => {
        setDeleteMenu(false);
      },
    });

  const handleBuyItem = () => {
    setConfirmPurchase(false);

    if (isAlreadyPurchased) {
      setOpenSuccessModal(true);
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please log in to purchase item.");
      return;
    }
    buyItem({
      itemCount: purchaseQuantity,
      menuId: _id,
      sellerId: author.discordId,
      buyerId: currentUser.discordId,
    });
  };

  const { data: conversationBetweenUsers, isFetching: isFetchingConversation } =
    useQuery({
      queryKey: [
        "conversation-between-users",
        author.discordId,
        currentUser.discordId,
      ],
      queryFn: () =>
        getConversationBetweenUsersService([
          author.discordId,
          currentUser.discordId,
        ]),
      enabled:
        openSuccessModal &&
        Boolean(author?.discordId) &&
        Boolean(currentUser?.discordId),
      staleTime: 1000 * 60,
    });

  const conversationId = useMemo(() => {
    if (!conversationBetweenUsers) return undefined;

    const candidate =
      (conversationBetweenUsers as { conversationId?: string })
        .conversationId ??
      (
        conversationBetweenUsers as {
          conversation?: { id?: string; _id?: string };
        }
      ).conversation?.id ??
      (
        conversationBetweenUsers as {
          conversation?: { id?: string; _id?: string };
        }
      ).conversation?._id ??
      (conversationBetweenUsers as { _id?: string })._id ??
      (conversationBetweenUsers as { id?: string }).id;

    return typeof candidate === "string" && candidate.length > 0
      ? candidate
      : undefined;
  }, [conversationBetweenUsers]);
  const normalizedDescription = description?.trim() || "No description provided.";
  const canOpenSourcePost = Boolean(sourcePost);
  const openSourcePost = () => {
    if (!sourcePost) return;
    router.push(`/feed/${sourcePost}`);
  };

  return (
    <>
      <DeleteMenuItemDialog
        isOpen={deleteMenu}
        onOpenChange={setDeleteMenu}
        onConfirm={async () => await deleteMenuMutation()}
      />
      <ConfirmPurchaseDialog
        isOpen={confirmPurchase}
        onOpenChange={setConfirmPurchase}
        onConfirm={handleBuyItem}
        menuTitle={title}
        mode={isSingle ? "single" : "bundle"}
        quantity={purchaseQuantity}
        unitPrice={pricing.effectiveUnitPrice}
        totalPrice={purchaseTotal}
        mediaComposition={mediaSummary.compositionLabel}
      />
      <SuccessMenuDialog
        open={openSuccessModal}
        setOpen={setOpenSuccessModal}
        title={title}
        coverImage={highQualityCoverImage}
        discordId={author.discordId}
        receiver={author}
        conversationId={conversationId}
        isLoadingConversation={isFetchingConversation}
      />
      <MenuDetailsDialog
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        title={title}
        description={normalizedDescription}
        media={normalizedPreviewMedia}
        coverImage={highQualityCoverImage}
        sourcePostId={sourcePost}
        onOpenSourcePost={openSourcePost}
        mediaComposition={mediaSummary.compositionLabel}
        totalPriceLabel={formatPurchaseAmount(purchaseTotal)}
      />
      <div
        data-delete={isDeleting}
        className="w-full max-w-[370px] isolate sm:max-w-[405px] data-[delete=true]:blur-[2px] data-[delete=true]:opacity-50 border border-accent-gray/30 rounded-xl p-3 border-r-4 border-b-4 hover:border-b-[6px] hover:border-r-[6px] transition-all duration-150 relative space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-inter font-semibold break-words">{title}</p>
          <span className="shrink-0 rounded-md bg-[#111822] px-2 py-1 text-[10px] text-[#D1DAE9]">
            {mediaSummary.typeBadge}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[10px] border border-[#1D2230] bg-black">
          {activePreview ? (
            activePreview.type === "video" ? (
              <video
                src={activePreview.url}
                className="w-full max-h-[360px] object-contain bg-black"
                controls
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <ImageWithFallback
                src={getHighestQualityImageUrl(activePreview.url)}
                alt={title}
                width={1200}
                height={1600}
                quality={100}
                unoptimized
                className="w-full max-h-[360px] object-contain bg-black"
                containerClassName="w-full max-h-[360px] bg-black"
                priority
              />
            )
          ) : isVideoMediaUrl(highQualityCoverImage) ? (
            <video
              src={highQualityCoverImage}
              className="w-full max-h-[360px] object-contain bg-black"
              controls
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <ImageWithFallback
              src={highQualityCoverImage}
              alt={title}
              width={1200}
              height={1600}
              quality={100}
              unoptimized
              className="w-full max-h-[360px] object-contain bg-black"
              containerClassName="w-full max-h-[360px] bg-black"
              priority
            />
          )}

          <div className="absolute right-2 top-2 z-20 rounded bg-black/60 px-2 py-1 text-[10px] font-medium text-[#E7EAF1]">
            {mediaSummary.compositionLabel}
          </div>

          {canCyclePreview && (
            <div className="absolute right-2 bottom-2 z-20 flex items-center gap-1 rounded-md border border-[#2A3140] bg-[#0B111C]/85 p-1">
              <Button
                type="button"
                onClick={() =>
                  setPreviewIndex((previous) =>
                    previous === 0
                      ? normalizedPreviewMedia.length - 1
                      : previous - 1,
                  )
                }
                className="h-6 w-6 p-0 text-[#D5DBE7] hover:bg-[#182235]"
                size="ghost"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-[#D5DBE7] min-w-[38px] text-center">
                {previewIndex + 1}/{normalizedPreviewMedia.length}
              </span>
              <Button
                type="button"
                onClick={() =>
                  setPreviewIndex((previous) =>
                    previous + 1 >= normalizedPreviewMedia.length
                      ? 0
                      : previous + 1,
                  )
                }
                className="h-6 w-6 p-0 text-[#D5DBE7] hover:bg-[#182235]"
                size="ghost"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-accent-text/90 leading-5 max-h-[96px] overflow-hidden break-words">
          {normalizedDescription}
        </p>

        <MenuCardPricingMeta
          priceToView={priceToView}
          promo={defaultValues?.promo}
          mediaCount={mediaSummary.totalCount}
          imageCount={mediaSummary.imageCount}
          videoCount={mediaSummary.videoCount}
        />

        <div className="flex flex-wrap items-center gap-2">
          {canOpenSourcePost ? (
            <Button
              onClick={openSourcePost}
              className="px-3 w-fit text-xs py-1.5 rounded-2xl border border-[#FF007F]/40 bg-[#FF007F]/10 text-[#FF4DA6]"
              size={"ghost"}
            >
              Open full post
            </Button>
          ) : (
            <Button
              onClick={() => setOpenDetailsModal(true)}
              className="px-3 w-fit text-xs py-1.5 rounded-2xl border border-[#3A3F4A] bg-[#12151D] text-[#D4D4D8]"
              size={"ghost"}
            >
              Preview details
            </Button>
          )}

          {isCurrentUser ? (
            <>
              <AddMenuItem defaultValues={defaultValues} isUpdating>
                <Button
                  disabled={isDeleting || isOptimistic}
                  className="px-4 w-fit text-xs py-1.5 rounded-2xl border-none text-white bg-accent-gray"
                  size={"ghost"}
                >
                  {isOptimistic ? <span>Uploading</span> : <span>Update</span>}
                </Button>
              </AddMenuItem>
              <MenuPromoDialog
                menuId={_id}
                ownerDiscordId={author.discordId}
                basePrice={pricing.baseUnitPrice}
                defaultPromo={defaultValues.promo}
              >
                <Button
                  disabled={isDeleting || isOptimistic}
                  className="px-4 w-fit text-xs py-1.5 rounded-2xl text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/40"
                  size={"ghost"}
                >
                  Promo
                </Button>
              </MenuPromoDialog>
              <Button
                disabled={isDeleting || isOptimistic}
                onClick={() => setDeleteMenu(true)}
                className="px-4 w-fit text-xs py-1.5 rounded-2xl text-red-400 bg-red-600/10 border border-red-700"
                size={"ghost"}
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              disabled={isPending || isAlreadyPurchased}
              onClick={() => setConfirmPurchase(true)}
              className="px-4 md:px-8 w-fit text-xs py-2 rounded-md border-none text-primary bg-off-white relative disabled:opacity-70"
              variant={"ghost"}
              size={"ghost"}
            >
              <span
                data-hidden={isPending}
                className="block payment_loader absolute  w-full data-[hidden=false]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=true]:opacity-100"
              />
              <span
                data-hidden={isPending || isAlreadyPurchased}
                className="data-[hidden=true]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=false]:opacity-100"
              >
                Buy now
              </span>
              {isAlreadyPurchased && (
                <span className="text-[#0A0A0A] font-medium">Unlocked</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

interface ConfirmPurchaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  menuTitle: string;
  mode: "single" | "bundle";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mediaComposition: string;
}

function ConfirmPurchaseDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  menuTitle,
  mode,
  quantity,
  unitPrice,
  totalPrice,
  mediaComposition,
}: ConfirmPurchaseDialogProps) {
  const modeLabel =
    mode === "bundle" ? "Bundle purchase" : "Single-item purchase";
  const quantityLabel = `${quantity} item${quantity > 1 ? "s" : ""}`;
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-r from-primary/80 to-rose-900/10 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
          <AlertDialogDescription>
            Review this charge before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-[#D4D4D8]">
          <p className="font-medium text-[#F8F8F8]">{menuTitle}</p>
          <p className="mt-2">{modeLabel}</p>
          <p>Contents: {mediaComposition}</p>
          <p>Quantity: {quantityLabel}</p>
          <p>Unit price: {formatPurchaseAmount(unitPrice)}</p>
          <p className="mt-1 font-semibold text-white">
            Total charge: {formatPurchaseAmount(totalPrice)}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  coverImage: string;
  discordId: string;
  conversationId?: string;
  isLoadingConversation?: boolean;
  receiver: AuthorType | UserType | null;
}

const getHighestQualityImageUrl = (url: string) => {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/");
    const uploadIndex = pathSegments.findIndex(
      (segment) => segment === "upload",
    );

    if (uploadIndex === -1) {
      return url;
    }

    const versionIndex = pathSegments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
    );

    // Already original or unsupported pattern.
    if (versionIndex <= uploadIndex + 1) {
      return url;
    }

    const cleanedPathSegments = [
      ...pathSegments.slice(0, uploadIndex + 1),
      ...pathSegments.slice(versionIndex),
    ];

    parsedUrl.pathname = cleanedPathSegments.join("/");
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const SuccessMenuDialog = ({
  open,
  setOpen,
  title,
  coverImage,
  discordId,
  conversationId,
  isLoadingConversation = false,
  receiver,
}: Props) => {
  const router = useRouter();
  const { setReceiver } = useMessage();

  const handleCheckItOut = () => {
    if (isLoadingConversation && !conversationId) {
      return;
    }
    setReceiver(receiver);
    setOpen(false);
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    } else {
      router.push("/messages?chat=new");
      toast.success(`Opening new chat`);
    }
  };
  return (
    <SubscribeDialog open={open} onOpenChange={setOpen}>
      <SubscribeDialogContent
        showCloseButton={false}
        tabIndex={-1}
        className="flex flex-col bg-medium-charcoal border-none w-full !ring-0 !outline-none justify-start  overflow-hidden p-0"
      >
        <div className="absolute w-full top-0 left-0">
          <ImageWithFallback
            src={coverImage}
            width={1000}
            height={300}
            alt={title}
            sizes="(max-width: 768px) 95vw, 613px"
            quality={100}
            unoptimized
            className="w-full h-full object-cover object-center rounded-md "
          />
        </div>
        <div className="flex flex-col gap-y-10 bg-medium-charcoal/95 relative z-10 py-10 px-6 sm:px-24  gap-8 overflow-hidden rounded-xl size-full scale-[1.01]">
          <SubscribeDialogClose className=" absolute top-6 left-6 flex items-center gap-x-2 cursor-pointer hover:underline text-accent-text text-xs font-inter">
            <span className="size-3 bg-accent-text text-black flex items-center justify-center rounded-[2px]">
              <ChevronLeft />
            </span>
            Back to profile
          </SubscribeDialogClose>
          <SubscribeDialogDescription className="sr-only">
            {" "}
            Purchase Successful
          </SubscribeDialogDescription>
          <div className="flex flex-col gap-y-8 items-center font-inter pb-5 pt-10 z-10 relative">
            <SubscribeDialogTitle className="capitalize text-center md:text-3xl font-inter text-2xl font-medium ">
              Purchase Successful
            </SubscribeDialogTitle>
            <p className="text-accent-text text-center text-2xl">
              Thank you for purchasing{" "}
              <span className="text-accent-color capitalize">{title}</span> from
              my Menu
            </p>
          </div>

          <Button
            type="button"
            onClick={handleCheckItOut}
            className="rounded relative flex items-center  border hover:bg-transparent active:bg-transparent h-auto mt-5 py-2 text-[15px] font-medium cursor-pointer whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] text-lg px-3 gap-3 "
            disabled={isLoadingConversation && !conversationId}
          >
            {isLoadingConversation && !conversationId
              ? "Loading chat..."
              : "Check it out!"}
          </Button>
        </div>
      </SubscribeDialogContent>
    </SubscribeDialog>
  );
};

function formatPurchaseAmount(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}
