import { useAutocomplete } from '@/hooks/useAutocomplete';
import { Search, X } from '@/components/icons';
import React, { useState } from 'react';

interface KalifindSearchMobileProps {
  searchRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  handleSearch: (query: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  storeUrl?: string;
  showAutocomplete?: boolean;
  setShowAutocomplete?: (show: boolean) => void;
  autocompleteSuggestions?: string[];
  isAutocompleteLoading?: boolean;
  handleSuggestionClick?: (suggestion: string) => void;
  highlightedSuggestionIndex?: number;
  setHighlightedSuggestionIndex?: (index: number) => void;
  setHasSearched?: (hasSearched: boolean) => void;
  isInteractingWithDropdown?: boolean;
  setIsInteractingWithDropdown?: (interacting: boolean) => void;
}

const KalifindSearchMobile: React.FC<KalifindSearchMobileProps> = ({
  searchRef,
  inputRef,
  searchQuery,
  handleSearch,
  handleKeyDown,
  onClose,
  storeUrl,
  setHasSearched,
  isInteractingWithDropdown = false,
  setIsInteractingWithDropdown,
}) => {
  // Track if query change is from suggestion selection
  const [isFromSuggestionClick, setIsFromSuggestionClick] = useState(false);

  // Use autocomplete hook for mobile
  const {
    suggestions: mobileAutocompleteSuggestions,
    isLoading: mobileIsAutocompleteLoading,
    showDropdown: mobileShowAutocomplete,
    setShowDropdown: setMobileShowAutocomplete,
    handleSuggestionClick,
  } = useAutocomplete({
    query: searchQuery,
    storeUrl,
    onSuggestionSelect: (suggestion) => {
      // Mark that this change is from a suggestion click
      setIsFromSuggestionClick(true);

      // Set the search query and trigger search
      handleSearch(suggestion);

      // Add to recent searches if needed
      setHasSearched?.(true);

      // Blur input to close mobile keyboard
      inputRef.current?.blur();

      // Reset the flag after a short delay
      setTimeout(() => {
        setIsFromSuggestionClick(false);
      }, 100);
    },
    debounceMs: 300,
    enabled: !isFromSuggestionClick,
  });

  // Mobile suggestion click handler wrapper
  const handleMobileSuggestionClick = (suggestion: string) => {
    handleSuggestionClick(suggestion);
  };

  // Mobile-specific click outside handler - same as desktop
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     const target = event.target as HTMLElement;
  //
  //     console.log("Mobile click outside debug:", {
  //       target: target.tagName,
  //       targetClass: target.className,
  //       inputRef: inputRef.current,
  //       inputContains: inputRef.current ? inputRef.current.contains(target) : false,
  //       searchRef: searchRef.current,
  //       searchContains: searchRef.current ? searchRef.current.contains(target) : false,
  //     });
  //
  //     // First, check if click is on the mobile search input itself using data attributes
  //     const searchInput = target.closest("[data-search-input]");
  //     if (searchInput) {
  //       console.log("Mobile: Click detected on search input, keeping autocomplete open");
  //       return;
  //     }
  //
  //     // Check if the click is on a suggestion item or autocomplete dropdown
  //     const isSuggestionClick = target.closest("[data-suggestion-item]");
  //     const isAutocompleteClick = target.closest("[data-autocomplete-dropdown]");
  //
  //     if (isSuggestionClick || isAutocompleteClick) {
  //       console.log("Mobile: Click detected on suggestion item or dropdown, not closing autocomplete");
  //       return;
  //     }
  //
  //     // Check if click is within the mobile search container
  //     if (searchRef.current && searchRef.current.contains(target)) {
  //       console.log("Mobile: Click detected within search container, keeping autocomplete open");
  //       return;
  //     }
  //
  //     // Only close if click is truly outside everything
  //     console.log("Mobile: Click outside detected, closing autocomplete");
  //     setMobileShowAutocomplete(false);
  //   };
  //
  //   document.addEventListener("click", handleClickOutside);
  //   return () => document.removeEventListener("click", handleClickOutside);
  // }, [inputRef, searchRef]);

  return (
    <div className="bg-background border-border sticky top-0 z-50 w-full border-b">
      <div className="bg-background w-full py-2">
        <div className="mx-auto flex w-full flex-col justify-center lg:flex-row lg:gap-24">
          <div
            className="relative h-full w-full flex-1 px-[8px] sm:px-[16px]"
            ref={searchRef}
            data-mobile-search-container="true"
          >
            <div className="flex h-full w-full flex-1 items-center gap-2">
              <div className="flex h-full w-full">
                <div className="border-border bg-input relative h-full w-full flex-1 rounded-lg border-2 shadow-sm">
                  <Search className="text-muted-foreground test-search-icon" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    data-mobile-search-input="true"
                    data-search-input="true"
                    onChange={(e) => {
                      handleSearch(e.target.value);
                      setHasSearched?.(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.length > 0) {
                        setMobileShowAutocomplete(true);
                      }
                    }}
                    onBlur={(e) => {
                      // Only close autocomplete if the blur is not caused by clicking on a suggestion
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      const isClickingOnSuggestion =
                        relatedTarget?.closest('[data-suggestion-item]') ||
                        relatedTarget?.closest('[data-autocomplete-dropdown]');

                      if (!isClickingOnSuggestion && !isInteractingWithDropdown) {
                        // Longer delay to allow for autocomplete to show and user to interact
                        setTimeout(() => {
                          if (!isInteractingWithDropdown) {
                            setMobileShowAutocomplete(false);
                          }
                        }, 300);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products..."
                    className="text-foreground placeholder-muted-foreground h-full w-full border-none bg-transparent py-2 pr-4 pl-10 text-base ring-0 focus:outline-none"
                    autoFocus
                  />{' '}
                </div>
                <button
                  className="hover:bg-muted/20 flex-shrink-0 rounded-lg transition-colors duration-200"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="text-muted-foreground hover:text-foreground mr-3 h-5 w-5 transition-colors duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Autocomplete dropdown for mobile */}
      {mobileShowAutocomplete &&
        searchQuery.length > 0 &&
        (mobileIsAutocompleteLoading || mobileAutocompleteSuggestions.length > 0) && (
          <div
            data-autocomplete-dropdown="true"
            className="bg-background border-border absolute top-full right-0 left-0 z-[9999999] mx-4 mt-1 rounded-lg border shadow-lg"
            onMouseEnter={() => setIsInteractingWithDropdown?.(true)}
            onMouseLeave={() => setIsInteractingWithDropdown?.(false)}
          >
            <div className="p-4">
              {mobileIsAutocompleteLoading ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-3">
                  <div className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  <span>Loading suggestions...</span>
                </div>
              ) : mobileAutocompleteSuggestions.length > 0 ? (
                <>
                  <h3 className="text-foreground mb-3 text-sm font-medium">Suggestions</h3>
                  <div className="space-y-2">
                    {mobileAutocompleteSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        data-suggestion-item="true"
                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded p-2 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use mobile's own suggestion click handler
                          handleMobileSuggestionClick(suggestion);
                        }}
                      >
                        <Search className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : !mobileIsAutocompleteLoading ? (
                <div className="animate-in fade-in flex flex-col items-center justify-center py-6 text-center duration-300">
                  <div className="bg-muted animate-in zoom-in mb-3 flex h-12 w-12 items-center justify-center rounded-full duration-500">
                    <Search className="text-muted-foreground h-6 w-6" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <p className="text-foreground mb-1 font-medium">Search not found</p>
                    <p className="text-muted-foreground text-sm">
                      No suggestions found for "{searchQuery}"
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
    </div>
  );
};

export default KalifindSearchMobile;
