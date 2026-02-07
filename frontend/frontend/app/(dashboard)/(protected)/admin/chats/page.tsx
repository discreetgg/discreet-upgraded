'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { toast } from 'sonner';
import { ComponentLoader } from '@/components/ui/component-loader';
import { useAllUsers } from '@/hooks/queries/use-all-users';
import { getAdminChatsService } from '@/lib/services';
import type { UserType } from '@/types/global';
import { cn } from '@/lib/utils';

/** Flexible shape for admin chat API response (messages array may vary by backend) */
type AdminChatMessage = {
  content?: string;
  text?: string;
  body?: string;
  senderDiscordId?: string;
  senderId?: string;
  sender?: string;
  createdAt?: string;
  timestamp?: string;
  type?: string;
  _id?: string;
  [key: string]: unknown;
};

type AdminChatResponse = {
  messages?: AdminChatMessage[];
  conversation?: AdminChatMessage[];
  [key: string]: unknown;
};

function getMessageText(msg: AdminChatMessage): string {
  return (msg.content ?? msg.text ?? msg.body ?? JSON.stringify(msg)).toString();
}

function getMessageSenderId(msg: AdminChatMessage): string | undefined {
  return msg.senderDiscordId ?? msg.senderId ?? msg.sender;
}

function getMessageTime(msg: AdminChatMessage): string {
  const raw = msg.createdAt ?? msg.timestamp;
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
  } catch {
    return String(raw);
  }
}

function getDiscordAvatarUrl(discordId: string, discordAvatar: string | undefined) {
  if (discordAvatar?.trim()) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}

function UserSelectDropdown({
  users,
  value,
  onSelect,
  placeholder,
  label,
  disabled,
  open,
  onOpenChange,
}: {
  users: UserType[];
  value: string;
  onSelect: (discordId: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = users.find((u) => u.discordId === value);
  return (
    <div className="w-full sm:min-w-[320px] space-y-2">
      <label className="text-[#8A8C95] text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between h-12 px-4 rounded-xl border-[#1E1E21] bg-[#15171B] hover:bg-[#1A1D21] hover:border-[#2A2D32] text-[#F8F8F8] font-normal',
              !value && 'text-[#8A8C95]'
            )}
          >
            {selected ? (
              <span className="flex items-center gap-3 truncate">
                <Image
                  src={
                    selected.profileImage?.url ??
                    getDiscordAvatarUrl(selected.discordId, selected.discordAvatar)
                  }
                  alt={selected.username}
                  width={32}
                  height={32}
                  className="rounded-full object-cover shrink-0 ring-2 ring-[#1E1E21]"
                />
                <span className="flex flex-col items-start text-left min-w-0">
                  <span className="text-[#F8F8F8] truncate w-full">
                    {selected.displayName}
                  </span>
                  <span className="text-[#8A8C95] text-xs">@{selected.username}</span>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Icon.profile className="size-5 text-[#8A8C95]" />
                {placeholder}
              </span>
            )}
            <Icon.selectDown className="ml-2 size-4 shrink-0 text-[#8A8C95]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-[#1E1E21] bg-[#15171B] shadow-xl"
          align="start"
          sideOffset={8}
        >
          <Command className="rounded-xl border-0 bg-transparent">
            <CommandInput
              placeholder="Search by name, username, email..."
              className="h-11 border-b border-[#1E1E21] bg-transparent text-[#F8F8F8] placeholder:text-[#8A8C95] focus:ring-0"
            />
            <CommandList className="max-h-[280px] p-1.5">
              <CommandEmpty className="py-8 text-center text-[#8A8C95] text-sm">
                No user found.
              </CommandEmpty>
              <CommandGroup className="p-0">
                {users.map((user) => (
                  <CommandItem
                    key={user.discordId}
                    value={`${user.displayName} ${user.username} ${user.email}`}
                    onSelect={() => {
                      onSelect(user.discordId);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#F8F8F8] aria-selected:bg-[#1E1E21] data-[selected=true]:bg-[#1E1E21] focus:bg-[#1E1E21] cursor-pointer"
                  >
                    <Image
                      src={
                        user.profileImage?.url ??
                        getDiscordAvatarUrl(user.discordId, user.discordAvatar)
                      }
                      alt={user.username}
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0"
                    />
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="font-medium truncate">{user.displayName}</span>
                      <span className="text-[#8A8C95] text-xs truncate">
                        @{user.username}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 text-[10px]',
                        user.role === 'seller' && 'border-[#FF007F] text-[#FF007F]',
                        user.role === 'admin' && 'border-blue-500 text-blue-500',
                        user.role === 'buyer' && 'border-[#8A8C95] text-[#8A8C95]'
                      )}
                    >
                      {user.role}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function MonitorChatsPage() {
  const { data: usersFromApi = [], isLoading: usersLoading } = useAllUsers();
  const [user1DiscordId, setUser1DiscordId] = useState<string>('');
  const [user2DiscordId, setUser2DiscordId] = useState<string>('');
  const [chatData, setChatData] = useState<AdminChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  const user1 = usersFromApi.find((u) => u.discordId === user1DiscordId);
  const user2 = usersFromApi.find((u) => u.discordId === user2DiscordId);

  const handleViewConversation = async () => {
    if (!user1DiscordId || !user2DiscordId) {
      toast.error('Please select both users');
      return;
    }
    if (user1DiscordId === user2DiscordId) {
      toast.error('Please select two different users');
      return;
    }
    setLoading(true);
    setChatData(null);
    try {
      const data = await getAdminChatsService(user1DiscordId, user2DiscordId);
      setChatData(data as AdminChatResponse);
      const list = (data as AdminChatResponse).messages ?? (data as AdminChatResponse).conversation ?? [];
      if (Array.isArray(list) && list.length === 0) {
        toast.info('No messages in this conversation');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load conversation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const messages: AdminChatMessage[] = Array.isArray(chatData?.messages)
    ? chatData.messages
    : Array.isArray(chatData?.conversation)
      ? chatData.conversation
      : [];

  return (
    <div className="py-6 px-2">
      <main className="relative md:pt-[88px] space-y-6">
        {/* Header */}
        <div className="max-w-[1200px] w-full space-y-1">
          <div className="flex items-center justify-between gap-3 md:mb-0 mb-2">
            <h1 className="md:text-[32px] text-[15px] font-semibold text-[#F8F8F8]">
              Monitor Chats
            </h1>
          </div>
          <p className="text-[#8A8C95] font-light text-[15px] md:block hidden">
            Select two users to view their conversation
          </p>
        </div>

        {/* User selection */}
        <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
          <CardHeader>
            <CardTitle className="text-[#F8F8F8]">Select users to monitor</CardTitle>
            <p className="text-[#8A8C95] text-sm font-normal mt-1">
              Search and pick two users to view their conversation
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-end flex-wrap">
              <UserSelectDropdown
                users={usersFromApi}
                value={user1DiscordId}
                onSelect={setUser1DiscordId}
                placeholder="Select first user"
                label="User 1"
                disabled={usersLoading}
                open={open1}
                onOpenChange={setOpen1}
              />
              <div className="flex items-center justify-center sm:pb-1 text-[#8A8C95]">
                <Icon.arrowRight className="size-5 shrink-0" />
              </div>
              <UserSelectDropdown
                users={usersFromApi}
                value={user2DiscordId}
                onSelect={setUser2DiscordId}
                placeholder="Select second user"
                label="User 2"
                disabled={usersLoading}
                open={open2}
                onOpenChange={setOpen2}
              />
              <Button
                onClick={handleViewConversation}
                disabled={
                  loading ||
                  usersLoading ||
                  !user1DiscordId ||
                  !user2DiscordId ||
                  user1DiscordId === user2DiscordId
                }
                className="h-12 px-6 rounded-xl bg-[#FF007F] text-[#0F1114] hover:bg-[#FF007F]/90 shrink-0 font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <ComponentLoader className="size-4" />
                    Loading...
                  </span>
                ) : (
                  'View conversation'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversation panel */}
        {(user1 || user2) && (
          <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
            <CardHeader>
              <CardTitle className="text-[#F8F8F8]">
                {user1 && user2
                  ? `Conversation: @${user1.username} ↔ @${user2.username}`
                  : 'Conversation'}
              </CardTitle>
              {user1 && user2 && (
                <p className="text-[#8A8C95] text-sm">
                  {user1.displayName} and {user2.displayName}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <ComponentLoader />
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <ComponentLoader />
                </div>
              ) : messages.length === 0 && chatData !== null ? (
                <div className="text-center py-12">
                  <Icon.messages className="w-12 h-12 text-[#8A8C95] mx-auto mb-4" />
                  <p className="text-[#8A8C95]">No messages in this conversation</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto hidden_scrollbar">
                  {messages.map((msg, idx) => {
                    const senderId = getMessageSenderId(msg);
                    const isUser1 = senderId === user1DiscordId;
                    const sender = isUser1 ? user1 : user2;
                    return (
                      <div
                        key={(msg._id as string) ?? idx}
                        className="flex items-start gap-3 p-3 bg-[#15171B] rounded-lg border border-[#1E1E21]"
                      >
                        <Image
                          src={
                            sender
                              ? sender.profileImage?.url ??
                                getDiscordAvatarUrl(
                                  sender.discordId,
                                  sender.discordAvatar
                                )
                              : 'https://cdn.discordapp.com/embed/avatars/0.png'
                          }
                          alt={sender?.username ?? 'User'}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[#F8F8F8] text-sm font-medium">
                              {sender?.displayName ?? sender?.username ?? senderId ?? 'Unknown'}
                            </p>
                            <p className="text-[#8A8C95] text-xs">
                              {getMessageTime(msg)}
                            </p>
                          </div>
                          <p className="text-[#F8F8F8] text-sm break-words">
                            {getMessageText(msg)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon.messages className="w-12 h-12 text-[#8A8C95] mx-auto mb-4" />
                  <p className="text-[#8A8C95]">
                    Select two users and click &quot;View conversation&quot; to load
                    messages
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!user1 && !user2 && (
          <Card className="bg-[#0F1114] border-[#1E1E21] max-w-[1200px]">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Icon.messages className="w-12 h-12 text-[#8A8C95] mx-auto mb-4" />
                <p className="text-[#8A8C95]">
                  Select two users above to monitor their conversation
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
