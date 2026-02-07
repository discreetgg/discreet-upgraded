'use client';

import { useGlobal } from '@/context/global-context-provider';
import { MessageSearchContainer } from '@/components/message-search-container';
import { MessageSenderDetailsContainer } from '@/components/message-sender-details-container';
import { MessageSharedMediaContainer } from '@/components/message-shared-media-container';
import { MessageFanInsightsContainer } from '@/components/message-fan-insights-container';
import { NotesContainer } from '@/components/notes-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SheetClose } from '@/components/ui/sheet';
import { Icon } from '@/components/ui/icons';

export function MessageDetailsSheet() {
  const { user } = useGlobal();

  return (
    <div className="h-full ">
      <div className="sticky top-0 z-10 bg-background border-b border-[#1E2227] px-6 py-4">
        <div className="flex items-center gap-3">
          <SheetClose asChild>
            <button
              type="button"
              className="p-2 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200 active:scale-95"
              aria-label="Close details"
            >
              <Icon.arrowLeft className="size-5 text-[#A1A1AA]" />
            </button>
          </SheetClose>
          <h2 className="text-lg font-semibold">Details</h2>
        </div>
      </div>
      <div className="space-y-4 px-6 py-4 ">
        <MessageSenderDetailsContainer />
        {user?.role === 'buyer' && <MessageSharedMediaContainer />}
        {user?.role === 'seller' && (
          <>
            <NotesContainer />
            <Tabs
              defaultValue="fan-insights"
              className="space-y-[31px] rounded-[14.41px] border border-[#73819712] bg-[#0F1114] px-4 py-3"
            >
              <TabsList className="!bg-transparent h-auto p-0 -mb-[1px]">
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
}
