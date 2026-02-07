"use client";
import { useMemo, Suspense } from "react";
import { ServerDetails } from "./";
import { useEffect, useState } from "react";
import type { ServerType } from "@/types/server";
import { SubmitServerDialog } from "./submit-sever-dialog";
import { ComponentLoader } from "../ui/component-loader";
import { EmptyStates } from "../ui/empty-states";
import { Icon } from "../ui/icons";
import { useSearchParams } from "next/navigation";
import { useInfiniteServers } from "@/hooks/server/use-infinite-servers";

function ServerDashboard() {
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");
  const periodQuery = searchParams.get("period");
  const searchQuery = searchParams.get("q");
  const languageQuery = searchParams.get("language");

  const tags = useMemo(
    () => (tabQuery && tabQuery !== "all" ? [tabQuery] : undefined),
    [tabQuery]
  );

  const searchParam = useMemo(() => searchQuery || undefined, [searchQuery]);

  const {
    servers,
    isLoading,
    hasNextPage,
    loadServers,
    loadMoreServers,
    refreshServers,
  } = useInfiniteServers({
    limit: 12,
    tags,
    search: searchParam,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerType | null>(null);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    loadServers();
  }, [loadServers, tags, searchParam, shouldRefresh]);

  // Apply period and language filtering on the client side
  const filteredServers = useMemo(() => {
    let filteredServers = [...servers];

    // Apply language filtering
    if (languageQuery && languageQuery !== "Server Language") {
      const languageKeywords = {
        English: ["english", "en", "eng"],
        French: ["french", "fr", "français"],
        German: ["german", "de", "deutsch"],
        Spanish: ["spanish", "es", "español"],
      };

      const keywords =
        languageKeywords[languageQuery as keyof typeof languageKeywords] || [];

      filteredServers = filteredServers.filter((server) => {
        const searchText = `${server.name} ${server.bio}`.toLowerCase();
        return keywords.some((keyword) =>
          searchText.includes(keyword.toLowerCase())
        );
      });
    }

    // Apply period filtering
    if (periodQuery && periodQuery !== "all") {
      filteredServers.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.updatedAt || "").getTime();
        const bDate = new Date(b.createdAt || b.updatedAt || "").getTime();

        if (periodQuery === "new") {
          return bDate - aDate; // Newest first
        } else if (periodQuery === "old") {
          return aDate - bDate; // Oldest first
        }

        return 0;
      });
    }

    if (tabQuery && tabQuery !== "all") {
      filteredServers = filteredServers.filter((server) =>
        server.tags.includes(tabQuery)
      );
    }

    return filteredServers;
  }, [servers, languageQuery, periodQuery, tabQuery]);

  return (
    <div className="space-y-4.5 font-inter pb-10">
      <div className="sticky top-0 z-10 bg-[#0F1114]"></div>

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
      {!isLoading && filteredServers?.length === 0 ? (
        <div className="py-20 absolute top-0 left-0 right-0 bottom-0">
          <EmptyStates className="py-20">
            <EmptyStates.Icon icon={Icon.elementEqual}>
              {searchQuery ||
              languageQuery !== "Server Language" ||
              (tabQuery && tabQuery !== "all") ||
              (periodQuery && periodQuery !== "all")
                ? "No servers found matching your filters. Try adjusting your search or filter criteria."
                : "No servers found. Start by adding your first server to get started."}
            </EmptyStates.Icon>
          </EmptyStates>
          <div className="flex justify-center mt-6">
            {/* <EmptyStates.Button
              icon={Icon.add}
              onClick={() => setEditOpen(true)}
            >
              Add Server
            </EmptyStates.Button> */}
          </div>
        </div>
      ) : (
        <div className="flex gap-4.5 justify-start flex-wrap">
          {filteredServers?.map((srv) => (
            <ServerDetails
              key={srv.id}
              server={
                {
                  id: srv.id,
                  name: srv.name,
                  bio: srv.bio,
                  members: [],
                  creatorId: srv.creator.discordId ?? "",
                  link: srv.link,
                  tags: srv.tags,
                  username: srv.creator.username,
                  likesCount: srv.likesCount,
                  totalMemberCount: srv.totalMemberCount,
                  activeMemberCount: srv.activeMemberCount,
                } as ServerType
              }
              onEdit={(server) => {
                setEditingServer(server);
                setEditOpen(true);
              }}
              onDelete={() => {
                setShouldRefresh(true);
                setTimeout(() => setShouldRefresh(false), 100);
              }}
            />
          ))}
        </div>
      )}
      {hasNextPage && (
        <div className="fixed bottom-0 left-0 right-0 top-0 flex justify-center items-center">
          <ComponentLoader />
        </div>
      )}
    </div>
  );
}

export default ServerDashboard;
