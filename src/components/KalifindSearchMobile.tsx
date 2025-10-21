import { useAutocomplete } from '@/hooks/useAutocomplete';
import { Search, X } from 'lucide-react';
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
    <div className="kf:bg-background kf:border-border kf:sticky kf:top-0 kf:z-50 kf:w-full kf:border-b">
      <div className="kf:bg-background kf:w-full kf:py-2">
        <div className="kf:mx-auto kf:flex kf:w-full kf:flex-col kf:justify-center kf:lg:flex-row kf:lg:gap-24">
          <div
            className="kf:relative kf:h-full kf:w-full kf:flex-1 kf:px-[8px] kf:sm:px-[16px]"
            ref={searchRef}
            data-mobile-search-container="true"
          >
            <div className="kf:flex kf:h-full kf:w-full kf:flex-1 kf:items-center kf:gap-2">
              <div className="kf:flex kf:h-full kf:w-full">
                <div className="kf:border-border kf:bg-input kf:relative kf:h-full kf:w-full kf:flex-1 kf:rounded-lg kf:border-2 kf:shadow-sm">
                  <Search className="kf:text-muted-foreground kf:absolute kf:top-1/2 kf:left-3 kf:h-5 kf:w-5 kf:-translate-y-1/2 kf:transform" />
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
                    className="kf:text-foreground kf:placeholder-muted-foreground kf:h-full kf:w-full kf:border-none kf:bg-transparent kf:py-2 kf:pr-4 kf:pl-10 kf:text-base kf:ring-0 kf:focus:outline-none"
                    autoFocus
                  />{' '}
                </div>
                <button
                  className="kf:hover:bg-muted/20 kf:flex-shrink-0 kf:rounded-lg kf:transition-colors kf:duration-200"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="kf:text-muted-foreground kf:hover:text-foreground kf:mr-3 kf:h-5 kf:w-5 kf:transition-colors kf:duration-200" />
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
            className="kf:bg-background kf:border-border kf:absolute kf:top-full kf:right-0 kf:left-0 kf:z-[9999999] kf:mx-4 kf:mt-1 kf:rounded-lg kf:border kf:shadow-lg"
            onMouseEnter={() => setIsInteractingWithDropdown?.(true)}
            onMouseLeave={() => setIsInteractingWithDropdown?.(false)}
          >
            <div className="kf:p-4">
              {mobileIsAutocompleteLoading ? (
                <div className="kf:text-muted-foreground kf:flex kf:items-center kf:justify-center kf:gap-2 kf:py-3">
                  <div className="kf:border-muted-foreground kf:h-4 kf:w-4 kf:animate-spin kf:rounded-full kf:border-2 kf:border-t-transparent"></div>
                  <span>Loading suggestions...</span>
                </div>
              ) : mobileAutocompleteSuggestions.length > 0 ? (
                <>
                  <h3 className="kf:text-foreground kf:mb-3 kf:text-sm kf:font-medium">
                    Suggestions
                  </h3>
                  <div className="kf:space-y-2">
                    {mobileAutocompleteSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        data-suggestion-item="true"
                        className="kf:hover:bg-muted kf:flex kf:cursor-pointer kf:items-center kf:gap-2 kf:rounded kf:p-2 kf:transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use mobile's own suggestion click handler
                          handleMobileSuggestionClick(suggestion);
                        }}
                      >
                        <Search className="kf:text-muted-foreground kf:h-4 kf:w-4" />
                        <span className="kf:text-muted-foreground">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : !mobileIsAutocompleteLoading ? (
                <div className="kf:animate-in kf:fade-in kf:flex kf:flex-col kf:items-center kf:justify-center kf:py-6 kf:text-center kf:duration-300">
                  <div className="kf:bg-muted kf:animate-in kf:zoom-in kf:mb-3 kf:flex kf:h-12 kf:w-12 kf:items-center kf:justify-center kf:rounded-full kf:duration-500">
                    <Search className="kf:text-muted-foreground kf:h-6 kf:w-6" />
                  </div>
                  <div className="kf:animate-in kf:slide-in-from-bottom-2 kf:duration-500">
                    <p className="kf:text-foreground kf:mb-1 kf:font-medium">Search not found</p>
                    <p className="kf:text-muted-foreground kf:text-sm">
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
