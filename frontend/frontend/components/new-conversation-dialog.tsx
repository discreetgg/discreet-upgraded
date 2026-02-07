'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMessage } from '@/context/message-context';
import { getAllUsersService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { useRouter } from '@bprogress/next/app';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ComponentLoader } from './ui/component-loader';
import { Icon } from './ui/icons';
import { UserAvatar } from './user-avatar';

export const NewConversationDialog = () => {
  const { setReceiver, conversations } = useMessage();

  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsersService();
      setUsers(response || []);
      setFilteredUsers(response || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user: UserType) => {
    try {
      setReceiver(user);
      setCreating(user.discordId);

      // Check if a conversation already exists with this user
      const existingConversation = conversations?.find((conv) =>
        conv.participants.some((p) => p.discordId === user.discordId)
      );

      if (existingConversation) {
        // Redirect to existing conversation
        setOpen(false);
        router.push(`/messages/${existingConversation._id}`);
        toast.success(
          `Continuing chat with ${user.displayName || user.username}`
        );
      } else {
        // Start a new temporary conversation
        setOpen(false);
        router.push('/messages?chat=new');
        toast.success(
          `Opening new chat with ${user.displayName || user.username}`
        );
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setCreating(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Icon.add className='size-6' />
      </DialogTrigger>
      <DialogContent className='max-w-[411px] p-4 rounded-md border-[#3C3C42] border bg-[#1F2227] w-full space-y-[11px]'>
        <DialogTitle className='text-[15px] font-medium'>
          Select a creator
        </DialogTitle>

        <div className='space-y-4'>
          <Input
            type='text'
            autoComplete='off'
            placeholder='Enter username'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='px-4 py-2 h-auto placeholder:text-[#8A8C95] !bg-[#1F2227] border border-[#2E2E32] rounded-md'
          />

          <div className='h-64 overflow-y-auto'>
            {loading ? (
              <ComponentLoader className='flex items-center justify-center w-full' />
            ) : filteredUsers.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                {searchQuery ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const existingConversation = conversations?.find((conv) =>
                  conv.participants.some((p) => p.discordId === user.discordId)
                );

                if (existingConversation) {
                  return (
                    <button
                      key={user.discordId}
                      type='button'
                      disabled
                      className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left opacity-30 cursor-not-allowed'
                    >
                      <UserAvatar
                        profileImage={user.profileImage?.url}
                        discordId={user.discordId}
                        discordAvatar={user.discordAvatar}
                        className='size-[40px]'
                      />

                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-[15px] truncate'>
                          {user.displayName}
                        </p>
                        <p className='text-sm text-[#8A8C95] font-light truncate'>
                          @{user.username}
                        </p>
                      </div>

                      <Icon.tickCircle2 />
                    </button>
                  );
                }
                return (
                  <button
                    key={user.discordId}
                    type='button'
                    className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors text-left'
                    onClick={() => handleStartChat(user)}
                  >
                    <UserAvatar
                      profileImage={user.profileImage?.url}
                      discordId={user.discordId}
                      discordAvatar={user.discordAvatar}
                      className='size-[40px]'
                    />

                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-[15px] truncate'>
                        {user.displayName}
                      </p>
                      <p className='text-sm text-[#8A8C95] font-light truncate'>
                        @{user.username}
                      </p>
                    </div>

                    {creating === user.discordId ? (
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary' />
                    ) : (
                      <Icon.add color='#8A8C95' />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
