'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

interface MessageSearchContextValue {
  searchValue: string;
  setSearchValue: (value: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  highlightText: (text: string) => ReactNode;
  clearSearch: () => void;
  matchingMessageIds: string[];
  setMatchingMessageIds: (ids: string[]) => void;
  currentMatchIndex: number;
  setCurrentMatchIndex: (index: number) => void;
  navigateToNextMatch: () => void;
  navigateToPreviousMatch: () => void;
  hasMatches: boolean;
}

const MessageSearchContext = createContext<MessageSearchContextValue | null>(
  null
);

export const MessageSearchProvider = ({
  children,
}: { children: ReactNode }) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [matchingMessageIds, setMatchingMessageIds] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const hasMatches = matchingMessageIds.length > 0;

  useEffect(() => {
    if (matchingMessageIds.length === 0) {
      if (currentMatchIndex !== -1) {
        setCurrentMatchIndex(-1);
      }
      return;
    }

    if (
      currentMatchIndex < 0 ||
      currentMatchIndex >= matchingMessageIds.length
    ) {
      setCurrentMatchIndex(0);
    }
  }, [matchingMessageIds.length, currentMatchIndex]);

  const navigateToNextMatch = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  }, [matchingMessageIds.length]);

  const navigateToPreviousMatch = useCallback(() => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => {
      if (prev <= 0) return matchingMessageIds.length - 1;
      return prev - 1;
    });
  }, [matchingMessageIds.length]);

  const highlightText = useMemo(() => {
    return (text: string): ReactNode => {
      if (!text) return text;
      if (!searchValue) return text;

      const searchTerm = searchValue.trim();
      if (!searchTerm) return text;

      // Create a case-insensitive regex with global flag
      const regex = new RegExp(
        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'gi'
      );
      const parts = text.split(regex);

      return parts.map((part, partIndex) => {
        // Check if this part matches the search term (case-insensitive)
        if (part && part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark
              key={partIndex}
              className='bg-yellow-400/80 text-black font-medium px-1 py-0.5 rounded-sm shadow-sm'
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    };
  }, [searchValue]);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setIsSearchActive(false);
    setMatchingMessageIds([]);
    setCurrentMatchIndex(-1);
  }, []);

  const value = useMemo(
    () => ({
      searchValue,
      setSearchValue,
      isSearchActive,
      setIsSearchActive,
      highlightText,
      clearSearch,
      matchingMessageIds,
      setMatchingMessageIds,
      currentMatchIndex,
      setCurrentMatchIndex,
      navigateToNextMatch,
      navigateToPreviousMatch,
      hasMatches,
    }),
    [
      searchValue,
      isSearchActive,
      highlightText,
      clearSearch,
      matchingMessageIds,
      currentMatchIndex,
      navigateToNextMatch,
      navigateToPreviousMatch,
      hasMatches,
    ]
  );

  return (
    <MessageSearchContext.Provider value={value}>
      {children}
    </MessageSearchContext.Provider>
  );
};

export const useMessageSearch = () => {
  const context = useContext(MessageSearchContext);
  if (!context) {
    throw new Error(
      'useMessageSearch must be used within a MessageSearchProvider'
    );
  }
  return context;
};
