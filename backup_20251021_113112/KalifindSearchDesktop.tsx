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
    <div className="kf:!bg-background kf:box-border kf:!min-h-screen kf:w-screen kf:lg:pt-[4px]">
      {!hideHeader && (
        <div className="kf:!bg-background kf:!w-full kf:pt-[12px] kf:lg:px-[48px]">
          <div className="kf:!mx-auto kf:!flex kf:!w-full kf:flex-col kf:!items-center kf:justify-center kf:lg:flex-row">
            <div className="kf:!flex kf:!items-center kf:justify-between kf:!gap-[8px] kf:md:justify-normal">
              <div className="kf:!hidden kf:w-[340px] kf:!items-center kf:lg:!flex">
                <a href="/" className="kf:!s-center">
                  <img
                    src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                    alt="Kalifind"
                    className="kf:mt-[8px] kf:!h-auto kf:w-[210px] kf:!object-contain kf:!object-center"
                  />
                </a>
              </div>
            </div>

            <div
              className="kf:!relative kf:!w-full kf:!flex-1 kf:px-[16px] kf:md:px-0 kf:lg:pl-[0px]"
              ref={searchRef}
            >
              <div
                className="kf:!flex kf:!w-full kf:!flex-1 kf:!items-center kf:!gap-[8px]"
                ref={searchRef}
              >
                <div className="kf:flex kf:!w-full">
                  <div className="kf:!border-border kf:!bg-input kf:!relative kf:!w-full kf:!flex-1 kf:!rounded-lg kf:!border-2 kf:!shadow-sm kf:transition-shadow kf:hover:!shadow-md">
                    <Search className="kf:!text-muted-foreground kf:!absolute kf:!top-1/2 kf:!left-[12px] kf:!h-[20px] kf:!w-[20px] kf:!-translate-y-1/2 kf:!transform" />
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
                      className="kf:!text-foreground kf:!placeholder-muted-foreground kf:focus:!border-primary kf:!w-full kf:!bg-transparent kf:!py-[14px] kf:!pr-[16px] kf:!pl-[40px] kf:focus:!ring-0 kf:focus:!outline-none"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        paddingLeft: '40px',
                      }}
                    />
                  </div>
                  <button
                    className="kf:hover:!bg-muted/20 kf:!flex-shrink-0 kf:!rounded-lg kf:!transition-colors kf:!duration-200"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="kf:!text-muted-foreground kf:hover:!text-foreground kf:!mr-[10px] kf:!h-[25px] kf:!w-[25px] kf:font-bold kf:!transition-colors kf:!duration-200" />
                  </button>
                </div>
                <button
                  className="kf:hover:!bg-muted/20 kf:!ml-[8px] kf:!flex-shrink-0 kf:!rounded-lg kf:!transition-colors kf:!duration-200"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="kf:!text-muted-foreground kf:hover:!text-foreground kf:!h-[20px] kf:!w-[20px] kf:!transition-colors kf:!duration-200" />
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
