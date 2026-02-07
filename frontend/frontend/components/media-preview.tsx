'use client';

import Image from 'next/image';
import { Icon } from './ui/icons';

interface MediaPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
}

export const MediaPreview = ({ files, onRemove }: MediaPreviewProps) => {
  if (files.length === 0) return null;

  return (
    <div className='px-2.5'>
      <div className='overflow-x-scroll'>
        <div className='flex  gap-2'>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className='relative'
            >
              <div className='size-[82px] rounded-[2.318px] overflow-hidden bg-[#3c3c42] relative'>
                {file.type.startsWith('image/') ? (
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className='object-cover'
                  />
                ) : file.type.startsWith('video/') ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className='w-full h-full object-cover'
                    muted
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-xs text-[#8A8C95]'>
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type='button'
                onClick={() => onRemove(index)}
                className='absolute top-0.5 left-0.5 !rounded-full bg-black/20 hover:bg-black/40 duration-150 cursor-pointer'
              >
                <Icon.close />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
