"use client";

import { Search, Loader2, X, TrendingUp, Clock } from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Server } from "@/types/server";
import { serverService } from "@/lib/server-service";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import { usePathname, useSearchParams } from "next/navigation";
import { pushUrl } from "@/lib/utils";
import { Icon } from "../ui/icons";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: Server) => void;
  syncQueryParam?: boolean;
}

export function ServerSearch({
  placeholder = "Search...",
  className,
  onResultSelect,
  syncQueryParam,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Server[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is the watcher in the shadows 👀
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setOpen(false); // Close modal if clicked outside
      }
    }

    // Attach event when modal is open
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up, like a true mastermind erasing traces
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("discreet-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (query.length > 0) return;

    setResults([]);
    setSuggestions([]);
  }, [query]);
  // Save recent search
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("discreet-recent-searches", JSON.stringify(updated));
  };

  const syncQueryToUrl = useCallback(
    (value: string) => {
      if (!syncQueryParam) return;

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.delete("tab");

      if (value && value.trim().length > 0) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }

      const url = `${pathname}?${params.toString()}`;
      pushUrl(url, router);
    },
    [pathname, router, searchParams, syncQueryParam]
  );

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!results.length && searchQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    if (searchQuery.length < 2) return;
    setLoading(true);

    try {
      const servers = await serverService.searchServers(searchQuery);
      setResults(Array.isArray(servers) ? servers : []);
      setSuggestions([]);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(value);
      syncQueryToUrl(value);
    }, 400);
  };

  // Handle result selection
  const handleResultSelect = (result: Server) => {
    saveRecentSearch(query);
    setOpen(false);
    setTimeout(() => setQuery(""), 500);

    if (onResultSelect) {
      onResultSelect(result);
      return;
    }
    if (result.link) {
      window.open(result.link, "_blank");
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
    syncQueryToUrl(suggestion);
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
    syncQueryToUrl(recentQuery);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("discreet-recent-searches");
  };

  const showPlaceholder =
    !query.length &&
    !results.length &&
    !suggestions.length &&
    !recentSearches.length;

  return (
    <div
      ref={searchContainerRef}
      className={cn("w-full max-w-[380px] relative", className)}
    >
      <div className="relative">
        <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          className="border border-border p-0 h-12 px-8 text-sm focus-visible:ring-1 rounded-full"
        />
        <Button
          data-clear={query.length > 0}
          className="absolute right-0 hidden data-[clear=true]:flex top-1/2 -translate-y-1/2 text-accent-text"
          onClick={() => {
            setQuery("");
            syncQueryToUrl("");
          }}
          variant="ghost"
        >
          <Icon.close />
        </Button>
      </div>

      {open && (
        <div className="h-96 lg:h-[588px] overflow-y-auto absolute bg-primary w-full mt-2 rounded-xl border shadow-2xl z-[9999]">
          {showPlaceholder && (
            <div className="size-full items-center justify-center flex text-accent-text">
              Search results appears here
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2">
              <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <div
                  key={index}
                  onClick={() => handleRecentSearchSelect(recentQuery)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRecentSearchSelect(recentQuery);
                    }
                  }}
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
                >
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">{recentQuery}</span>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-muted-foreground mt-2 w-full justify-start"
              >
                <X className="mr-2 h-4 w-4" />
                Clear recent searches
              </Button>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Searching...
              </span>
            </div>
          )}
          {!loading && query.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSuggestionSelect(suggestion)
                  }
                  className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
                >
                  <TrendingUp className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <>
              {query.length > 0 && results.length > 0 && (
                <div className="p-2">
                  <p className="text-muted-foreground mb-2 px-2 text-xs font-inter ">
                    Servers
                  </p>
                  {results.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() =>
                        srv.link && window.open(srv.link, "_blank")
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        srv.link &&
                        window.open(srv.link, "_blank")
                      }
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-x-4  p-2 bg-primary border rounded-xl"
                    >
                      <div className="flex flex-col w-full">
                        <div className="flex items-center  font-inter justify-between">
                          <span className="truncate text-[15px] font-medium">
                            {srv.name}
                          </span>
                          <span className="text-xs text-accent-text">
                            {new Date(
                              srv.updatedAt || srv.createdAt || ""
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate text-sm text-accent-text">
                          {srv.bio}
                        </div>
                        {srv.tags?.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {srv.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[11px] text-[#8A8C95] bg-white/5 rounded px-2 py-1"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.length > 10 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    See all results for "{query}"
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading &&
            query.length >= 2 &&
            results.length === 0 &&
            suggestions.length === 0 && (
              <div className="p-4 text-center">
                <Search className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No results found for "
                  <span className="text-off-white">{query}</span>"
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Try different keywords or check spelling
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
