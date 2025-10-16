import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import widgetStyles from '../index.css?inline';
import type { ShadowDOMSearchDropdownProps } from '../types';
import KalifindSearchMobile from './KalifindSearchMobile';
import ScrollToTop from './ScrollToTop';

const SHADOW_CONTAINER_ID = 'kalifind-shadow-container';
const STYLE_DATA_ATTRIBUTE = 'data-kalifind-shadow-styles';

// Shadow DOM reset styles - complete CSS reset for isolation
const SHADOW_RESET_STYLES = `
  :host {
    all: initial;
  }

  #${SHADOW_CONTAINER_ID},
  .kalifind-shadow-container {
    all: initial;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    color: #1f2937;
    background-color: #ffffff;
    font-size: 16px;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  #${SHADOW_CONTAINER_ID} *,
  #${SHADOW_CONTAINER_ID} *::before,
  #${SHADOW_CONTAINER_ID} *::after {
    box-sizing: border-box;
    font-family: inherit;
    line-height: inherit;
    color: inherit;
  }

  #${SHADOW_CONTAINER_ID} img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  #${SHADOW_CONTAINER_ID} button,
  .kalifind-shadow-container button {
    cursor: pointer;
  }
`;

// Combine reset styles with compiled widget styles
const COMPILED_WIDGET_STYLES = `${SHADOW_RESET_STYLES}
${widgetStyles}`;

// Lazy load the EcommerceSearch component
const EcommerceSearch = lazy(() => import('./KalifindSearch.tsx'));

const ShadowDOMSearchDropdown: React.FC<ShadowDOMSearchDropdownProps> = ({
  isOpen,
  onClose,
  storeUrl,
}) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [reactRoot, setReactRoot] = useState<unknown>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const shadowInitializedRef = useRef(false);
  const styleSheetRef = useRef<CSSStyleSheet | null>(null);

  // Fuzzy matching function for better autocomplete
  const fuzzyMatch = useCallback((query: string, suggestion: string): boolean => {
    if (!query || !suggestion) return false;

    const queryLower = query.toLowerCase().trim();
    const suggestionLower = suggestion.toLowerCase().trim();

    // Exact match
    if (suggestionLower.includes(queryLower)) return true;

    // Fuzzy matching - check if all characters in query appear in order in suggestion
    let queryIndex = 0;
    for (let i = 0; i < suggestionLower.length && queryIndex < queryLower.length; i++) {
      if (suggestionLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }

    // If we found all characters in order, it's a match
    return queryIndex === queryLower.length;
  }, []);

  // Function to score and sort suggestions by relevance
  const scoreSuggestion = useCallback(
    (query: string, suggestion: string): number => {
      if (!query || !suggestion) return 0;

      const queryLower = query.toLowerCase().trim();
      const suggestionLower = suggestion.toLowerCase().trim();

      // Exact match gets highest score
      if (suggestionLower === queryLower) return 100;

      // Starts with query gets high score
      if (suggestionLower.startsWith(queryLower)) return 90;

      // Contains query gets medium score
      if (suggestionLower.includes(queryLower)) return 70;

      // Fuzzy match gets lower score
      if (fuzzyMatch(query, suggestion)) return 50;

      return 0;
    },
    [fuzzyMatch]
  );

  // Check if device is mobile or tablet (using 1280px breakpoint)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1280); // 1280px breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Reset shadow initialization flag when component closes
        shadowInitializedRef.current = false;
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Autocomplete logic for mobile
  useEffect(() => {
    if (!storeUrl || !searchQuery.trim()) {
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
      setShowAutocomplete(false);
      return;
    }

    setShowAutocomplete(true);
    const debounceTimer = setTimeout(async () => {
      setIsAutocompleteLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('q', searchQuery);
        params.append('storeUrl', storeUrl);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`,
          {}
        );

        if (!response.ok) {
          throw new Error('bad response');
        }

        const result = await response.json();

        // Better handling of different response formats
        let rawSuggestions: string[] = [];
        if (Array.isArray(result)) {
          rawSuggestions = result
            .map(
              (r: {
                title: string;
                name: string;
                product_title: string;
                product_name: string;
              }) => {
                // Handle different possible field names
                return r.title || r.name || r.product_title || r.product_name || String(r);
              }
            )
            .filter(Boolean);
        } else if (result && Array.isArray(result.suggestions)) {
          rawSuggestions = result.suggestions.map((s: string) => String(s));
        } else if (result && Array.isArray(result.products)) {
          rawSuggestions = result.products
            .map(
              (r: {
                title: string;
                name: string;
                product_title: string;
                product_name: string;
              }) => {
                return r.title || r.name || r.product_title || r.product_name || String(r);
              }
            )
            .filter(Boolean);
        }

        // Apply fuzzy matching and scoring to improve suggestions
        const query = searchQuery.trim();
        const scoredSuggestions = rawSuggestions
          .map((suggestion) => ({
            text: suggestion,
            score: scoreSuggestion(query, suggestion),
          }))
          .filter((item) => item.score > 0) // Only include suggestions with positive scores
          .sort((a, b) => b.score - a.score) // Sort by score (highest first)
          .map((item) => item.text)
          .slice(0, 10); // Limit to top 10 suggestions

        setAutocompleteSuggestions(scoredSuggestions);
        setHighlightedSuggestionIndex(-1); // Reset highlight when new suggestions arrive
      } catch (error) {
        console.error('Failed to fetch autocomplete suggestions:', error);
        setAutocompleteSuggestions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, storeUrl, scoreSuggestion]);

  // Click outside handler for autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Shadow DOM
  useEffect(() => {
    if (shadowHostRef.current && !shadowRoot && isOpen && !shadowInitializedRef.current) {
      // Check if element already has a shadow root
      if (shadowHostRef.current.shadowRoot) {
        console.warn('Kalifind Search: Element already has a shadow root, reusing existing one');
        setShadowRoot(shadowHostRef.current.shadowRoot);
        shadowInitializedRef.current = true;
        return;
      }

      let shadow: ShadowRoot | null = null;
      try {
        // Create shadow root with closed mode for better isolation
        shadow = shadowHostRef.current.attachShadow({ mode: 'closed' });
        setShadowRoot(shadow);
        shadowInitializedRef.current = true;
      } catch (error) {
        console.error('Kalifind Search: Failed to create shadow DOM:', error);
        // If shadow DOM creation fails, try to find an existing shadow root
        if (shadowHostRef.current.shadowRoot) {
          console.warn('Kalifind Search: Using existing shadow root after error');
          shadow = shadowHostRef.current.shadowRoot;
          setShadowRoot(shadowHostRef.current.shadowRoot);
          shadowInitializedRef.current = true;
        } else {
          // If no shadow root exists and creation failed, skip shadow DOM
          console.warn('Kalifind Search: Skipping shadow DOM initialization');
          shadowInitializedRef.current = true;
          return;
        }
      }

      // Ensure shadow is not null before proceeding
      if (!shadow) {
        console.warn('Kalifind Search: Shadow root is null, skipping initialization');
        return;
      }

      // Create a container div inside shadow DOM
      const shadowContainer = document.createElement('div');
      shadowContainer.id = SHADOW_CONTAINER_ID;
      shadowContainer.classList.add('kalifind-shadow-container');
      shadow.appendChild(shadowContainer);

      // Inject styles using modern constructable stylesheets with fallback
      const ensureStylesInjected = (target: ShadowRoot) => {
        const supportsConstructableSheets =
          'adoptedStyleSheets' in target &&
          typeof CSSStyleSheet !== 'undefined' &&
          'replaceSync' in CSSStyleSheet.prototype;

        if (supportsConstructableSheets) {
          try {
            if (!styleSheetRef.current) {
              const sheet = new CSSStyleSheet();
              sheet.replaceSync(COMPILED_WIDGET_STYLES);
              styleSheetRef.current = sheet;
            }

            const adoptedSheets = Array.from(target.adoptedStyleSheets);
            const sheet = styleSheetRef.current;

            if (sheet && !adoptedSheets.includes(sheet)) {
              target.adoptedStyleSheets = [...adoptedSheets, sheet];
            }
          } catch (error) {
            console.warn('Kalifind Search: Failed to use constructable stylesheets, falling back:', error);
            // Fall through to style element injection
            if (!target.querySelector(`style[${STYLE_DATA_ATTRIBUTE}]`)) {
              const styleElement = document.createElement('style');
              styleElement.setAttribute(STYLE_DATA_ATTRIBUTE, 'true');
              styleElement.textContent = COMPILED_WIDGET_STYLES;
              target.appendChild(styleElement);
            }
          }
        } else if (!target.querySelector(`style[${STYLE_DATA_ATTRIBUTE}]`)) {
          const styleElement = document.createElement('style');
          styleElement.setAttribute(STYLE_DATA_ATTRIBUTE, 'true');
          styleElement.textContent = COMPILED_WIDGET_STYLES;
          target.appendChild(styleElement);
        }
      };

      ensureStylesInjected(shadow);

      // Create React root inside shadow DOM
      const root = createRoot(shadowContainer);
      setReactRoot(root);
    }

    return () => {
      if (reactRoot) {
        // Use setTimeout to avoid unmounting during render
        setTimeout(() => {
          try {
            (reactRoot as ReturnType<typeof createRoot>).unmount();
            setReactRoot(null);
          } catch (error) {
            console.warn('Kalifind Search: Error during React root cleanup:', error);
          }
        }, 0);
      }
    };
  }, [isOpen, shadowRoot, reactRoot]);

  // Render content inside Shadow DOM
  useEffect(() => {
    if (reactRoot && shadowRoot && isOpen) {
      const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const query = event.currentTarget.value;

          // If there's a highlighted suggestion, use that instead
          if (
            highlightedSuggestionIndex >= 0 &&
            autocompleteSuggestions[highlightedSuggestionIndex]
          ) {
            const selectedSuggestion = autocompleteSuggestions[highlightedSuggestionIndex];
            handleSuggestionClick(selectedSuggestion);
            return;
          }

          if (query.trim()) {
            setShowAutocomplete(false);
            setHighlightedSuggestionIndex(-1);
            setAutocompleteSuggestions([]);
            inputRef.current?.blur();
          }
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (showAutocomplete && autocompleteSuggestions.length > 0) {
            setHighlightedSuggestionIndex((prev) =>
              prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
            );
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (showAutocomplete && autocompleteSuggestions.length > 0) {
            setHighlightedSuggestionIndex((prev) =>
              prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
            );
          }
        } else if (event.key === 'Escape') {
          setShowAutocomplete(false);
          setHighlightedSuggestionIndex(-1);
          setAutocompleteSuggestions([]);
          inputRef.current?.blur();
        }
      };

      const handleSearch = (query: string) => {
        setSearchQuery(query);
        // Let the mobile autocomplete useEffect handle showAutocomplete state
        if (!query.trim()) {
          // Only hide autocomplete when input is cleared
          setShowAutocomplete(false);
          setAutocompleteSuggestions([]);
          setHighlightedSuggestionIndex(-1);
        }
      };

      const handleSuggestionClick = (suggestion: string) => {
        try {
          setSearchQuery(suggestion);
          setShowAutocomplete(false);
          setHighlightedSuggestionIndex(-1);
          setAutocompleteSuggestions([]);
          // Blur input to close mobile keyboard
          inputRef.current?.blur();
        } catch (error) {
          console.error('Error in ShadowDOM handleSuggestionClick:', error);
        }
      };

      const content = (
        <div className="kf-fixed kf-inset-0 kf-z-50 kf-min-h-screen">
          {/* Backdrop */}
          <div
            className={`kf-bg-foreground/20 kf-fixed kf-inset-0 kf-backdrop-blur-sm kf-transition-opacity kf-duration-300 ${
              isOpen ? 'kf-opacity-100' : 'kf-opacity-0'
            }`}
            onClick={onClose}
          />

          {/* Dropdown Panel */}
          <div
            className={`kf-bg-background kf-fixed kf-inset-0 kf-overflow-y-auto kf-shadow-xl kf-transition-all kf-duration-500 ${
              isOpen ? 'kf-animate-slide-down' : 'kf-animate-slide-up'
            }`}
            style={{
              maxHeight: '100vh',
              overflowY: 'auto',
            }}
          >
            <div className="kf-h-full kf-w-full kf-overflow-y-auto">
              {isMobileOrTablet ? (
                // Mobile/Tablet: Use KalifindSearchMobile component for header, and KalifindSearch for content
                <div className="kf-h-full kf-w-full">
                  {/* Mobile search header at top */}
                  <KalifindSearchMobile
                    searchRef={searchRef}
                    inputRef={inputRef}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    handleKeyDown={handleKeyDown}
                    onClose={onClose}
                    storeUrl={storeUrl}
                    setHasSearched={setHasSearched}
                    isInteractingWithDropdown={isInteractingWithDropdown}
                    setIsInteractingWithDropdown={setIsInteractingWithDropdown}
                  />

                  {/* Content area below search */}
                  <div className="kf-min-h-[calc(100vh-80px)] kf-w-full">
                    <Suspense
                      fallback={
                        <div className="kf-flex kf-flex-col kf-items-center kf-justify-center kf-py-12">
                          <div className="kf-mb-4 kf-flex kf-space-x-2">
                            <div
                              className="kf-h-2 kf-w-2 kf-animate-bounce kf-rounded-full kf-bg-gray-400"
                              style={{ animationDelay: '0ms' }}
                            />
                            <div
                              className="kf-h-2 kf-w-2 kf-animate-bounce kf-rounded-full kf-bg-gray-400"
                              style={{ animationDelay: '150ms' }}
                            />
                            <div
                              className="kf-h-2 kf-w-2 kf-animate-bounce kf-rounded-full kf-bg-gray-400"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                          <p className="kf-text-muted-foreground kf-text-sm">Loading products...</p>
                        </div>
                      }
                    >
                      <EcommerceSearch
                        storeUrl={storeUrl}
                        onClose={onClose}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        hasSearched={hasSearched}
                        setHasSearched={setHasSearched}
                        hideHeader={true} // Hide header for the content part
                      />
                    </Suspense>
                  </div>
                </div>
              ) : (
                // Desktop: Use original EcommerceSearch component
                <Suspense fallback={null}>
                  <EcommerceSearch
                    storeUrl={storeUrl}
                    onClose={onClose}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    hasSearched={hasSearched}
                    setHasSearched={setHasSearched}
                    hideHeader={false}
                  />
                </Suspense>
              )}
            </div>

            {/* Scroll to Top Button */}
            <ScrollToTop showAfter={200} className="kf-z-50" />
          </div>
        </div>
      );

      if (reactRoot && shadowRoot) {
        (reactRoot as ReturnType<typeof createRoot>).render(content);
      }
    }
  }, [
    reactRoot,
    shadowRoot,
    isOpen,
    isMobileOrTablet,
    searchQuery,
    storeUrl,
    onClose,
    autocompleteSuggestions,
    highlightedSuggestionIndex,
    hasSearched,
    isInteractingWithDropdown,
    isAutocompleteLoading,
    showAutocomplete,
  ]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts or intervals
      if (reactRoot) {
        try {
          (reactRoot as ReturnType<typeof createRoot>).unmount();
        } catch (error) {
          console.warn('Kalifind Search: Error during final cleanup:', error);
        }
      }
    };
  }, [reactRoot]);

  if (!isOpen && !isAnimating) return null;

  return <div ref={shadowHostRef} style={{ display: 'contents' }} />;
};

export default ShadowDOMSearchDropdown;
