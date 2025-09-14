import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { X, Search } from "lucide-react";
import ScrollToTop from "./ScrollToTop";

// Lazy load the EcommerceSearch component
const EcommerceSearch = lazy(() => import("./KalifindSearchTest.tsx"));

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  apiKey?: string;
  storeId?: string;
  storeType?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  onClose,
  userId,
  apiKey,
  storeType,
  storeId,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile or tablet
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Only set loading state for mobile/tablet
      setIsLoading(isMobileOrTablet);
      document.body.style.overflow = "hidden";

      // Only simulate loading time for mobile/tablet
      if (isMobileOrTablet) {
        const loadingTimer = setTimeout(() => {
          setIsLoading(false);
        }, 800);

        return () => clearTimeout(loadingTimer);
      }
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isMobileOrTablet]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // const handleClickOutside = (e: MouseEvent) => {
    //   // Only close if clicking directly on the backdrop (not on the dropdown content)
    //   if (
    //     dropdownRef.current &&
    //     !dropdownRef.current.contains(e.target as Node)
    //   ) {
    //     onClose();
    //   }
    // };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const query = event.currentTarget.value;
      if (query) {
        setShowAutocomplete(false);
        inputRef.current?.blur();
      }
    }
  };

  // Fixed search header for mobile/tablet - stays at top
  const FixedSearchHeader = () => (
    <div className="!sticky !top-0 !z-50 !bg-background !w-full !border-b !border-border">
      <div className="!bg-background !py-[8px] !w-full">
        <div className="!flex justify-center lg:!gap-[96px] !mx-auto flex-col lg:flex-row !w-full">
          {/* <div className="!flex !items-center !gap-[8px] justify-between md:justify-normal"> */}
          <div className="!flex !items-center !gap-[8px] justify-between md:justify-normal">
            {/* <div className="lg:!flex !items-center !hidden"> */}
            <div className="lg:!flex !items-center !hidden">
              <a href="/" className="!s-center">
                <img
                  src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                  alt="Kalifind"
                  className="!h-auto !w-full !max-w-[150px] !max-h-[48px] !object-contain !object-center"
                />
              </a>
            </div>
          </div>

          <div
            className="!flex-1 !h-full !relative !w-full px-[16px]"
            ref={searchRef}
          >
            <div className="!flex !items-center !gap-[8px] !flex-1 !w-full !h-full">
              <div className="!w-full flex h-full">
                <div className="!relative !flex-1 !w-full h-full">
                  <Search className="!absolute !left-[12px] !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-[20px] !h-[20px]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowAutocomplete(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search"
                    className="h-full !w-full !pl-[38px] !pr-[16px] !py-[8px] !text-[16px] !text-foreground !placeholder-muted-foreground focus:!outline-none !border-none !ring-0"
                    autoFocus
                  />
                </div>
                <button
                  className="!rounded-lg hover:!bg-muted/20 !transition-colors !duration-200 !flex-shrink-0"
                  aria-label="Close search"
                  onClick={onClose}
                >
                  <X className="!w-[20px] !h-[20x] !text-muted-foreground hover:!text-foreground !transition-colors !duration-200 mr-[12px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Custom EcommerceSearch wrapper that hides header on mobile/tablet
  const EcommerceSearchWrapper = () => (
    <div className="!w-full !px-[8px] sm:!px-[16px]">
      <EcommerceSearch
        userId={userId}
        apiKey={apiKey}
        storeId={storeId}
        storeType={storeType}
        onClose={onClose}
        searchQuery={searchQuery}
        hideHeader={isMobileOrTablet} // Pass flag to hide header on mobile/tablet
      />
    </div>
  );

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="!fixed !inset-0 !z-[999] !min-h-screen" id="my-ui">
      {/* Backdrop */}
      <div
        className={`!fixed !inset-0 !bg-foreground/20 !backdrop-blur-sm !transition-opacity !duration-300 ${
          isOpen ? "!opacity-100" : "!opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div
        ref={dropdownRef}
        className={`!fixed !inset-0 !bg-background !shadow-xl !transition-all !duration-500 !overflow-y-auto ${
          isOpen ? "!animate-slide-down" : "!animate-slide-up"
        }`}
        style={{
          maxHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          ref={scrollContainerRef}
          className="!w-full !h-full !overflow-y-auto"
        >
          {isMobileOrTablet ? (
            // Mobile/Tablet: Search-first UI
            <div className="!w-full !h-full">
              {/* Fixed search header at top */}
              <FixedSearchHeader />

              {/* Content area below search */}
              <div className="!w-full !min-h-[calc(100vh-80px)]">
                {isLoading ? (
                  // Show loading state below search
                  <div className="!flex !flex-col !items-center !justify-center !py-[48px]">
                    <div className="!flex !space-x-[8px] !mb-[16px]">
                      <div
                        className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <p className="!text-muted-foreground !text-[14px]">
                      Loading products...
                    </p>
                  </div>
                ) : (
                  // Show products below search once loaded
                  <Suspense
                    fallback={
                      <div className="!flex !flex-col !items-center !justify-center !py-[48px]">
                        <div className="!flex !space-x-[8px] !mb-[16px]">
                          <div
                            className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="!w-[8px] !h-[8px] !bg-gray-400 !rounded-full !animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                        <p className="!text-muted-foreground !text-[14px]">
                          Loading products...
                        </p>
                      </div>
                    }
                  >
                    <EcommerceSearchWrapper />
                  </Suspense>
                )}
              </div>
            </div>
          ) : (
            // Desktop: Normal layout
            <Suspense fallback={null}>
              <EcommerceSearch
                userId={userId}
                apiKey={apiKey}
                storeId={storeId}
                storeType={storeType}
                onClose={onClose}
              />
            </Suspense>
          )}
        </div>

        {/* Scroll to Top Button */}
        <ScrollToTop
          containerRef={scrollContainerRef}
          showAfter={200}
          className="!z-[1001]"
        />
      </div>
    </div>
  );
};

export default SearchDropdown;

