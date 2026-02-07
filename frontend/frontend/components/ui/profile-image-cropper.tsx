'use client';

import React, { type SyntheticEvent } from 'react';

import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

import 'react-image-crop/dist/ReactCrop.css';

import { cn } from '@/lib/utils';
import type { FileWithPreview } from '@/types/global';
import { CropIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { RadialProgress } from './progress';

interface ProfileImageCropperProps {
  dialogOpen: boolean;
  loading: boolean;
  progress: number;
  children: React.ReactNode;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedFile: FileWithPreview | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileWithPreview | null>>;
  handleOnCropComplete: (image: File) => Promise<void>;
}

export function ProfileImageCropper({
  dialogOpen,
  loading,
  progress,
  children,
  setDialogOpen,
  selectedFile,
  setSelectedFile,
  handleOnCropComplete,
}: ProfileImageCropperProps) {
  const aspect = 1;

  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const [crop, setCrop] = React.useState<Crop>();
  const [croppedImageFile, setCroppedImageFile] = React.useState<File | null>(
    null
  );

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function onCropComplete(crop: PixelCrop) {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageFile = await getCroppedImageFile(imgRef.current, crop);
      setCroppedImageFile(croppedImageFile);
    }
  }

  async function getCroppedImageFile(
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName = 'cropped.png'
  ): Promise<File> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );
    }

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], fileName, { type: 'image/png' }));
        }
      }, 'image/png');
    });
  }

  async function onCrop() {
    try {
      if (croppedImageFile) {
        await handleOnCropComplete(croppedImageFile);
        setDialogOpen(false);
      } else {
        toast.error('No cropped image available!');
      }
    } catch {
      toast.error('Something went wrong!');
    }
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        setSelectedFile(null);
      }}
    >
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className='p-0 gap-0'>
        <div className='p-6 size-full relative'>
          <ReactCrop
            crop={crop}
            circularCrop
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => onCropComplete(c)}
            aspect={aspect}
            className={cn('w-full', loading && 'pointer-events-none')}
          >
            {loading && (
              <div className='text-center max-w-md flex items-center flex-col justify-center select-none pointer-events-none absolute z-10 aspect-square bg-black/80'>
                <RadialProgress progress={progress} />
                <p className='text-xs font-semibold'>Uploading Picture</p>
                <p className='text-[8px] font-bold text-white'>
                  Do not refresh while the picture is being uploaded
                </p>
              </div>
            )}
            <Avatar className='size-full rounded-none'>
              <AvatarImage
                ref={imgRef}
                className='size-full rounded-none '
                alt='Image Cropper Shell'
                src={selectedFile?.preview}
                onLoad={onImageLoad}
              />
              <AvatarFallback className='size-full min-h-[460px] rounded-none'>
                Loading...
              </AvatarFallback>
            </Avatar>
          </ReactCrop>
        </div>
        <DialogFooter className='p-6 pt-0 justify-center '>
          <DialogClose asChild>
            <Button
              size={'sm'}
              type='reset'
              disabled={loading}
              className='rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap !border-[#1E1E21] bg-[#0A0A0B] shadow-[2px_2px_0_0_#1E1E21] text-[#F8F8F8]'
              variant={'outline'}
              onClick={() => {
                setSelectedFile(null);
              }}
            >
              <Trash2Icon className='mr-1.5 size-4' />
              Cancel
            </Button>
          </DialogClose>
          <Button
            type='submit'
            disabled={loading}
            size={'sm'}
            className='rounded flex items-center gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]'
            onClick={onCrop}
          >
            <CropIcon className='mr-1.5 size-4' />
            Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to center the crop
export function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 50,
        height: 50,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}
