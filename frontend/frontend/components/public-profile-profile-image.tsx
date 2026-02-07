'use client';

import type { UserType } from '@/types/global';
import ViewImageModal from './miscellaneous/view-image-modal';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Icon } from './ui/icons';
interface Props {
  user: Omit<UserType, 'user'>;
}

export const PublicProfileProfileImage = ({ user }: Props) => {
  return (
    <div className='relative w-max h-max z-20  ml-3 -mt-[50px]'>
      <Avatar
        color='#1E1E21'
        className='size-[99px] border-[4.16px] border-[#0F1114] relative group'
      >
        {user.profileImage ? (
          <ViewImageModal image={user?.profileImage?.url} />
        ) : user.discordAvatar ? (
          <ViewImageModal
            image={`https://cdn.discordapp.com/avatars/${user?.discordId}/${user?.discordAvatar}.png`}
            imageClassName='object-cover object-center rounded-full'
          />
        ) : (
          <AvatarFallback className='!rounded-none bg-[#1E1E21]'>
            <Icon.selectPicture />
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
};
