import React from "react";
import { Search, X } from "lucide-react";

interface KalifindSearchMobileProps {
  searchRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
  handleSearch: (query: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  showAutocomplete?: boolean;
  setShowAutocomplete?: (show: boolean) => void;
  autocompleteSuggestions?: string[];
  isAutocompleteLoading?: boolean;
  handleSuggestionClick?: (suggestion: string) => void;
  highlightedSuggestionIndex?: number;
  setHighlightedSuggestionIndex?: (index: number) => void;
}

const KalifindSearchMobile: React.FC<KalifindSearchMobileProps> = ({
  searchRef,
  inputRef,
  searchQuery,
  handleSearch,
  handleKeyDown,
  onClose,
  showAutocomplete = false,
  setShowAutocomplete,
  autocompleteSuggestions = [],
  isAutocompleteLoading = false,
  handleSuggestionClick,
  highlightedSuggestionIndex = -1,
  setHighlightedSuggestionIndex,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-background w-full border-b border-border">
      <div className="bg-background py-2 w-full">
        <div className="flex justify-center lg:gap-24 mx-auto flex-col lg:flex-row w-full">
          <div className="flex items-center gap-2 justify-between md:justify-normal">
            <div className="lg:flex items-center hidden">
              <a href="/" className="s-center">
                <img
                  src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                  alt="Kalifind"
                  className="h-auto w-full max-w-[150px] max-h-[48px] object-contain object-center"
                />
              </a>
            </div>
          </div>

          <div
            className="flex-1 h-full relative w-full px-0.5 sm:px-4"
            ref={searchRef}
          >
            <div className="flex items-center gap-2 flex-1 w-full h-full">
              <div className="w-full flex h-full">
                <div className="relative flex-1 w-full h-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowAutocomplete?.(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search"
                    className="h-full w-full pl-10 pr-4 py-2 text-base text-foreground placeholder-muted-foreground focus:outline-none border-none ring-0"
                    autoFocus
                  />
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
      {showAutocomplete && searchQuery && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg shadow-lg z-50 mt-1 mx-4">
          <div className="p-4">
            {isAutocompleteLoading ? (
              <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Loading suggestions...</span>
              </div>
            ) : autocompleteSuggestions.length > 0 ? (
              <>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded ${
                        index === highlightedSuggestionIndex ? 'bg-muted' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Mobile suggestion clicked:", suggestion);
                        handleSuggestionClick?.(suggestion);
                      }}
                    >
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : !isAutocompleteLoading ? (
              <div className="flex items-center justify-center py-3 text-muted-foreground">
                <Search className="w-4 h-4 mr-2" />
                <span>No suggestions found for "{searchQuery}"</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default KalifindSearchMobile;