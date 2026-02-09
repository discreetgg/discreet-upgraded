'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { useMessageSearch } from '@/context/message-search-context';
import { cn } from '@/lib/utils';
import { Icon } from './ui/icons';

export const MessageSearchHeader = ({
  isExpanded,
  onExpandedChange
}: {
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
} = {}) => {
  const {
    searchValue,
    setSearchValue,
    isSearchActive,
    setIsSearchActive,
    clearSearch,
    matchingMessageIds,
    currentMatchIndex,
    navigateToNextMatch,
    navigateToPreviousMatch,
    hasMatches,
  } = useMessageSearch();

  const [internalExpanded, setInternalExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentMatchDisplay = currentMatchIndex >= 0 ? currentMatchIndex + 1 : 1;
  
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
    if (!searchValue && !isSearchActive) {
      setExpanded(false);
    }
  }, [searchValue, isSearchActive]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (value.trim()) {
      setIsSearchActive(true);
    } else {
      setIsSearchActive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
      setExpanded(false);
      inputRef.current?.blur();
    }
  };

  const handleExpand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    clearSearch();
    setExpanded(false);
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        expanded ? 'w-full' : 'w-full'
      )}
    >
      {!expanded && (
        <button
          type="button"
          onClick={handleExpand}
          className="p-2 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200 active:scale-95"
          aria-label="Search messages"
        >
          <Icon.search className="size-5 text-[#A1A1AA]" />
        </button>
      )}

      {expanded && (
        <div className="relative w-full h-full">
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search messages"
            className={cn(
              'w-full rounded-[60px] focus:bg-[#3C3C42] text-sm text-[#F8F8F8] px-4 py-2 h-auto border-0 bg-[#1A1C1F]',
              isSearchActive && hasMatches ? '' : ''
            )}
          />

          {/* Search results counter - shown when search is active and has matches */}
          {isSearchActive && hasMatches && (
            <div className="absolute top-1/2 -translate-y-1/2 right-16 text-[10px] text-muted-foreground whitespace-nowrap">
              {currentMatchDisplay} / {matchingMessageIds.length}
            </div>
          )}

          {/* Navigation arrows - shown when search is active and has matches */}
          {isSearchActive && hasMatches && (
            <div className="absolute top-1/2 -translate-y-1/2 right-8 flex items-center gap-1">
              <button
                type="button"
                className="p-1 hover:text-yellow-400 disabled:opacity-50 transition-colors"
                onClick={navigateToPreviousMatch}
                disabled={matchingMessageIds.length <= 1}
                title="Previous match"
              >
                <Icon.arrowUp className="size-3 rotate-180" />
              </button>
              <button
                type="button"
                className="p-1 hover:text-yellow-400 disabled:opacity-50 transition-colors"
                onClick={navigateToNextMatch}
                disabled={matchingMessageIds.length <= 1}
                title="Next match"
              >
                <Icon.arrowUp className="size-3" />
              </button>
            </div>
          )}

          {/* Clear button - always visible when expanded */}
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 right-2 p-1 hover:bg-[#1A1C1F] rounded-lg transition-all duration-200"
            onClick={handleClear}
            aria-label="Close search"
          >
            <Icon.close className="size-4 text-[#A1A1AA]" />
          </button>
        </div>
      )}
    </div>
  );
};
