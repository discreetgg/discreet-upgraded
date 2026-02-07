'use client';

import type { MediaType, MessageType } from '@/types/global';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComponentLoader } from './ui/component-loader';
import { useParams } from 'next/navigation';
import { getConversationByIdService } from '@/lib/services';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsTab } from '@/hooks/settings/use-settings-tab';
import { useGlobal } from '@/context/global-context-provider';
import ViewImageModal from './miscellaneous/view-image-modal';
import { EmptyStates } from './ui/empty-states';
import { Icon } from './ui/icons';
import { Button } from './ui/button';
import { PlayIcon } from 'lucide-react';

const validTabs = ['all', 'images', 'videos'] as const;

export const MessageSharedMediaContainer = ({ showTitle = true }) => {
  const [{ tab: currentTab }, setCurrentTab] = useSettingsTab();

  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<MessageType[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await getConversationByIdService(conversationId)
        .then((response) => {
          setMessages(response);
        })
        .catch((error) => {
          setMessages(null);
          toast.error('Error fetching user data', {
            description: error?.message ?? 'Something went wrong.',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    })();
  }, [conversationId]);

  // Extract media from messages
  const { allMedia, imageMedia, videoMedia } = useMemo(() => {
    if (!messages) {
      return { allMedia: [], imageMedia: [], videoMedia: [] };
    }

    // Flatten all media from messages
    const all: MediaType[] = messages.flatMap((msg) =>
      msg.type === 'media' && msg.media?.length ? msg.media : []
    );

    const images = all.filter((m) => m.type === 'image');
    const videos = all.filter((m) => m.type === 'video');

    return { allMedia: all, imageMedia: images, videoMedia: videos };
  }, [messages]);

  if (loading) {
    return (
      <ComponentLoader className="flex items-center justify-center w-full" />
    );
  }

  const { user } = useGlobal();
  const isBuyer = user?.role === 'buyer';

  return (
    <Accordion
      type="single"
      defaultValue="item-1"
      className=" px-1.5"
      collapsible={!isBuyer}
    >
      <AccordionItem value="item-1">
        {showTitle && (
          <AccordionTrigger className="py-0 hover:no-underline">
            Shared Media
          </AccordionTrigger>
        )}

        <AccordionContent className="space-y-3 pt-3">
          <Tabs
            value={currentTab}
            onValueChange={(value) => {
              setCurrentTab({
                tab: validTabs.includes(value as (typeof validTabs)[number])
                  ? value
                  : 'all',
              });
            }}
          >
            <TabsList className="bg-transparent p-0 -mb-[1px] gap-2  ">
              <TabsTrigger
                value="all"
                className="text-xs text-[#D4D4D8]  font-medium data-[state=active]:rounded-[8.492px] data-[state=active]:px-3 px-0  py-1 h-auto border-none data-[state=active]:bg-[#2E2E32]"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="images"
                className="text-xs text-[#D4D4D8] w-max font-medium data-[state=active]:rounded-[8.492px] data-[state=active]:px-3 px-0 py-1 h-auto border-none data-[state=active]:bg-[#2E2E32]"
              >
                {imageMedia.length} Image{imageMedia.length > 1 ? 's' : ''}
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="text-xs text-[#D4D4D8] w-max font-medium data-[state=active]:rounded-[8.492px] data-[state=active]:px-3 px-0 py-1 h-auto border-none data-[state=active]:bg-[#2E2E32]"
              >
                {videoMedia.length} Video{videoMedia.length > 1 ? 's' : ''}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {allMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3  gap-1">
                  {allMedia.map((m) => (
                    <MediaPreview media={m} key={m._id} />
                  ))}
                </div>
              ) : (
                <EmptyStates className="mt-10">
                  <EmptyStates.Icon icon={Icon.image}>
                    No shared media
                  </EmptyStates.Icon>
                </EmptyStates>
              )}
            </TabsContent>
            <TabsContent value="images">
              {imageMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3  gap-1">
                  {imageMedia.map((m) => (
                    <MediaPreview media={m} key={m._id} />
                  ))}
                </div>
              ) : (
                <EmptyStates className="mt-10">
                  <EmptyStates.Icon icon={Icon.image}>
                    No image found
                  </EmptyStates.Icon>
                </EmptyStates>
              )}
            </TabsContent>
            <TabsContent value="videos">
              {videoMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3  gap-1">
                  {videoMedia.map((m) => (
                    <MediaPreview media={m} key={m._id} />
                  ))}
                </div>
              ) : (
                <EmptyStates className="mt-10">
                  <EmptyStates.Icon icon={Icon.image}>
                    No video found
                  </EmptyStates.Icon>
                </EmptyStates>
              )}
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const MediaPreview = ({ media }: { media: MediaType }) => {
  const [playingVideos, setPlayingVideos] = useState<{
    [key: string]: boolean;
  }>({});
  const [videoDurations, setVideoDurations] = useState<{
    [key: string]: number;
  }>({});
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = useCallback(
    (videoId: string, event: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = event.target as HTMLVideoElement;
      setVideoDurations((prev) => ({
        ...prev,
        [videoId]: video.duration,
      }));
    },
    []
  );

  const handleVideoPlay = (videoId: string, videoElement: HTMLVideoElement) => {
    if (playingVideos[videoId]) {
      videoElement.pause();
      setPlayingVideos((prev) => ({ ...prev, [videoId]: false }));
    } else {
      videoElement.play();
      setPlayingVideos((prev) => ({ ...prev, [videoId]: true }));
    }
  };

  if (media.type === 'image') {
    return (
      <ViewImageModal
        key={media._id}
        image={media.url}
        containerClassName="size-[76.752px]"
      />
    );
  }

  if (media.type === 'video') {
    return (
      <>
        <video
          src={media.url}
          className="w-full h-full object-cover"
          loop
          muted
          id={`video-${media._id}`}
          onLoadedMetadata={(e) => handleLoadedMetadata(String(media._id), e)}
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute inset-0 w-full h-full flex items-center justify-center ${
            playingVideos[media._id]
              ? 'opacity-0 group-hover:opacity-100 transition-opacity'
              : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            const video = document.getElementById(
              `video-${media._id}`
            ) as HTMLVideoElement;
            handleVideoPlay(String(media._id), video);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
            <PlayIcon
              className={`w-5 h-5 text-white ${
                playingVideos[media._id] ? 'hidden' : ''
              }`}
            />
            <Icon.pause
              className={`w-5 h-5 text-white ${
                playingVideos[media._id] ? '' : 'hidden'
              }`}
            />
          </div>
        </Button>
        {videoDurations[media._id] && (
          <div
            data-is-playing={playingVideos[media._id]}
            className="absolute data-[is-playing=true]:opacity-0 transition-opacity  bottom-2 left-2 px-2 py-1 rounded text-white text-xs flex items-center gap-x-1"
          >
            <Icon.videoIcon className="w-4 h-4 mr-1" />
            {formatDuration(videoDurations[media._id])}
          </div>
        )}
      </>
    );
  }

  return null;
};
