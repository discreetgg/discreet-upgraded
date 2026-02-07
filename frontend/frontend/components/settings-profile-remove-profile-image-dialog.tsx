'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useGlobal } from '@/context/global-context-provider';
import { removeProfileImageService } from '@/lib/services';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Icon } from './ui/icons';
import { PageLoader } from './ui/page-loader';

export const SettingsProfileRemoveProfileImageDialog = () => {
  const { user, setUser } = useGlobal();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveProfileImage = async () => {
    setIsLoading(true);
    await removeProfileImageService(user?.discordId ?? '')
      .then((response) => {
        toast.success(response.data.message);
        if (user) {
          setUser({
            ...user,
            profileImage: null,
          });
        }
      })
      .catch(() => {
        toast.error('Failed to delete profile image');
      })
      .finally(() => {
        setIsOpen(false);
        setIsLoading(false);
      });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='ghost' disabled={!user?.profileImage}>
          <Icon.remove />
          <span className='text-[11.899px] text-[#FF4040]'>
            Remove Profile Image
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className='space-y-[26px] !max-w-[279px] w-full'>
        <h1 className='text-[32px] font-semibold  text-[#F97066] '>
          Remove Profile Image
        </h1>
        <p className='text-[15px] font-light'>Are you absolutely sure? </p>
        <Button
          disabled={isLoading}
          onClick={handleRemoveProfileImage}
          className={cn(
            'rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-2 text-[15px] font-medium whitespace-nowrap border-[#F97066] bg-[#0A0A0B] shadow-[2px_2px_0_0_#F97066] text-[#F97066] w-full',
            'disabled:border-[#1F2227] disabled:shadow-[2px_2px_0_0_#1F2227] disabled:bg-[#0A0A0B] disabled:text-[#1F2227]'
          )}
        >
          Remove
        </Button>
      </DialogContent>
    </Dialog>
  );
};
