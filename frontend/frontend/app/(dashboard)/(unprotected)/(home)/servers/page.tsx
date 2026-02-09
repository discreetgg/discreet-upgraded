"use client";

import { ServerDetails, SubmitServerDialog } from "@/components/server";
import { ComponentLoader } from "@/components/ui/component-loader";
import { EmptyStates } from "@/components/ui/empty-states";
import { Icon } from "@/components/ui/icons";
import { useInfiniteServers } from "@/hooks/server/use-infinite-servers";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { ServerType } from "@/types/server";
import { useEffect, useRef, useState } from "react";
import { TabLoadingSkeleton } from "@/components/tab-loading-skeleton";

const Page = () => {
  const {
    servers,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadServers,
    loadMoreServers,
    refreshServers,
  } = useInfiniteServers({
    limit: 12,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerType | null>(null);
  const hasLoadedInitialServersRef = useRef(false);

  useEffect(() => {
    if (hasLoadedInitialServersRef.current) {
      return;
    }

    hasLoadedInitialServersRef.current = true;
    loadServers({ nextPage: 1, append: false });
  }, [loadServers]);

  const loadMoreTriggerRef = useIntersectionObserver({
    onIntersect: loadMoreServers,
    threshold: 0.1,
    rootMargin: "240px",
    enabled: hasNextPage && !isLoadingMore && !isLoading,
  });

  if (isLoading) {
    return <TabLoadingSkeleton variant="list" />;
  }
  return (
    <div className="space-y-4.5 w-full">
      <SubmitServerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        serverId={editingServer?.id}
        initialValues={{
          name: editingServer?.name,
          link: editingServer?.link,
          bio: editingServer?.bio,
          tags: editingServer?.tags,
        }}
        refreshServers={refreshServers}
      >
        <span />
      </SubmitServerDialog>
      {servers.length === 0 && (
        <div className="flex justify-center py-8 w-full">
          <EmptyStates className="py-20">
            <EmptyStates.Icon icon={Icon.elementEqual}>
              No servers found. Start by adding your first server to get
              started.
            </EmptyStates.Icon>
          </EmptyStates>
        </div>
      )}
      {servers?.map((srv) => (
        <ServerDetails
          key={srv.id}
          className="!w-full"
          server={
            {
              id: srv.id,
              name: srv.name,
              bio: srv.bio,
              members: [],
              creatorId: srv.creator.discordId ?? "",
              creatorDiscordAvatar: srv.creator.discordAvatar,
              creatorDisplayName: srv.creator.displayName,
              creatorProfileImage: srv.creator.profileImage?.url,
              link: srv.link,
              tags: srv.tags,
              username: srv.creator.username,
              likesCount: srv.likesCount,
            } as ServerType
          }
          onEdit={(server) => {
            setEditingServer(server);
            setEditOpen(true);
          }}
          onDelete={() => {
            refreshServers();
          }}
        />
      ))}
      {hasNextPage && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isLoadingMore && <ComponentLoader />}
        </div>
      )}
    </div>
  );
};

export default Page;
