'use client';

import { useMessageSearch } from '@/context/message-search-context';
import { useMessageReadTracker } from '@/hooks/use-message-read-tracker';
import { cn, getEmojiSizeClass } from '@/lib/utils';
import type { MessageType } from '@/types/global';
import { format } from 'date-fns';
import Image from 'next/image';
import React, { useEffect, useRef, useMemo } from 'react';
import { MessageMedia } from './message-media';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageMediaPaid } from './message-media-paid';
import { useGlobal } from '@/context/global-context-provider';
import { Icon } from './ui/icons';
import { DMMenuPreview } from './dm-menu-preview';

interface MessageItemProps {
  message: MessageType;
  isOwn: boolean;
  onRetryMessage?: (messageId: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  onReloadMessages?: () => Promise<void>;
  onSendUnlockMessage?: (
    messageId: string,
    price: string,
    sellerId: string,
  ) => Promise<void>;
}

const MessageItemComponent = ({
  message,
  isOwn,
  onRetryMessage,
  onMarkAsRead,
  onReloadMessages,
  onSendUnlockMessage,
}: MessageItemProps) => {
  const { user } = useGlobal();
  const messageRef = useRef<HTMLDivElement>(null);
  const { observeMessage, setMarkAsReadCallback } = useMessageReadTracker({
    threshold: 1000, // Mark as read after 1 second of viewing
    rootMargin: '0px 0px -50% 0px', // Message needs to be 50% in view
  });
  const { highlightText, matchingMessageIds, currentMatchIndex } =
    useMessageSearch();

  // Memoize emoji styling for performance
  const emojiSizeClass = useMemo(
    () => getEmojiSizeClass(message.text || ''),
    [message.text]
  );

  // Check if this is the currently selected search result
  const isCurrentMatch =
    matchingMessageIds.length > 0 &&
    currentMatchIndex >= 0 &&
    matchingMessageIds[currentMatchIndex] === message._id;

  // Scroll to this message if it's the current match
  useEffect(() => {
    if (isCurrentMatch && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isCurrentMatch]);

  // Set up the callback for marking messages as read
  useEffect(() => {
    if (onMarkAsRead) {
      setMarkAsReadCallback(onMarkAsRead);
    }
  }, [onMarkAsRead, setMarkAsReadCallback]);

  // Observe this message for read tracking (only for messages from others)
  useEffect(() => {
    if (!isOwn && messageRef.current && message.status !== 'read') {
      const cleanup = observeMessage(messageRef.current, message._id);
      return cleanup;
    }
  }, [isOwn, message._id, message.status, observeMessage]);

  const mediaArray = message.media || [];

  // Check if this is a tip message (has price and text contains "Tip sent")
  const isTipMessage = message.price && message.text?.includes('Tip sent');
  
  // Check if this is an unlock message (has price and text contains "Content unlocked" or "Media unlocked")
  const isUnlockMessage = message.price && (message.text?.includes('Content unlocked') || message.text?.includes('Media unlocked'));

  return (
    <div
      ref={messageRef}
      key={message._id}
      className={cn(
        'message-item transition-all duration-300',
        isCurrentMatch &&
          'ring-2 ring-[#FF007F]/50 bg-[#FF007F]/5 rounded-lg p-0.5'
      )}
      data-message-id={message._id}
    >
      <div className={`max-w-full ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className="space-y-[6px] relative">
          {message.type !== 'call' && !isTipMessage && !isUnlockMessage && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-[5px]">
                <Avatar className="size-[29.3px]">
                  <AvatarImage
                    src={
                      message.sender?.profileImage?.url ??
                      `https://cdn.discordapp.com/avatars/${message.sender.discordId}/${message.sender.discordAvatar}.png`
                    }
                    alt={message.sender.displayName || message.sender.username}
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
                <p className="font-bold text-[15px]">
                  {message.sender.displayName}
                </p>
              </div>

              <span className="text-[10px] text-[#8A8C95]">
                {format(new Date(message.createdAt || Date.now()), 'HH:mm')}
              </span>
            </div>
          )}

          {/* Tip Message Design */}
          {isTipMessage ? (
            <div className="space-y-2">
              {/* Sender info for tip messages */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-[5px]">
                  <Avatar className="size-[29.3px]">
                    <AvatarImage
                      src={
                        message.sender?.profileImage?.url ??
                        `https://cdn.discordapp.com/avatars/${message.sender.discordId}/${message.sender.discordAvatar}.png`
                      }
                      alt={
                        message.sender.displayName || message.sender.username
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
                  <p className="font-bold text-[15px]">
                    {isOwn ? 'You' : message.sender.displayName}
                  </p>
                  <span className="text-[12px] text-[#8A8C95]">
                    {isOwn ? 'sent a tip' : 'tipped you'}
                  </span>
                </div>
                <span className="text-[10px] text-[#8A8C95]">
                  {format(new Date(message.createdAt || Date.now()), 'HH:mm')}
                </span>
              </div>

              {/* Tip Card */}
              <div className="flex items-center rounded-[10px] gap-2 relative max-w-[437px] w-full min-h-[138px] mx-auto justify-center overflow-hidden">
                <Image
                  src="/notification-tip-card.png"
                  alt="tip"
                  width={437}
                  height={138}
                  className="object-cover w-full h-full absolute top-0 left-0"
                />
                <div className="absolute top-0 left-0 lg:w-[419px] w-full blur-[173px] mx-auto aspect-square bg-[#FF007F] -bottom-[60%]" />

                <p
                  data-text={
                    message.price && Number(message.price).toString().length > 6
                      ? 'true'
                      : 'false'
                  }
                  className="text-[82px] data-[text=true]:text-7xl text-white z-10 leading-[20px] tracking-[0.5px] text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  $
                  {Number(message.price).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p
                  data-text={
                    message.price && Number(message.price).toString().length > 4
                      ? 'true'
                      : 'false'
                  }
                  className="text-[82px] data-[text=true]:text-7xl text-white z-[9] leading-[20px] tracking-[0.5px] text-center blur-[2.8px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  $
                  {Number(message.price).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              {/* Status indicator for own messages */}
              {isOwn && message.type !== 'call' && (
                <div className="flex items-center justify-end gap-1 text-xs text-[#8A8C95]">
                  {message.status === 'failed' && onRetryMessage && (
                    <button
                      onClick={() => onRetryMessage(message._id)}
                      className="text-[#EF4444] hover:text-[#DC2626] text-[8px] underline mr-1"
                      type="button"
                    >
                      Retry
                    </button>
                  )}
                  <span
                    className={`${
                      message.status === 'read'
                        ? 'text-[#FF007F]'
                        : message.status === 'delivered'
                        ? 'text-[#8A8C95]'
                        : message.status === 'sent'
                        ? 'text-[#6B7280]'
                        : message.status === 'sending'
                        ? 'text-[#9CA3AF] animate-pulse'
                        : message.status === 'failed'
                        ? 'text-[#EF4444]'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {message.status === 'read'
                      ? '✓✓'
                      : message.status === 'delivered'
                      ? '✓✓'
                      : message.status === 'sent'
                      ? '✓'
                      : message.status === 'sending'
                      ? '○'
                      : message.status === 'failed'
                      ? '✕'
                      : '✓'}
                  </span>
                </div>
              )}
            </div>
          ) : isUnlockMessage ? (
            <div className="space-y-2">
              {/* Sender info for unlock messages */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-[5px]">
                  <Avatar className="size-[29.3px]">
                    <AvatarImage
                      src={
                        message.sender?.profileImage?.url ??
                        `https://cdn.discordapp.com/avatars/${message.sender.discordId}/${message.sender.discordAvatar}.png`
                      }
                      alt={message.sender.displayName || message.sender.username}
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
                  <p className="font-bold text-[15px]">
                    {isOwn ? 'You' : message.sender.displayName}
                  </p>
                  <span className="text-[12px] text-[#8A8C95]">
                    {isOwn ? 'unlocked content' : 'unlocked your content'}
                  </span>
                </div>
                <span className="text-[10px] text-[#8A8C95]">
                  {format(new Date(message.createdAt || Date.now()), 'HH:mm')}
                </span>
              </div>
              
              {/* Unlock Card - Redesigned */}
              <div className="relative max-w-[437px] w-full mx-auto">
                <div className="relative rounded-[12px] overflow-hidden bg-gradient-to-br from-[#ff007f]/10 via-[#ff007f]/5 to-transparent border border-[#ff007f]/20">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff007f]/20 via-transparent to-transparent opacity-50" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-4 p-4">
                    {/* Unlock Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff007f] to-[#cc0066] flex items-center justify-center shadow-lg shadow-[#ff007f]/30">
                      <Icon.unlock className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Text and Price */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-white font-semibold text-[15px]">
                          Content Unlocked
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[#8A8C95] text-xs">for</span>
                          <span className="text-[#ff007f] font-bold text-[18px]">
                            ${Number(message.price).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#8A8C95] text-[11px] mt-0.5">
                        {isOwn 
                          ? 'You have successfully unlocked this content' 
                          : 'Your content has been unlocked'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff007f]/50 to-transparent" />
                </div>
              </div>
              
              {/* Status indicator for own messages */}
              {isOwn && (
                <div className="flex items-center justify-end gap-1 text-xs text-[#8A8C95]">
                  {message.status === 'failed' && onRetryMessage && (
                    <button
                      onClick={() => onRetryMessage(message._id)}
                      className="text-[#EF4444] hover:text-[#DC2626] text-[8px] underline mr-1"
                      type="button"
                    >
                      Retry
                    </button>
                  )}
                  <span
                    className={`${message.status === 'read'
                        ? 'text-[#FF007F]'
                        : message.status === 'delivered'
                          ? 'text-[#8A8C95]'
                          : message.status === 'sent'
                            ? 'text-[#6B7280]'
                            : message.status === 'sending'
                              ? 'text-[#9CA3AF] animate-pulse'
                              : message.status === 'failed'
                                ? 'text-[#EF4444]'
                                : 'text-[#6B7280]'
                      }`}
                  >
                    {message.status === 'read'
                      ? '✓✓'
                      : message.status === 'delivered'
                        ? '✓✓'
                        : message.status === 'sent'
                          ? '✓'
                          : message.status === 'sending'
                            ? '○'
                            : message.status === 'failed'
                              ? '✕'
                              : '✓'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-8">
              {message.text && (
                <div className="">
                  <p
                    className={cn(
                      'text-xs whitespace-pre-wrap',
                      emojiSizeClass
                    )}
                  >
                    {highlightText(message.text)}
                  </p>
                </div>
              )}

              {(message.type === 'media' || message.type === 'menu') &&
                mediaArray.length > 0 && (
                  <div className="mt-2">
                    {message.isPayable && !message.paid ? (
                      <MessageMediaPaid
                        media={mediaArray}
                        buyerId={user?.discordId}
                        sellerId={message.sender.discordId}
                        conversationId={message.conversation}
                        messageId={message._id}
                        price={message.price}
                      />
                    ) : (
                      <MessageMedia
                        media={mediaArray}
                        isLoading={message.status === 'sending'}
                      />
                    )}
                  </div>
                )}

              {message.type === 'in_message_media' && (
                <div className="mt-2">
                  <DMMenuPreview 
                    mediaArray={message.media} 
                    message={message}
                    onReloadMessages={onReloadMessages}
                    onSendUnlockMessage={onSendUnlockMessage}
                  />
                </div>
              )}

              {!isTipMessage && !isUnlockMessage && message.type !== 'call' && (
                <div className="flex items-center absolute bottom-0 right-0 gap-1 mt-1 text-xs text-[#8A8C95] justify-start">
                  {isOwn && (
                    <div className="flex items-center gap-1">
                      {message.status === 'failed' && onRetryMessage && (
                        <button
                          onClick={() => onRetryMessage(message._id)}
                          className="text-[#EF4444] hover:text-[#DC2626] text-[8px] underline mr-1"
                          type="button"
                        >
                          Retry
                        </button>
                      )}
                      <span
                        className={`${
                          message.status === 'read'
                            ? 'text-[#FF007F]'
                            : message.status === 'delivered'
                            ? 'text-[#8A8C95]'
                            : message.status === 'sent'
                            ? 'text-[#6B7280]'
                            : message.status === 'sending'
                            ? 'text-[#9CA3AF] animate-pulse'
                            : message.status === 'failed'
                            ? 'text-[#EF4444]'
                            : 'text-[#6B7280]'
                        }`}
                      >
                        {message.status === 'read' ? (
                          <span className="-space-x-2">
                            <span>✓</span>
                            <span>✓</span>
                          </span>
                        ) : message.status === 'delivered' ? (
                          <span className="-space-x-2">
                            <span>✓</span>
                            <span>✓</span>
                          </span>
                        ) : message.status === 'sent' ? (
                          '✓'
                        ) : message.status === 'sending' ? (
                          '○'
                        ) : message.status === 'failed' ? (
                          '✕'
                        ) : (
                          '✓'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {message.type === 'call' && message.callStatus && (
        <div className="my-5">
          <div
            className={cn(
              'w-full px-2.5 py-[2px] space-x-3 rounded-[7px] flex items-center',
              message?.callStatus === 'initiated' && 'bg-[#1A1C1F]',
              message?.callStatus === 'ongoing' && 'bg-[#152620]',
              message?.callStatus === 'ended' && 'bg-[#152620]',
              message?.callStatus === 'cancelled' && 'bg-[#1E1E21]'
            )}
          >
            <div className="space-x-1.5 flex items-center">
              <div className="p-[5.682px]">
                {message?.callStatus === 'initiated' && (
                  <Icon.phoneCall className="w-4 h-4" />
                )}
                {message?.callStatus === 'ongoing' && (
                  <Icon.callStarted className="" />
                )}
                {message?.callStatus === 'ended' && (
                  <Icon.callStarted className="" />
                )}
                {message?.callStatus === 'cancelled' && (
                  <Icon.callEnded className="" />
                )}
              </div>
              <span className="font-medium text-xs">
                {message.sender.displayName}
              </span>
              <span className="text-[10px]">
                {message?.callStatus === 'initiated' &&
                  `initiated a ${message.call} call`}
                {message?.callStatus === 'ongoing' &&
                  `started a ${message.call} call`}
                {message?.callStatus === 'ended' &&
                  message.durationInSeconds !== undefined &&
                  `${message?.call} call lasted ${Math.floor(
                    (Number(message?.durationInSeconds) || 0) / 60
                  )}m ${(Number(message?.durationInSeconds) || 0) % 60}s`}
                {message?.callStatus === 'ended' &&
                  message?.durationInSeconds === undefined &&
                  `ended the ${message?.call} call`}
                {message?.callStatus === 'cancelled' &&
                  `cancelled the ${message?.call} call`}
              </span>
            </div>
            <span className="text-[10px]">
              {format(new Date(message.createdAt), 'dd/MM/yy, HH:mm')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const MessageItem = React.memo(MessageItemComponent);
