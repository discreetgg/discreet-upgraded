'use client';

import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { getUserDiscordAvatar } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Icon } from './ui/icons';
import { cn } from '@/lib/utils';

export const ConversationSearch = ({ 
  isExpanded, 
  onExpandedChange 
}: { 
  isExpanded?: boolean; 
  onExpandedChange?: (expanded: boolean) => void;
} = {}) => {
  const { conversations, setReceiver } = useMessage();
  const { user } = useGlobal();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use controlled isExpanded if provided, otherwise use internal state
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;
  const setExpanded = (value: boolean) => {
    if (isExpanded === undefined) {
      setInternalExpanded(value);
    }
    onExpandedChange?.(value);
  };

  // Auto-collapse when search is cleared
  useEffect(() => {
    if (!searchQuery && !open) {
      setExpanded(false);
    }
  }, [searchQuery, open]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setOpen(query.length > 0);
  };

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    setSearchQuery('');
    setOpen(false);
    setExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return [];
    return conversations?.filter((c) =>
      c.participants.some((p) =>
        (p.displayName || p.username)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    );
  }, [conversations, searchQuery]);

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        expanded ? 'w-full' : 'w-auto md:w-full'
      )}
    >
      {!expanded && (
        <button
          type="button"
          onClick={handleExpand}
          className="md:hidden p-2 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200 active:scale-95"
          aria-label="Search conversations"
        >
          <Icon.search className="size-5 text-[#A1A1AA]" />
        </button>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              'relative',
              !expanded && 'md:block',
              expanded ? 'block w-full' : 'hidden md:block w-full'
            )}
          >
            <Input
              ref={inputRef}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-[60px] focus:bg-[#3C3C42] text-sm text-[#F8F8F8] px-4 py-2 h-auto pr-10"
            />
            {expanded && (
              <button
                type="button"
                onClick={handleClear}
                className="md:hidden absolute top-1/2 -translate-y-1/2 right-2 p-1 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200"
                aria-label="Close search"
              >
                <Icon.close className="size-4" />
              </button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-full sm:max-w-[294px] rounded-[8px] border-none p-0 max-h-[300px] overflow-y-auto bg-[#2E2E32]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {filteredConversations?.length === 0 ? (
            <p className="text-muted-foreground text-sm p-2">
              No conversations found
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredConversations?.map((conv) => {
                const other = conv.participants.find(
                  (p) => p.discordId !== user?.discordId
                );
                if (!other) return null;

                return (
                  <li key={conv._id}>
                    <Link
                      href={`/messages/${conv._id}`}
                      className="px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-between"
                      onClick={() => {
                        handleClear();
                        setReceiver(other);
                      }}
                    >
                      <div className="flex items-center gap-[13px]">
                        <Avatar
                          color="#1E1E21"
                          className="size-[39px] relative group"
                        >
                          <AvatarImage
                            src={
                              other?.profileImage?.url ??
                              getUserDiscordAvatar({
                                discordId: other?.discordId,
                                discordAvatar: other?.discordAvatar,
                              })
                            }
                          />
                          <AvatarFallback>
                            <Image
                              src="/user.svg"
                              height={48}
                              width={48}
                              className="rounded-full"
                              alt=""
                            />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="leading-normal text-[15px] font-bold">
                            {other?.displayName}
                          </span>
                          <span className="leading-normal text-[#8A8C95] text-[15px] font-light">
                            @{other?.username}
                          </span>
                        </div>
                      </div>
                      <Icon.messagesFilled />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
