import React from "react";
import { Search, X } from "lucide-react";

interface KalifindSearchMobileProps {
  searchRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
  handleSearch: (query: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const KalifindSearchMobile: React.FC<KalifindSearchMobileProps> = ({
  searchRef,
  inputRef,
  searchQuery,
  handleSearch,
  handleKeyDown,
  onClose,
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
    </div>
  );
};

export default KalifindSearchMobile;