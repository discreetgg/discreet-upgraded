'use client';

import { Icon } from './ui/icons';

type PreviewMedia = {
  url: string;
  type: 'image' | 'video';
};

type PostComposerLivePreviewProps = {
  authorUsername?: string;
  authorAvatarUrl?: string | null;
  content: string;
  media: PreviewMedia[];
  unlockableType: 'none' | 'single' | 'bundle';
  unlockPrice?: string;
  lockedMediaCount?: number;
};

const toCurrency = (value?: string) => {
  const parsed = Number(value);
  const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const PostComposerLivePreview = ({
  authorUsername,
  authorAvatarUrl,
  content,
  media,
  unlockableType,
  unlockPrice,
  lockedMediaCount,
}: PostComposerLivePreviewProps) => {
  const hasContent = content.trim().length > 0;
  const isUnlockable = unlockableType !== 'none';
  const displayName = authorUsername || 'your_handle';
  const normalizedLockedCount = isUnlockable
    ? Math.max(
        lockedMediaCount ?? 0,
        unlockableType === 'single' ? 1 : 2
      )
    : 0;
  const totalCount = media.length + normalizedLockedCount;
  const displayCount = Math.min(totalCount, 4);
  const overflowCount = Math.max(0, totalCount - 4);

  const renderPreviewTile = (item: PreviewMedia, className: string) => (
    <div className={`overflow-hidden rounded-[10px] bg-black ${className}`}>
      {item.type === 'video' ? (
        <video
          src={item.url}
          className="h-full w-full object-contain"
          muted
          playsInline
        />
      ) : (
        <img
          src={item.url}
          alt="Post preview"
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );

  const renderLockedTile = (
    className: string,
    showOverflow = false,
    showUnlockAction = false
  ) => (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-[#242934] bg-[linear-gradient(135deg,#171D28_0%,#0D121B_100%)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-[#2A2F3A] bg-[#0A0E14]/80 p-2 text-[#7D8392]">
          <Icon.lock className="h-3.5 w-3.5" />
        </div>
      </div>
      {showUnlockAction && (
        <div className="absolute inset-x-2 bottom-2 rounded-md border border-[#2F3440] bg-[#141925]/95 px-2 py-1 text-center text-[11px] font-medium text-[#E6EAF2]">
          Unlock {toCurrency(unlockPrice)}
        </div>
      )}
      {showOverflow && overflowCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#090C12]/70 text-xl font-semibold text-[#F8F8F8]">
          +{overflowCount}
        </div>
      )}
    </div>
  );

  const renderSlot = (slotIndex: number, className: string, showOverflow = false) => {
    if (slotIndex < media.length) {
      return (
        <div key={`preview-${slotIndex}`}>
          {renderPreviewTile(media[slotIndex], className)}
        </div>
      );
    }
    const lockedSlotIndex = slotIndex - media.length;
    return (
      <div key={`locked-${slotIndex}`}>
        {renderLockedTile(className, showOverflow, lockedSlotIndex === 0)}
      </div>
    );
  };

  return (
    <div className="space-y-2 rounded-[10px] border border-[#1F2227] bg-[#0F1114] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#F8F8F8]">Live post preview</p>
        <span className="text-[11px] text-[#8A8C95]">What buyers will see</span>
      </div>
      <div className="rounded-[10px] border border-[#1E1E21] bg-[#090B10] p-3">
        <div className="mb-3 flex items-center gap-2">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full border border-[#2A2D31] object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2A2D31] bg-[#1A1D24] text-xs text-[#8A8C95]">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[#F8F8F8]">{displayName}</p>
            <p className="text-xs text-[#8A8C95]">@{displayName} • preview</p>
          </div>
        </div>

        {hasContent ? (
          <p className="mb-3 whitespace-pre-line break-words text-sm text-[#F8F8F8]">
            {content}
          </p>
        ) : (
          <p className="mb-3 text-sm text-[#8A8C95]">
            Add post text to preview your message.
          </p>
        )}

        {totalCount > 0 && (
          <div className="mb-3 overflow-hidden rounded-[12px] border border-[#1F2227]">
            {displayCount === 1 && (
              <div className="grid p-1.5">
                {renderSlot(0, 'h-52 w-full', overflowCount > 0)}
              </div>
            )}
            {displayCount === 2 && (
              <div className="grid grid-cols-2 gap-1.5 p-1.5">
                {renderSlot(0, 'h-40 w-full')}
                {renderSlot(1, 'h-40 w-full', overflowCount > 0)}
              </div>
            )}
            {displayCount === 3 && (
              <div className="grid h-[260px] grid-cols-3 gap-1.5 p-1.5">
                {renderSlot(0, 'col-span-2 h-full w-full')}
                <div className="col-span-1 grid grid-rows-2 gap-1.5">
                  {renderSlot(1, 'h-full w-full')}
                  {renderSlot(2, 'h-full w-full', overflowCount > 0)}
                </div>
              </div>
            )}
            {displayCount >= 4 && (
              <div className="grid grid-cols-2 gap-1.5 p-1.5">
                {renderSlot(0, 'h-36 w-full')}
                {renderSlot(1, 'h-36 w-full')}
                {renderSlot(2, 'h-36 w-full')}
                {renderSlot(3, 'h-36 w-full', true)}
              </div>
            )}
          </div>
        )}
        {!hasContent && totalCount === 0 && (
          <p className="text-xs text-[#8A8C95]">
            Your post preview will appear here as you type and add media.
          </p>
        )}
      </div>
    </div>
  );
};
