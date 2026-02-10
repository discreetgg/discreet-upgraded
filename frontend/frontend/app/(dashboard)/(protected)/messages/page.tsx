'use client';

import { MessageChatList } from '@/components/message-chat-list';
import { MessageContainerHeader } from '@/components/message-container-header';
import { MessageInput } from '@/components/message-input';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useChat } from '@/hooks/use-chat';
import type { AuthorType } from '@/types/global';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CallVideoReadyDialog } from '@/components/call-video-ready-dialog';
import { Icon } from '@/components/ui/icons';
import { useRouter } from 'next/navigation';

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chat = searchParams.get('chat');
  const callType = searchParams.get('call'); // 'video' or 'audio'

  const { receiver } = useMessage();
  const { user } = useGlobal();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const isTemporaryConversationView = chat === 'new' && Boolean(receiver);

  // Show call dialog when call query param is present and receiver is set
  useEffect(() => {
    if (callType && receiver && chat === 'new') {
      setShowCallDialog(true);
    }
  }, [callType, receiver, chat]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleMediaSelect,
    isLoading,
    retryMessage,
    markAsRead,
    sendUnlockMessage,
    reload,
  } = useChat(
    user,
    receiver?.discordId ?? '',
    undefined,
    true,
    isTemporaryConversationView,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat && chat !== 'new') {
      router.replace(`/messages/${chat}`);
    }
  }, [chat, router]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  if (chat === 'new' && receiver) {
    return (
      <section className="flex h-full w-full max-w-[640px] flex-col mx-auto">
        <MessageContainerHeader receiver={receiver as AuthorType} />
        <div
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-scroll hidden_scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Start a conversation with {receiver?.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Send a message to create this conversation
                </p>
              </div>
            </div>
          ) : (
            <>
              <MessageChatList
                messages={messages}
                currentUserId={user?.discordId ?? ''}
                onRetryMessage={retryMessage}
                onMarkAsRead={markAsRead}
                onReloadMessages={reload}
                onSendUnlockMessage={sendUnlockMessage}
                scrollRootRef={scrollContainerRef}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        <div className="w-full p-2">
          <MessageInput
            className="w-full"
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onMediaSelect={handleMediaSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Call Dialog - Auto-open when navigating from cams */}
        <CallVideoReadyDialog
          open={showCallDialog}
          onOpenChange={setShowCallDialog}
        >
          <div />
        </CallVideoReadyDialog>
      </section>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl bg-[#24272c]/40 flex flex-col items-center justify-center p-8 text-center">
      {chat && chat !== 'new' ? (
        <p className="text-muted-foreground">Opening conversation...</p>
      ) : chat === 'new' ? (
        <p className="text-muted-foreground">Starting a new chat...</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6 max-w-md">
            <Icon.messages className="w-24 h-24 text-zinc-600" />
            <div className="space-y-2">
              <h2 className="text-2xl font-light text-foreground">
                Discreet for Web
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send & receive messages, purchase menus, and chat privately.
              </p>
            </div>
          </div>

          <div className="absolute bottom-10 flex items-center gap-2 text-[#71717A] text-xs">
            <Icon.lock className="w-3 h-3" />
            <span>Your personal messages are end-to-end encrypted</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
