'use client';

import { Input } from './ui/input';
import { useMessageSearch } from '@/context/message-search-context';
import { cn } from '@/lib/utils';
import { Icon } from './ui/icons';

export const MessageSearchContainer = () => {
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
  const currentMatchDisplay = currentMatchIndex >= 0 ? currentMatchIndex + 1 : 1;

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      setIsSearchActive(true);
    } else {
      setIsSearchActive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Auto-search as user types (debounced effect can be added if needed)
    if (value.trim()) {
      setIsSearchActive(true);
    } else {
      setIsSearchActive(false);
    }
  };

  return (
    <div className='relative transition-all duration-300 w-full group'>
      <Input
        value={searchValue}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        placeholder='Search'
        className={cn(
          'rounded-full h-auto w-full group-hover:border text-sm pr-20 border',
          isSearchActive && 'ring-2 ring-yellow-400/50'
        )}
      />

      {/* Search results counter */}
      {isSearchActive && hasMatches && (
        <div className='absolute top-1/2 -translate-y-1/2 right-4 text-[10px] text-muted-foreground'>
          {currentMatchDisplay} / {matchingMessageIds.length}
        </div>
      )}

      {/* Navigation arrows */}
      {isSearchActive && hasMatches && (
        <>
          <button
            type='button'
            className='p-1 absolute top-1/2 -translate-y-1/2 right-14 hover:text-yellow-400 disabled:opacity-50'
            onClick={navigateToPreviousMatch}
            disabled={matchingMessageIds.length <= 1}
            title='Previous match'
          >
            <Icon.arrowUp className='size-3 rotate-180' />
          </button>
          <button
            type='button'
            className='p-1 absolute top-1/2 -translate-y-1/2 right-10 hover:text-yellow-400 disabled:opacity-50'
            onClick={navigateToNextMatch}
            disabled={matchingMessageIds.length <= 1}
            title='Next match'
          >
            <Icon.arrowUp className='size-3' />
          </button>
        </>
      )}

      {searchValue && (
        <button
          type='button'
          className='p-2.5 absolute top-1/2 -translate-y-1/2 !right-18 hover:text-red-400'
          onClick={clearSearch}
          title='Clear search'
          style={{
            right: isSearchActive && hasMatches ? '4rem' : '1.5rem',
          }}
        >
          <Icon.close className='size-3' />
        </button>
      )}

      <button
        type='button'
        className={cn('p-2.5 absolute top-1/2 -translate-y-1/2 right-2')}
        onClick={handleSearchSubmit}
        title={isSearchActive ? 'Search active' : 'Search'}
        style={{
          right: searchValue
            ? isSearchActive && hasMatches
              ? '6rem'
              : '2.5rem'
            : '0.5rem',
        }}
      >
        <Icon.search
          className={cn(
            'transition-colors',
            (isSearchActive || searchValue) && 'text-yellow-400'
          )}
        />
      </button>
    </div>
  );
};
