import { Button } from "./ui/button";
import {
  SubscribeDialog,
  SubscribeDialogContent,
  SubscribeDialogDescription,
  SubscribeDialogTitle,
} from "@/components/ui/subscribe-dialog";
import { ImageWithFallback } from "./miscellaneous/image-with-fallback";

type MenuDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  media: Array<{ _id: string; url: string; type: string }>;
  coverImage: string;
  sourcePostId?: string;
  onOpenSourcePost: () => void;
  mediaComposition: string;
  totalPriceLabel: string;
};

export const MenuDetailsDialog = ({
  open,
  onOpenChange,
  title,
  description,
  media,
  coverImage,
  sourcePostId,
  onOpenSourcePost,
  mediaComposition,
  totalPriceLabel,
}: MenuDetailsDialogProps) => {
  const previewMedia = media.slice(0, 6);
  const overflowCount = Math.max(0, media.length - previewMedia.length);

  return (
    <SubscribeDialog open={open} onOpenChange={onOpenChange}>
      <SubscribeDialogContent className="w-full max-w-[min(96vw,980px)] p-3 sm:p-4 bg-[#0F1114] border border-[#1E2227]">
        <SubscribeDialogDescription className="sr-only">
          {title} menu details
        </SubscribeDialogDescription>
        <div className="space-y-4 max-h-[85dvh] overflow-y-auto pr-1">
          <div className="flex items-start justify-between gap-3">
            <SubscribeDialogTitle className="text-left text-base sm:text-lg text-[#F8F8F8]">
              {title}
            </SubscribeDialogTitle>
            {sourcePostId && (
              <Button
                type="button"
                onClick={onOpenSourcePost}
                className="px-3 py-1.5 text-xs rounded-md border border-[#FF007F]/40 bg-[#FF007F]/10 text-[#FF4DA6]"
                size="ghost"
              >
                Open full post
              </Button>
            )}
          </div>

          <div className="rounded-md border border-[#222734] bg-[#0C111B] px-3 py-2 text-xs text-[#B9C2D4]">
            <span>{mediaComposition}</span>
            <span className="mx-2">•</span>
            <span>{totalPriceLabel}</span>
          </div>

          <p className="text-sm text-[#D7DCE5] whitespace-pre-wrap leading-6">
            {description}
          </p>

          {previewMedia.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {previewMedia.map((entry, index) => {
                const showOverflow =
                  index === previewMedia.length - 1 && overflowCount > 0;
                return (
                  <div
                    key={entry._id}
                    className="relative rounded-md overflow-hidden border border-[#1F2532] bg-[#070A11]"
                  >
                    {entry.type === "video" ? (
                      <div className="h-48 w-full bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(255,0,127,0.2)_0%,rgba(19,14,29,0.96)_52%,rgba(10,9,17,1)_100%)]">
                        <video
                          src={entry.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <ImageWithFallback
                        src={entry.url}
                        alt={`${title} media ${index + 1}`}
                        width={480}
                        height={640}
                        quality={100}
                        unoptimized
                        className="h-48 w-full object-contain"
                        containerClassName="h-48 w-full bg-[radial-gradient(120%_120%_at_50%_-10%,rgba(255,0,127,0.2)_0%,rgba(19,14,29,0.96)_52%,rgba(10,9,17,1)_100%)]"
                      />
                    )}
                    <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-[#F1F5FA]">
                      {entry.type === "video" ? "Video" : "Image"}
                    </div>
                    {showOverflow && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                        +{overflowCount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-md bg-black">
              <ImageWithFallback
                src={coverImage}
                alt={`${title} preview`}
                width={1200}
                height={1600}
                sizes="(max-width: 768px) 95vw, 900px"
                quality={100}
                unoptimized
                className="w-full h-full max-h-[70dvh] object-contain"
                priority
              />
            </div>
          )}
        </div>
      </SubscribeDialogContent>
    </SubscribeDialog>
  );
};
