/**
 * Custom hook for chat search functionality
 * Extracts search logic from ChatScreen to reduce file size
 */

import { useEffect, useCallback } from 'react';

export const useChatSearch = ({
  searchQuery,
  messages,
  searchResults,
  setSearchResults,
  setCurrentSearchIndex,
  currentSearchIndex,
  flatListRef,
  setShowSearchBar,
  setSearchQuery,
}) => {
  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => {
        if (msg.isDeleted) return false;
        
        let messageText = '';
        if (typeof msg.message === 'string') {
          try {
            const parsed = JSON.parse(msg.message);
            if (parsed && parsed.type === 'file') {
              messageText = parsed.fileName || parsed.name || '';
            } else {
              messageText = msg.message;
            }
          } catch {
            messageText = msg.message;
          }
        } else {
          messageText = msg.message?.message || msg.message?.text || String(msg.message || '');
        }
        
        return messageText.toLowerCase().includes(query);
      });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchQuery, messages, setSearchResults, setCurrentSearchIndex]);

  // Navigate to search result
  const scrollToSearchResult = useCallback((index) => {
    if (searchResults.length === 0 || index < 0 || index >= searchResults.length) return;
    
    const { index: messageIndex } = searchResults[index];
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: messageIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current?.scrollToOffset({
          offset: messageIndex * 100, // Approximate height per message
          animated: true,
        });
      }
    }, 100);
  }, [searchResults, flatListRef]);

  const handleSearchNext = useCallback(() => {
    if (currentSearchIndex < searchResults.length - 1) {
      const nextIndex = currentSearchIndex + 1;
      setCurrentSearchIndex(nextIndex);
      scrollToSearchResult(nextIndex);
    }
  }, [currentSearchIndex, searchResults, scrollToSearchResult, setCurrentSearchIndex]);

  const handleSearchPrevious = useCallback(() => {
    if (currentSearchIndex > 0) {
      const prevIndex = currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToSearchResult(prevIndex);
    }
  }, [currentSearchIndex, scrollToSearchResult, setCurrentSearchIndex]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (text.trim()) {
      setShowSearchBar(true);
    }
  }, [setSearchQuery, setShowSearchBar]);

  const handleSearchClose = useCallback(() => {
    setSearchQuery('');
    setShowSearchBar(false);
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, [setSearchQuery, setShowSearchBar, setSearchResults, setCurrentSearchIndex]);

  return {
    handleSearchNext,
    handleSearchPrevious,
    handleSearchChange,
    handleSearchClose,
  };
};

