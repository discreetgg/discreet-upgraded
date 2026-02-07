'use client';

import { useGlobal } from '@/context/global-context-provider';
import { uploadProfileImageService } from '@/lib/services';
import type { FileWithPreview, ProfileImageType } from '@/types/global';
import type { AxiosProgressEvent } from 'axios';
import { useCallback, useState } from 'react';
import { type FileWithPath, useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Icon } from './ui/icons';
import { ProfileImageCropper } from './ui/profile-image-cropper';

const accept = {
  'image/*': [],
};

export const ProfileHeaderDetailProfileImage = () => {
  const { user, setUser } = useGlobal();

  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setDialogOpen(true);
      setSelectedFile(fileWithPreview);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
  });

  const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
    if (progressEvent.total) {
      const percentage = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setProgress(percentage);
    }
  };

  const handleImageUpload = async (image: File) => {
    if (!image) {
      return;
    }
    setLoading(true);

    await uploadProfileImageService({
      discordId: user?.discordId ?? '',
      image,
      onUploadProgress,
    })
      .then((res) => {
        setLoading(false);
        toast.success(res.data.message);
        if (user) {
          setUser({
            ...user,
            profileImage: res.data.data as ProfileImageType,
          });
        }
        setSelectedFile(res.data.data.url);
      })
      .catch((error) => {
        setLoading(false);
        console.error('Error uploading image:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className='relative w-max h-max  ml-3 -mt-[70px]'>
      <ProfileImageCropper
        dialogOpen={isDialogOpen}
        setDialogOpen={setDialogOpen}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleOnCropComplete={handleImageUpload}
        loading={loading}
        progress={progress}
      >
        <Avatar
          {...getRootProps()}
          color='#1E1E21'
          className='size-[99px] border-[4.16px] border-[#0F1114] relative group'
        >
          <input {...getInputProps()} />
          <div
            title='Upload/Change Profile Image'
            className='absolute inset-0 z-10 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer'
          >
            <Icon.selectPicture />
          </div>
          <AvatarImage
            src={
              user?.profileImage
                ? user?.profileImage?.url
                : `https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.discordAvatar}.png`
            }
          />
          <AvatarFallback>
            <Icon.selectPicture />
          </AvatarFallback>
        </Avatar>
      </ProfileImageCropper>

      <div className='absolute bottom-2 right-1 border-[#0F1114] border-[3.5px] size-[18px] rounded-full bg-green-500 z-10' />
    </div>
  );
};
