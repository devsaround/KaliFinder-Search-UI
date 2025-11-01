/**
 * SearchBar Component
 * Unified search input with autocomplete, suggestions, and recent searches
 *
 * Features:
 * - Search input with icon
 * - Autocomplete dropdown
 * - Recent searches
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Loading states
 * - Clear button
 */

import React, { useRef, useCallback } from 'react';
import { Search, X } from '@/components/icons';

export interface SearchBarProps {
  // Core props
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;

  // Autocomplete
  showAutocomplete: boolean;
  onAutocompleteToggle: (show: boolean) => void;
  suggestions: string[];
  isLoadingSuggestions?: boolean;
  onSuggestionClick: (suggestion: string) => void;

  // Recent searches
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;

  // Keyboard navigation
  highlightedIndex: number;
  onHighlightedIndexChange: (index: number) => void;

  // State
  isInteractingWithDropdown?: boolean;
  onInteractionChange?: (interacting: boolean) => void;

  // Refs (optional, for parent control)
  inputRef?: React.RefObject<HTMLInputElement>;

  // Styling
  variant?: 'default' | 'compact';
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search products...',
  showAutocomplete,
  onAutocompleteToggle,
  suggestions,
  isLoadingSuggestions = false,
  onSuggestionClick,
  recentSearches = [],
  onRecentSearchClick,
  highlightedIndex,
  onHighlightedIndexChange,
  isInteractingWithDropdown = false,
  onInteractionChange,
  inputRef: externalInputRef,
  variant = 'default',
  className = '',
}) => {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    onChange('');
    onAutocompleteToggle(false);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, onAutocompleteToggle]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (value && value.length > 0) {
      onAutocompleteToggle(true);
    }
  }, [value, onAutocompleteToggle]);

  // Handle input blur
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const isClickingOnSuggestion =
        relatedTarget?.closest('[data-suggestion-item]') ||
        relatedTarget?.closest('[data-autocomplete-dropdown]');

      if (!isClickingOnSuggestion && !isInteractingWithDropdown) {
        setTimeout(() => {
          onAutocompleteToggle(false);
        }, 100);
      }
    },
    [isInteractingWithDropdown, onAutocompleteToggle]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showAutocomplete) return;

      const totalItems = suggestions.length;
      if (totalItems === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onHighlightedIndexChange(highlightedIndex < totalItems - 1 ? highlightedIndex + 1 : 0);
          break;

        case 'ArrowUp':
          e.preventDefault();
          onHighlightedIndexChange(highlightedIndex > 0 ? highlightedIndex - 1 : totalItems - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            onSuggestionClick(suggestions[highlightedIndex]);
          } else if (value.trim()) {
            onSearch?.(value);
            onAutocompleteToggle(false);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onAutocompleteToggle(false);
          onHighlightedIndexChange(-1);
          break;
      }
    },
    [
      showAutocomplete,
      suggestions,
      highlightedIndex,
      value,
      onHighlightedIndexChange,
      onSuggestionClick,
      onSearch,
      onAutocompleteToggle,
    ]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSuggestionClick(suggestion);
      onAutocompleteToggle(false);
      onHighlightedIndexChange(-1);
    },
    [onSuggestionClick, onAutocompleteToggle, onHighlightedIndexChange]
  );

  // Handle dropdown mouse enter/leave
  const handleDropdownMouseEnter = useCallback(() => {
    onInteractionChange?.(true);
  }, [onInteractionChange]);

  const handleDropdownMouseLeave = useCallback(() => {
    onInteractionChange?.(false);
  }, [onInteractionChange]);

  const baseInputClass = variant === 'compact' ? 'py-2 text-sm' : 'py-3 text-sm lg:py-3.5';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Search Input */}
      <div className="bg-input border-border relative w-full rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md">
        {/* Search Icon */}
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform" />

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`text-foreground placeholder-muted-foreground w-full border-none bg-transparent pr-10 pl-10 outline-none focus:ring-0 ${baseInputClass}`}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Loading Spinner */}
        {isLoadingSuggestions && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
          </div>
        )}

        {/* Clear Button */}
        {!isLoadingSuggestions && value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transform transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete &&
        value &&
        value.length > 0 &&
        (isLoadingSuggestions || suggestions.length > 0) && (
          <div
            data-autocomplete-dropdown="true"
            className="border-border bg-background absolute top-full right-0 left-0 z-[9999999] mt-2 max-h-96 overflow-y-auto rounded-lg border shadow-lg"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <div className="p-4">
              {isLoadingSuggestions ? (
                // Loading state
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-3">
                  <div className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  <span className="text-sm">Loading suggestions...</span>
                </div>
              ) : suggestions.length > 0 ? (
                // Suggestions
                <>
                  <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                    Suggestions
                  </h3>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={`suggestion-${index}`}
                        data-suggestion-item="true"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                          highlightedIndex === index ? 'bg-accent text-accent-foreground' : ''
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSuggestionClick(suggestion);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Recent Searches */}
              {!isLoadingSuggestions && suggestions.length === 0 && recentSearches.length > 0 && (
                <>
                  <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <div
                        key={`recent-${index}`}
                        data-suggestion-item="true"
                        onClick={() => onRecentSearchClick?.(search)}
                        className="hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRecentSearchClick?.(search);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{search}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
