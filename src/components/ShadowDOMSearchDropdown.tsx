import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { X, Search } from "lucide-react";
import ScrollToTop from "./ScrollToTop";
import { ShadowDOMSearchDropdownProps } from "../types";
import KalifindSearchDesktop from "./KalifindSearchDesktop";
import KalifindSearchMobile from "./KalifindSearchMobile";

// Lazy load the EcommerceSearch component
const EcommerceSearch = lazy(() => import("./KalifindSearch.tsx"));

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const shadowInitializedRef = useRef(false);

  // Fuzzy matching function for better autocomplete
  const fuzzyMatch = (query: string, suggestion: string): boolean => {
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
  };

  // Function to score and sort suggestions by relevance
  const scoreSuggestion = (query: string, suggestion: string): number => {
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
  };

  // Check if device is mobile or tablet (using 1280px breakpoint)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1280); // 1280px breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Reset shadow initialization flag when component closes
        shadowInitializedRef.current = false;
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Autocomplete logic for mobile
  useEffect(() => {
    if (!storeUrl || !searchQuery.trim()) {
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsAutocompleteLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("q", searchQuery);
        params.append("storeUrl", storeUrl);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`,
          {}
        );

        if (!response.ok) {
          throw new Error("bad response");
        }

        const result = await response.json();
        
        // Better handling of different response formats
        let rawSuggestions: string[] = [];
        if (Array.isArray(result)) {
          rawSuggestions = result.map((r: any) => {
            // Handle different possible field names
            return r.title || r.name || r.product_title || r.product_name || String(r);
          }).filter(Boolean);
        } else if (result && Array.isArray(result.suggestions)) {
          rawSuggestions = result.suggestions.map((s: any) => String(s));
        } else if (result && Array.isArray(result.products)) {
          rawSuggestions = result.products.map((r: any) => {
            return r.title || r.name || r.product_title || r.product_name || String(r);
          }).filter(Boolean);
        }

        // Apply fuzzy matching and scoring to improve suggestions
        const query = searchQuery.trim();
        const scoredSuggestions = rawSuggestions
          .map(suggestion => ({
            text: suggestion,
            score: scoreSuggestion(query, suggestion)
          }))
          .filter(item => item.score > 0) // Only include suggestions with positive scores
          .sort((a, b) => b.score - a.score) // Sort by score (highest first)
          .map(item => item.text)
          .slice(0, 10); // Limit to top 10 suggestions

        console.log("Mobile raw suggestions:", rawSuggestions);
        console.log("Mobile filtered and scored suggestions:", scoredSuggestions);
        
        setAutocompleteSuggestions(scoredSuggestions);
        setHighlightedSuggestionIndex(-1); // Reset highlight when new suggestions arrive
      } catch (error) {
        console.error("Failed to fetch autocomplete suggestions:", error);
        setAutocompleteSuggestions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, storeUrl]);

  // Click outside handler for autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Shadow DOM
  useEffect(() => {
    if (shadowHostRef.current && !shadowRoot && isOpen && !shadowInitializedRef.current) {
      // Check if element already has a shadow root
      if (shadowHostRef.current.shadowRoot) {
        console.warn("Kalifind Search: Element already has a shadow root, reusing existing one");
        setShadowRoot(shadowHostRef.current.shadowRoot);
        shadowInitializedRef.current = true;
        return;
      }
      
      let shadow: ShadowRoot;
      try {
        // Create shadow root with closed mode for better isolation
        shadow = shadowHostRef.current.attachShadow({ mode: "closed" });
        setShadowRoot(shadow);
        shadowInitializedRef.current = true;
      } catch (error) {
        console.error("Kalifind Search: Failed to create shadow DOM:", error);
        // If shadow DOM creation fails, try to find an existing shadow root
        if (shadowHostRef.current.shadowRoot) {
          console.warn("Kalifind Search: Using existing shadow root after error");
          setShadowRoot(shadowHostRef.current.shadowRoot);
          shadowInitializedRef.current = true;
        } else {
          // If no shadow root exists and creation failed, skip shadow DOM
          console.warn("Kalifind Search: Skipping shadow DOM initialization");
          shadowInitializedRef.current = true;
          return;
        }
      }

      // Create a container div inside shadow DOM
      const shadowContainer = document.createElement("div");
      shadowContainer.id = "kalifind-shadow-container";
      shadow.appendChild(shadowContainer);

      // Create React root inside shadow DOM
      const root = createRoot(shadowContainer);
      setReactRoot(root);

      // Comprehensive style injection for Shadow DOM
      const injectStyles = () => {
        // 1) Base reset and container styles
        const baseStyle = document.createElement("style");
        baseStyle.textContent = `
          /* CSS Reset */
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          /* Base container */
          .kalifind-shadow-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background-color: #ffffff;
            font-size: 16px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            overflow: hidden;
          }

          /* Ensure all elements inherit proper styles */
          .kalifind-shadow-container * {
            font-family: inherit;
            line-height: inherit;
            color: inherit;
          }

          /* Override any potential conflicts */
          .kalifind-shadow-container input,
          .kalifind-shadow-container button,
          .kalifind-shadow-container div,
          .kalifind-shadow-container span,
          .kalifind-shadow-container p,
          .kalifind-shadow-container h1,
          .kalifind-shadow-container h2,
          .kalifind-shadow-container h3,
          .kalifind-shadow-container h4,
          .kalifind-shadow-container h5,
          .kalifind-shadow-container h6 {
            font-family: inherit;
            line-height: inherit;
            color: inherit;
          }

          /* Ensure proper display properties */
          .kalifind-shadow-container div { display: block; }
          .kalifind-shadow-container span { display: inline; }
          .kalifind-shadow-container button { 
            display: inline-block; 
            cursor: pointer;
          }
          .kalifind-shadow-container input { display: inline-block; }
          .kalifind-shadow-container img { 
            display: block; 
            max-width: 100%; 
            height: auto; 
          }
        `;
        shadow.appendChild(baseStyle);

        // 2) Inject Tailwind CSS from CDN
        const tailwindLink = document.createElement("link");
        tailwindLink.rel = "stylesheet";
        tailwindLink.href = "https://cdn.tailwindcss.com/3.4.0";
        shadow.appendChild(tailwindLink);

        // 3) Inject our custom CSS variables and styles
        const customStyle = document.createElement("style");
        customStyle.textContent = `
          /* CSS Custom Properties for consistent theming */
          .kalifind-shadow-container {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 264 83% 58%;
            --primary-foreground: 0 0% 100%;
            --primary-hover: 264 83% 52%;
            --secondary: 250 7% 97%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 250 7% 97%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 264 83% 95%;
            --accent-foreground: 264 83% 25%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 220 13% 91%;
            --input: 220 13% 91%;
            --ring: 264 83% 58%;
            --search-highlight: 264 83% 58%;
            --search-bar: 0 0% 98%;
            --filter-bg: 0 0% 100%;
            --loading: 220 13% 91%;
            --loading-shimmer: 0 0% 98%;
            --radius: 0.5rem;
            --sidebar-background: 0 0% 98%;
            --sidebar-foreground: 240 5.3% 26.1%;
            --sidebar-primary: 240 5.9% 10%;
            --sidebar-primary-foreground: 0 0% 98%;
            --sidebar-accent: 240 4.8% 95.9%;
            --sidebar-accent-foreground: 240 5.9% 10%;
            --sidebar-border: 220 13% 91%;
            --sidebar-ring: 217.2 91.2% 59.8%;
          }

          /* Dark mode variables */
          .kalifind-shadow-container.dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --popover: 222.2 84% 4.9%;
            --popover-foreground: 210 40% 98%;
            --primary: 210 40% 98%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 212.7 26.8% 83.9%;
            --sidebar-background: 240 5.9% 10%;
            --sidebar-foreground: 240 4.8% 95.9%;
            --sidebar-primary: 224.3 76.3% 48%;
            --sidebar-primary-foreground: 0 0% 100%;
            --sidebar-accent: 240 3.7% 15.9%;
            --sidebar-accent-foreground: 240 4.8% 95.9%;
            --sidebar-border: 240 3.7% 15.9%;
            --sidebar-ring: 217.2 91.2% 59.8%;
          }

          /* Base layer styles */
          .kalifind-shadow-container * {
            border-color: hsl(var(--border));
          }

          .kalifind-shadow-container body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }

          /* Custom animations */
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }

          @keyframes slide-down {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slide-up {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(-100%);
              opacity: 0;
            }
          }

          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          /* Apply animations */
          .kalifind-shadow-container .animate-shimmer {
            animation: shimmer 2s infinite;
          }

          .kalifind-shadow-container .animate-pulse-slow {
            animation: pulse-slow 2s infinite;
          }

          .kalifind-shadow-container .animate-slide-down {
            animation: slide-down 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .kalifind-shadow-container .animate-slide-up {
            animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.6, 1);
          }

          .kalifind-shadow-container .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .kalifind-shadow-container {
              font-size: 14px;
            }
          }

          @media (max-width: 480px) {
            .kalifind-shadow-container {
              font-size: 12px;
            }
          }
        `;
        shadow.appendChild(customStyle);

        // 4) Try to copy any existing styles from the main document that might be ours
        const headStyles = Array.from(
          document.head.querySelectorAll<HTMLStyleElement>("style")
        );
        headStyles.forEach((styleEl) => {
          const css = styleEl.textContent || "";
          // Look for our distinctive CSS patterns
          if (
            css.includes("--ring: 264 83% 58%") ||
            css.includes("@layer base") ||
            css.includes("--tw-") ||
            css.includes("kalifind") ||
            css.includes("search-highlight")
          ) {
            const clone = styleEl.cloneNode(true) as HTMLStyleElement;
            shadow.appendChild(clone);
          }
        });

        // 5) Copy any link stylesheets that might be ours
        const linkEls = Array.from(
          document.head.querySelectorAll<HTMLLinkElement>(
            'link[rel="stylesheet"]'
          )
        );
        linkEls.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (/kalifind|search|cdn|kalifinder/i.test(href)) {
            const clone = link.cloneNode(true) as HTMLLinkElement;
            shadow.appendChild(clone);
          }
        });
      };

      injectStyles();
    }

    return () => {
      if (reactRoot) {
        // Use setTimeout to avoid unmounting during render
        setTimeout(() => {
          try {
            (reactRoot as ReturnType<typeof createRoot>).unmount();
            setReactRoot(null);
          } catch (error) {
            console.warn("Kalifind Search: Error during React root cleanup:", error);
          }
        }, 0);
      }
    };
  }, [isOpen, shadowRoot, reactRoot]);

  // Render content inside Shadow DOM
  useEffect(() => {
    if (reactRoot && shadowRoot && isOpen) {
      const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const query = event.currentTarget.value;
          
          // If there's a highlighted suggestion, use that instead
          if (highlightedSuggestionIndex >= 0 && autocompleteSuggestions[highlightedSuggestionIndex]) {
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
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          if (showAutocomplete && autocompleteSuggestions.length > 0) {
            setHighlightedSuggestionIndex(prev => 
              prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
            );
          }
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          if (showAutocomplete && autocompleteSuggestions.length > 0) {
            setHighlightedSuggestionIndex(prev => 
              prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
            );
          }
        } else if (event.key === "Escape") {
          setShowAutocomplete(false);
          setHighlightedSuggestionIndex(-1);
          setAutocompleteSuggestions([]);
          inputRef.current?.blur();
        }
      };

      const handleSearch = (query: string) => {
        console.log("Mobile handleSearch called with:", query);
        setSearchQuery(query);
        // Show autocomplete when user starts typing
        if (query.trim()) {
          setShowAutocomplete(true);
        } else {
          // Hide autocomplete when input is cleared
          setShowAutocomplete(false);
          setAutocompleteSuggestions([]);
          setHighlightedSuggestionIndex(-1);
        }
      };

      const handleSuggestionClick = (suggestion: string) => {
        console.log("Mobile suggestion clicked:", suggestion);
        
        try {
          setSearchQuery(suggestion);
          setShowAutocomplete(false);
          setHighlightedSuggestionIndex(-1);
          setAutocompleteSuggestions([]);
          // Blur input to close mobile keyboard
          inputRef.current?.blur();
        } catch (error) {
          console.error("Error in ShadowDOM handleSuggestionClick:", error);
        }
      };


      // Custom EcommerceSearch wrapper that hides header on mobile/tablet
      const EcommerceSearchWrapper = () => (
        <div className="w-full px-2 sm:px-4">
          <EcommerceSearch
            storeUrl={storeUrl}
            onClose={onClose}
            searchQuery={searchQuery}
            hideHeader={isMobileOrTablet} // Pass flag to hide header on mobile/tablet
          />
        </div>
      );

      const content = (
        <div className="fixed inset-0 z-50 min-h-screen">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
          />

          {/* Dropdown Panel */}
          <div
            className={`fixed inset-0 bg-background shadow-xl transition-all duration-500 overflow-y-auto ${
              isOpen ? "animate-slide-down" : "animate-slide-up"
            }`}
            style={{
              maxHeight: "100vh",
              overflowY: "auto",
            }}
          >
            <div className="w-full h-full overflow-y-auto">
              {isMobileOrTablet ? (
                // Mobile/Tablet: Use KalifindSearchMobile component
                <div className="w-full h-full">
                  {/* Mobile search header at top */}
                  <KalifindSearchMobile
                    searchRef={searchRef}
                    inputRef={inputRef}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    handleKeyDown={handleKeyDown}
                    onClose={onClose}
                    showAutocomplete={showAutocomplete}
                    setShowAutocomplete={setShowAutocomplete}
                    autocompleteSuggestions={autocompleteSuggestions}
                    isAutocompleteLoading={isAutocompleteLoading}
                    handleSuggestionClick={handleSuggestionClick}
                    highlightedSuggestionIndex={highlightedSuggestionIndex}
                    setHighlightedSuggestionIndex={setHighlightedSuggestionIndex}
                  />

                  {/* Content area below search */}
                  <div className="w-full min-h-[calc(100vh-80px)]">
                    <Suspense
                      fallback={
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="flex space-x-2 mb-4">
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Loading products...
                          </p>
                        </div>
                      }
                    >
                      <EcommerceSearchWrapper />
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
                    hideHeader={false}
                  />
                </Suspense>
              )}
            </div>

            {/* Scroll to Top Button */}
            <ScrollToTop showAfter={200} className="z-50" />
          </div>
        </div>
      );

      (reactRoot as ReturnType<typeof createRoot>).render(content);
    }
  }, [
    reactRoot,
    shadowRoot,
    isOpen,
    isMobileOrTablet,
    searchQuery,
    storeUrl,
    onClose,
  ]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts or intervals
      if (reactRoot) {
        try {
          (reactRoot as ReturnType<typeof createRoot>).unmount();
        } catch (error) {
          console.warn("Kalifind Search: Error during final cleanup:", error);
        }
      }
    };
  }, []);

  if (!isOpen && !isAnimating) return null;

  return <div ref={shadowHostRef} style={{ display: "contents" }} />;
};

export default ShadowDOMSearchDropdown;