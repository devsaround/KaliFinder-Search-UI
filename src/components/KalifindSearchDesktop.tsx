import { Search, X } from 'lucide-react';
import React from 'react';

interface KalifindSearchDesktopProps {
  searchRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
  handleSearch: (query: string) => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  hideHeader?: boolean;
  showAutocomplete?: boolean;
  setShowAutocomplete?: (show: boolean) => void;
}

const KalifindSearchDesktop: React.FC<KalifindSearchDesktopProps> = ({
  searchRef,
  inputRef,
  searchQuery,
  handleSearch,
  handleKeyDown,
  onClose,
  hideHeader = false,
  setShowAutocomplete,
}) => {
  return (
    <div className="!bg-background box-border !min-h-screen w-screen lg:pt-[4px]">
      {!hideHeader && (
        <div className="!bg-background !w-full pt-[12px] lg:px-[48px]">
          <div className="!mx-auto !flex !w-full flex-col !items-center justify-center lg:flex-row">
            <div className="!flex !items-center justify-between !gap-[8px] md:justify-normal">
              <div className="!hidden w-[340px] !items-center lg:!flex">
                <a href="/" className="!s-center">
                  <img
                    src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                    alt="Kalifind"
                    className="mt-[8px] !h-auto w-[210px] !object-contain !object-center"
                  />
                </a>
              </div>
            </div>

            <div
              className="!relative !w-full !flex-1 px-[16px] md:px-0 lg:pl-[0px]"
              ref={searchRef}
            >
              <div className="!flex !w-full !flex-1 !items-center !gap-[8px]" ref={searchRef}>
                <div className="flex !w-full">
                  <div className="!border-border !bg-input !relative !w-full !flex-1 !rounded-lg !border-2 !shadow-sm transition-shadow hover:!shadow-md">
                    <Search className="!text-muted-foreground !absolute !top-1/2 !left-[12px] !h-[20px] !w-[20px] !-translate-y-1/2 !transform" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.length > 0) {
                          setShowAutocomplete?.(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Only close autocomplete if the blur is not caused by clicking on a suggestion
                        // or if the input is being cleared
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        const isClickingOnSuggestion =
                          relatedTarget?.closest('[data-suggestion-item]') ||
                          relatedTarget?.closest('[data-autocomplete-dropdown]');

                        if (!isClickingOnSuggestion && searchQuery.length === 0) {
                          setShowAutocomplete?.(false);
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search products..."
                      className="!text-foreground !placeholder-muted-foreground focus:!border-primary !w-full !bg-transparent !py-[14px] !pr-[16px] !pl-[40px] focus:!ring-0 focus:!outline-none"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        paddingLeft: '40px',
                      }}
                    />
                  </div>
                  <button
                    className="hover:!bg-muted/20 !flex-shrink-0 !rounded-lg !transition-colors !duration-200"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="!text-muted-foreground hover:!text-foreground !mr-[10px] !h-[25px] !w-[25px] font-bold !transition-colors !duration-200" />
                  </button>
                </div>
                <button
                  className="hover:!bg-muted/20 !flex-shrink-0 !rounded-lg !transition-colors !duration-200 !ml-[8px]"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="!text-muted-foreground hover:!text-foreground !h-[20px] !w-[20px] !transition-colors !duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KalifindSearchDesktop;
