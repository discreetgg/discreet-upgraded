'use client';

import { CallVideoReadyDialog } from '@/components/call-video-ready-dialog';
import { MessageChatList } from '@/components/message-chat-list';
import { MessageContainerHeader } from '@/components/message-container-header';
import { MessageFanInsightsContainer } from '@/components/message-fan-insights-container';
import { MessageInput } from '@/components/message-input';
import { MessageSearchContainer } from '@/components/message-search-container';
import { MessageSenderDetailsContainer } from '@/components/message-sender-details-container';
import { MessageSharedMediaContainer } from '@/components/message-shared-media-container';
import { NotesContainer } from '@/components/notes-container';
import { Icon } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useChat } from '@/hooks/use-chat';
import type { AuthorType } from '@/types/global';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chat = searchParams.get('chat');
  const callType = searchParams.get('call'); // 'video' or 'audio'
  const receiverIdParam = searchParams.get('receiver')?.trim() ?? '';
  const receiverDisplayNameParam =
    searchParams.get('displayName')?.trim() ?? '';
  const receiverUsernameParam = searchParams.get('username')?.trim() ?? '';
  const receiverAvatarParam = searchParams.get('discordAvatar')?.trim() ?? '';
  const receiverProfileImageParam =
    searchParams.get('profileImage')?.trim() ?? '';
  const receiverRoleParam = searchParams.get('role')?.trim() ?? '';

  const { receiver, setReceiver } = useMessage();
  const { user } = useGlobal();
  const [showCallDialog, setShowCallDialog] = useState(false);
  const fallbackReceiver = useMemo<AuthorType | null>(() => {
    if (chat !== 'new' || !receiverIdParam) {
      return null;
    }

    const displayName =
      receiverDisplayNameParam || receiverUsernameParam || 'New chat';
    const username = receiverUsernameParam || displayName;

    return {
      _id: receiverIdParam,
      discordId: receiverIdParam,
      displayName,
      discordAvatar: receiverAvatarParam,
      profileImage: receiverProfileImageParam
        ? {
            _id: `${receiverIdParam}-profile`,
            public_id: '',
            uploadedAt: '',
            url: receiverProfileImageParam,
          }
        : null,
      username,
      role: receiverRoleParam,
      takingCams: false,
    };
  }, [
    chat,
    receiverAvatarParam,
    receiverDisplayNameParam,
    receiverIdParam,
    receiverProfileImageParam,
    receiverRoleParam,
    receiverUsernameParam,
  ]);

  const activeReceiver = useMemo<AuthorType | null>(() => {
    const source = receiver ?? fallbackReceiver;
    if (!source) {
      return null;
    }

    return {
      _id:
        ('_id' in source && typeof source._id === 'string' && source._id) ||
        source.discordId,
      discordId: source.discordId,
      displayName: source.displayName || source.username || 'New chat',
      discordAvatar: source.discordAvatar || '',
      profileImage: source.profileImage ?? null,
      username: source.username || source.displayName || '',
      role: source.role || '',
      takingCams: source.takingCams ?? false,
    };
  }, [fallbackReceiver, receiver]);

  const isTemporaryConversationView =
    chat === 'new' && Boolean(activeReceiver?.discordId);

  useEffect(() => {
    if (chat === 'new' && !receiver && activeReceiver) {
      setReceiver(activeReceiver);
    }
  }, [activeReceiver, chat, receiver, setReceiver]);

  // Show call dialog when call query param is present and receiver is set
  useEffect(() => {
    if (callType && activeReceiver && chat === 'new') {
      setShowCallDialog(true);
    }
  }, [activeReceiver, callType, chat]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    handleMediaSelect,
    isLoading,
    retryMessage,
    markAsRead,
    reload,
  } = useChat(
    user,
    activeReceiver?.discordId ?? '',
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

  if (chat === 'new' && activeReceiver) {
    return (
      <div className="relative h-full min-h-0 flex gap-4 w-full min-w-0 overflow-hidden pt-4 md:pt-0">
        <section className="flex h-full min-h-0 w-full lg:w-[524px] flex-col mx-auto bg-[#111316]">
          <MessageContainerHeader receiver={activeReceiver} />
          <div
            ref={scrollContainerRef}
            className="flex-1 w-full overflow-y-scroll hidden_scrollbar"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Start a conversation with {activeReceiver.displayName}
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
                  scrollRootRef={scrollContainerRef}
                  conversationKey={`new:${activeReceiver.discordId}`}
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
              senderId={user?.discordId}
              receiverId={activeReceiver.discordId}
              receiverRole={activeReceiver.role}
            />
          </div>
        </section>
        <div className="hidden md:flex h-full min-h-0 w-[311px] min-w-[311px] flex-col gap-4">
          <MessageSearchContainer />
          <MessageSenderDetailsContainer />
          {user?.role === 'buyer' && (
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden hidden_scrollbar rounded-[14.41px] border border-[#73819712] bg-[#0F1114] py-3">
              <MessageSharedMediaContainer />
            </div>
          )}
          {user?.role === 'seller' && (
            <>
              <NotesContainer />
              <Tabs
                defaultValue="fan-insights"
                className="space-y-[31px] rounded-[14.41px] border border-[#73819712] bg-[#0F1114] px-4 py-3"
              >
                <TabsList className="!bg-transparent h-auto  p-0 -mb-[1px]">
                  <TabsTrigger
                    value="fan-insights"
                    className="!bg-transparent !border-0 text-xs"
                  >
                    Fan Insights
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="!bg-transparent !border-0 text-xs"
                  >
                    Media
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="fan-insights">
                  <MessageFanInsightsContainer />
                </TabsContent>
                <TabsContent value="media">
                  <MessageSharedMediaContainer showTitle={false} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Call Dialog - Auto-open when navigating from cams */}
        <CallVideoReadyDialog
          open={showCallDialog}
          onOpenChange={setShowCallDialog}
        >
          <div />
        </CallVideoReadyDialog>
      </div>
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
            <span>Your messages are protected in transit</span>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
