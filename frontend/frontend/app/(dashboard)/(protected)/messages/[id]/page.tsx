'use client';

import { MessageContainer } from '@/components/message-container';
import { MessageSenderDetailsContainer } from '@/components/message-sender-details-container';
import { MessageSharedMediaContainer } from '@/components/message-shared-media-container';
import { useGlobal } from '@/context/global-context-provider';
import { useMessage } from '@/context/message-context';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageFanInsightsContainer } from '@/components/message-fan-insights-container';
import { MessageSearchContainer } from '@/components/message-search-container';
import { useEffect, useMemo } from 'react';
import { NotesContainer } from '@/components/notes-container';
import type { AuthorType } from '@/types/global';
import { TabLoadingSkeleton } from '@/components/tab-loading-skeleton';

const ConversationPage = () => {
  const { user } = useGlobal();
  const { receiver, setReceiver, conversations, clearUnreadCount } = useMessage();

  const params = useParams();
  const conversationId = params.id as string;
  const isConversationListLoading = conversations === null;
  const inferredReceiver = useMemo(() => {
    if (!conversations?.length || !conversationId) return null;

    const conversation = conversations.find((item) => item._id === conversationId);
    if (!conversation) return null;

    return (
      conversation.participants.find(
        (participant) => participant.discordId !== user?.discordId
      ) ?? null
    );
  }, [conversations, conversationId, user?.discordId]);
  const activeReceiver = receiver ?? inferredReceiver;

  useEffect(() => {
    if (!receiver && inferredReceiver) {
      setReceiver(inferredReceiver);
    }
  }, [receiver, inferredReceiver, setReceiver]);

  // Clear unread count when viewing a conversation
  useEffect(() => {
    if (conversationId) {
      clearUnreadCount(conversationId);
    }
  }, [conversationId, clearUnreadCount]);

  if (isConversationListLoading && !activeReceiver) {
    return <TabLoadingSkeleton className="pt-4 md:pt-6" variant="list" />;
  }

  if (!activeReceiver) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No participant found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 flex gap-4 w-full min-w-0 overflow-hidden pt-4 md:pt-0">
      <MessageContainer
        sender={{
          _id: user?.discordId ?? '',
          discordId: user?.discordId ?? '',
          displayName: user?.displayName ?? '',
          discordAvatar: user?.discordAvatar ?? '',
          profileImage: user?.profileImage ?? null,
          username: user?.username ?? '',
          role: user?.role ?? '',
          takingCams: user?.takingCams ?? false,
        }}
        receiver={
          activeReceiver && '_id' in activeReceiver
            ? (activeReceiver as AuthorType)
            : ({
                _id: activeReceiver?.discordId ?? '',
                discordId: activeReceiver?.discordId ?? '',
                displayName: activeReceiver?.displayName ?? '',
                discordAvatar: activeReceiver?.discordAvatar ?? '',
                profileImage: activeReceiver?.profileImage ?? null,
                username: activeReceiver?.username ?? '',
                role: activeReceiver?.role ?? '',
                takingCams: activeReceiver?.takingCams ?? false,
              } as AuthorType)
        }
        conversationId={conversationId}
      />
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
    </div>
  );
};

export default ConversationPage;
