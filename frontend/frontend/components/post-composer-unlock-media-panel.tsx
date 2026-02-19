'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo } from 'react';

type UnlockMediaPanelProps = {
  files: File[];
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  inputId?: string;
};

type PreviewMedia = {
  name: string;
  type: 'image' | 'video';
  url: string;
};

export const PostComposerUnlockMediaPanel = ({
  files,
  onSelect,
  onRemove,
  inputId = 'unlock-media-upload',
}: UnlockMediaPanelProps) => {
  const previewMedia = useMemo<PreviewMedia[]>(
    () =>
      files.map((file) => ({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previewMedia.forEach((media) => URL.revokeObjectURL(media.url));
    };
  }, [previewMedia]);

  return (
    <div className="space-y-2 rounded-[8px] border border-[#2A2D31] bg-[#0A0A0A] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-[#F8F8F8]">
            Locked media files
          </p>
          <p className="text-xs text-[#8A8C95]">Buyers unlock these files only.</p>
        </div>
        <label
          htmlFor={inputId}
          className="cursor-pointer rounded-md border border-[#34D399]/50 bg-[#34D399]/10 px-3 py-2 text-xs font-medium text-[#34D399] hover:bg-[#34D399]/20 transition-colors"
        >
          Add locked files
          <input
            id={inputId}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={onSelect}
            className="hidden"
          />
        </label>
      </div>

      {previewMedia.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] text-[#8A8C95]">
            {previewMedia.length} locked file
            {previewMedia.length === 1 ? '' : 's'} selected
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {previewMedia.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="overflow-hidden rounded-[8px] border border-[#1F2227] bg-[#111216]"
              >
                {file.type === 'image' ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <video
                    src={file.url}
                    className="h-28 w-full object-cover"
                    muted
                  />
                )}
                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                  <span className="truncate text-[11px] text-[#D4D4D8]">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-[11px] text-[#8A8C95] hover:text-[#F8F8F8]"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#8A8C95]">No locked files selected yet.</p>
      )}
    </div>
  );
};
