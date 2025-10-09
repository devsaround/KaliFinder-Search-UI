import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";

interface KalifindSearchMobileProps {
  searchRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
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
  storeUrl = "http://3.228.193.93",
  showAutocomplete = false,
  setShowAutocomplete,
  autocompleteSuggestions = [],
  isAutocompleteLoading = false,
  handleSuggestionClick,
  highlightedSuggestionIndex = -1,
  setHighlightedSuggestionIndex,
  setHasSearched,
  isInteractingWithDropdown = false,
  setIsInteractingWithDropdown,
}) => {
  // Mobile component's own autocomplete state
  const [mobileShowAutocomplete, setMobileShowAutocomplete] = useState(false);
  const [mobileAutocompleteSuggestions, setMobileAutocompleteSuggestions] = useState<string[]>([]);
  const [mobileIsAutocompleteLoading, setMobileIsAutocompleteLoading] = useState(false);
  
  // Track if query change is from suggestion selection
  const isFromSuggestionClickRef = useRef(false);

  // Mobile autocomplete logic - self-contained like desktop
  useEffect(() => {
    // Don't show autocomplete if query is empty or change is from suggestion click
    if (!searchQuery.trim() || isFromSuggestionClickRef.current) {
      setMobileAutocompleteSuggestions([]);
      setMobileIsAutocompleteLoading(false);
      setMobileShowAutocomplete(false);
      return;
    }

    setMobileShowAutocomplete(true);
    const debounceTimer = setTimeout(async () => {
      setMobileIsAutocompleteLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("q", searchQuery);
        params.append("storeUrl", storeUrl); // Use storeUrl with fallback

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`,
          {}
        );

        if (!response.ok) {
          throw new Error("bad response");
        }

        const result = await response.json();
        
        // Handle different response formats
        let rawSuggestions: string[] = [];
        if (Array.isArray(result)) {
          rawSuggestions = result.map((r: any) => r.title || r.name || r.product_title || r.product_name || String(r)).filter(Boolean);
        } else if (result && Array.isArray(result.suggestions)) {
          rawSuggestions = result.suggestions.map((s: string) => String(s));
        } else if (result && Array.isArray(result.products)) {
          rawSuggestions = result.products.map((r: any) => r.title || r.name || r.product_title || r.product_name || String(r)).filter(Boolean);
        }

        setMobileAutocompleteSuggestions(rawSuggestions.slice(0, 10));
      } catch (error) {
        console.error("Mobile autocomplete error:", error);
        setMobileAutocompleteSuggestions([]);
      } finally {
        setMobileIsAutocompleteLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Mobile suggestion click handler - same as desktop
  const handleMobileSuggestionClick = (suggestion: string) => {
    // Mark that this change is from a suggestion click
    isFromSuggestionClickRef.current = true;
    
    // Close autocomplete
    setMobileShowAutocomplete(false);
    setMobileAutocompleteSuggestions([]);
    setMobileIsAutocompleteLoading(false);
    
    // Set the search query and trigger search
    handleSearch(suggestion);
    
    // Add to recent searches if needed
    setHasSearched?.(true);
    
    // Blur input to close mobile keyboard
    inputRef.current?.blur();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isFromSuggestionClickRef.current = false;
    }, 100);
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
    <div className="sticky top-0 z-50 bg-background w-full border-b border-border">
      <div className="bg-background py-2 w-full">
        <div className="flex justify-center lg:gap-24 mx-auto flex-col lg:flex-row w-full">
          <div
            className="flex-1 h-full relative w-full px-[8px] sm:px-[16px]"
            ref={searchRef}
            data-mobile-search-container="true"
          >
            <div className="flex items-center gap-2 flex-1 w-full h-full">
              <div className="w-full flex h-full">
                <div className="relative flex-1 w-full h-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
                        relatedTarget?.closest("[data-suggestion-item]") ||
                        relatedTarget?.closest("[data-autocomplete-dropdown]");

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
                    placeholder="Search"
                    className="h-full w-full pl-10 pr-4 py-2 text-base text-foreground placeholder-muted-foreground focus:outline-none border-none ring-0"
                    autoFocus
                  />{" "}
                </div>
                <button
                  className="rounded-lg hover:bg-muted/20 transition-colors duration-200 flex-shrink-0"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-200 mr-3" />
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
            className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-[9999999] mt-1 mx-4"
            onMouseEnter={() => setIsInteractingWithDropdown?.(true)}
            onMouseLeave={() => setIsInteractingWithDropdown?.(false)}
          >
            <div className="p-4">
              {mobileIsAutocompleteLoading ? (
                <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading suggestions...</span>
                </div>
              ) : mobileAutocompleteSuggestions.length > 0 ? (
                <>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Suggestions
                  </h3>
                  <div className="space-y-2">
                    {mobileAutocompleteSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        data-suggestion-item="true"
                        className={`flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors ${
                          index === highlightedSuggestionIndex ? "bg-muted" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use mobile's own suggestion click handler
                          handleMobileSuggestionClick(suggestion);
                        }}
                      >
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : !mobileIsAutocompleteLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 animate-in zoom-in duration-500">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="animate-in slide-in-from-bottom-2 duration-500">
                    <p className="text-foreground font-medium mb-1">Search not found</p>
                    <p className="text-muted-foreground text-sm">No suggestions found for "{searchQuery}"</p>
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
