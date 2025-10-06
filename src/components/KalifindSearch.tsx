import { ChevronDown, Filter, Search, ShoppingCart, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { apiService } from "@/services/api.service";
import { getUBIClient } from "@/analytics/ubiClient";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { addToCart, handleCartError } from "@/utils/cart";

import { FilterState, Product } from "../types";
import { isAutocompleteResponse, isSearchResponse } from "../types/api.types";
import { getErrorMessage } from "../utils/error";
import Recommendations from "./Recommendations";

const KalifindSearch: React.FC<{
  storeUrl?: string | undefined;
  onClose?: () => void;
  searchQuery?: string;
  setSearchQuery: (query: string) => void;
  hasSearched: boolean;
  setHasSearched: (hasSearched: boolean) => void;
  hideHeader?: boolean;
}> = ({
  onClose,
  searchQuery,
  setSearchQuery,
  hasSearched,
  setHasSearched,
  hideHeader = false,
  // storeUrl = "https://findifly.kinsta.cloud",
  storeUrl = "https://findifly-dev.myshopify.com",
}) => {
    // Determine if this is a Shopify store
    const isShopifyStore = storeUrl?.includes('myshopify.com') || storeUrl?.includes('shopify');
    
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
    const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
    const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
    const [isPriceLoading, setIsPriceLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);
    const [displayedProducts, setDisplayedProducts] = useState(0);

    // New state variables for search behavior
    const [showRecommendations, setShowRecommendations] = useState(true);
  const [isSearchingFromSuggestion, setIsSearchingFromSuggestion] = useState(false);
  const [forceSearch, setForceSearch] = useState(0);
  const [isFromSuggestionSelection, setIsFromSuggestionSelection] = useState(false);
  const lastActionRef = useRef<'typing' | 'suggestion' | null>(null);
  const userTypingRef = useRef(false);
  const lastSearchedQueryRef = useRef<string | null>(null);
  const lastSearchedFiltersRef = useRef<string>("");

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationsFetched, setRecommendationsFetched] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialState, setIsInitialState] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number>(10000); // Default max price
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{
    [key: string]: number;
  }>({});
  const [brandCounts, setBrandCounts] = useState<{
    [key: string]: number;
  }>({});
  const [colorCounts, setColorCounts] = useState<{
    [key: string]: number;
  }>({});
  const [sizeCounts, setSizeCounts] = useState<{
    [key: string]: number;
  }>({});
  const [tagCounts, setTagCounts] = useState<{
    [key: string]: number;
  }>({});
  const [stockStatusCounts, setStockStatusCounts] = useState<{
    [key: string]: number;
  }>({});
  const [featuredCount, setFeaturedCount] = useState(0);
  const [notFeaturedCount, setNotFeaturedCount] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [notSaleCount, setNotSaleCount] = useState(0);
  const [sortOption, setSortOption] = useState("default");

    // State for optional filters - only show if vendor has configured them
    const [showOptionalFilters, setShowOptionalFilters] = useState({
      brands: false,
      colors: false,
      tags: false,
    });

    // Cart functionality state
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [cartMessage, setCartMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 10000], // Default price range
    colors: [],
    sizes: [],
    brands: [],
    genders: [],
    tags: [],
    // Mandatory facets
    stockStatus: [],
    featuredProducts: [],
    saleStatus: [],
  });

    // Detect mobile device
    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 1280);
      };

      checkIsMobile();
      window.addEventListener("resize", checkIsMobile);

      return () => window.removeEventListener("resize", checkIsMobile);
    }, []);

    // Load recent searches from localStorage on mount
    useEffect(() => {
      try {
        const storedSearches = localStorage.getItem("recentSearches");
        if (storedSearches) {
          const parsed: unknown = JSON.parse(storedSearches);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
            setRecentSearches(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to parse recent searches from localStorage", error);
        setRecentSearches([]);
      }
    }, []);

    // Save recent searches to localStorage
    useEffect(() => {
      try {
        if (recentSearches.length > 0) {
          localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
        } else {
          localStorage.removeItem("recentSearches");
        }
      } catch (error) {
        console.error("Failed to save recent searches to localStorage", error);
      }
    }, [recentSearches]);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const debouncedPriceRange = useDebounce(filters.priceRange, 300);

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

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isAnyFilterActive =
      !!debouncedSearchQuery ||
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.colors.length > 0 ||
      filters.sizes.length > 0 ||
      filters.tags.length > 0 ||
      filters.priceRange[1] < maxPrice ||
      filters.stockStatus.length > 0 ||
      filters.featuredProducts.length > 0 ||
      filters.saleStatus.length > 0;

    // Show filters if user has searched, has typed something, or filters are active
    const shouldShowFilters = showFilters || isAnyFilterActive || (searchQuery && searchQuery.trim().length > 0);


    // Fetch vendor facet configuration
    const fetchFacetConfiguration = useCallback(async () => {
      if (!storeUrl) return;

      try {
        const result = await apiService.fetchFacetConfiguration(storeUrl);

        // Update optional filters visibility based on vendor configuration
        setShowOptionalFilters({
          brands: result.some(
            (facet: { field: string; visible: boolean }) =>
              facet.field === "brand" && facet.visible,
          ),
          colors: result.some(
            (facet: { field: string; visible: boolean }) =>
              facet.field === "color" && facet.visible,
          ),
          tags: result.some(
            (facet: { field: string; visible: boolean }) =>
              facet.field === "tags" && facet.visible,
          ),
        });
      } catch (error) {
        console.error("Failed to fetch facet configuration:", error);
        // Keep default values (all false)
      }
    }, [storeUrl]);

    // Fetch vendor-controlled recommendations
    const fetchRecommendations = useCallback(async () => {
      if (!storeUrl || recommendationsFetched) return;
      try {
        // First check if vendor has configured recommendations
        const configResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/recommendations/config?storeUrl=${storeUrl}`,
          {}
        );

        if (!configResponse.ok) {
          // If no config exists, don't show recommendations
          setRecommendations([]);
          return;
        }

        const config = (await configResponse.json()) as { enabled?: boolean };

        // Only fetch recommendations if vendor has enabled them
        if (!config.enabled) {
          setRecommendations([]);
          return;
        }

        // Fetch only vendor-configured recommendations
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/search/recommended?storeUrl=${storeUrl}&type=vendor-configured`,
          {}
        );

        if (!response.ok) {
          // If vendor-configured recommendations fail, don't show any
          setRecommendations([]);
          return;
        }

        const result = (await response.json()) as unknown;
        console.log("Recommendations API response:", result);

        // Handle response format with type safety
        let products: Product[];
        if (Array.isArray(result)) {
          products = result as Product[];
        } else if (isSearchResponse(result)) {
          const { products: responseProducts } = result;
          products = responseProducts;
        } else if (result && typeof result === 'object' && Array.isArray((result as any).products)) {
          // Handle recommendations response format
          products = (result as any).products;
        } else {
          console.log("No products found in recommendations response");
          products = [];
        }

        console.log("Setting recommendations:", products);
        setRecommendations(products); // Show all recommendations
        setRecommendationsFetched(true);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setRecommendations([]);
      }
    }, [storeUrl]);

    // Search behavior state management according to search.md requirements
    useEffect(() => {
      if (!searchQuery && !hasSearched) {
        // First Open (Initial State)
        // - Search box is empty
        // - Show Recommendations + Popular Searches
        // - Do NOT fetch all products yet (skip all-products fetch if showing recommendations + popular)
        // - Filter sidebar is NOT visible
        // - Show recent/latest searches below the search input
        setShowRecommendations(true);
        setShowFilters(false);
        setIsInitialState(true);
      } else if (!searchQuery && hasSearched) {
        // User Clears Search (after typing at least once)
        // - Fetch all products and display in results
        // - Keep filter sidebar visible
        // - Filter data is fetched/derived only once (from the first all-products fetch) and reused afterward
        setShowRecommendations(false);
        setShowFilters(true);
        setIsInitialState(false);
      } else if (searchQuery) {
        // User Starts Typing / Searching
        // - Show filter sidebar (remains visible for subsequent searches)
        // - Show skeleton loaders until results load
        // - Show suggestions/autocomplete based on typed input
        // - Clicking a suggestion: Sets the clicked value into the search input, automatically triggers a search for that value, saves the clicked value into recent searches
        setShowRecommendations(false);
        setShowFilters(true);
        setIsInitialState(false);
        setHasSearched(true);
      }
    }, [searchQuery, storeUrl, setHasSearched, hasSearched]);

  useEffect(() => {
    fetchRecommendations();
    fetchFacetConfiguration();
  }, [fetchRecommendations, fetchFacetConfiguration]);

    useEffect(() => {
      const initFilters = () => {
        if (!storeUrl || isInitialState) return;

      const fetchWithRetry = async (retries = 3) => {
        try {
          const params = new URLSearchParams();
          params.append("storeUrl", storeUrl);
          params.append("limit", "1000"); // Add high limit to fetch all products for filter counts

            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
              {}
            );

            if (!response.ok) {
              throw new Error("bad response");
            }

            const result = (await response.json()) as unknown;

          // Handle both array and object response formats
          let products: Product[];
          if (Array.isArray(result)) {
            products = result;
          } else if (isSearchResponse(result)) {
            products = result.products;
          } else {
            console.error(
              "Kalifind Search: Unexpected API response format:",
              result,
            );
            return;
          }

            if (products.length > 0) {
              setTotalProducts(products.length);
              const prices = products
                .map((p: Product) => parseFloat(p.price))
                .filter((p) => !isNaN(p));
              if (prices.length > 0) {
                const max = Math.max(...prices);
                setMaxPrice(max);
                setFilters((prev: FilterState) => ({
                  ...prev,
                  priceRange: [0, max],
                }));
              }

            const allCategories = new Set<string>();
            const allBrands = new Set<string>();
            const allColors = new Set<string>();
            const allSizes = new Set<string>();
            const allTags = new Set<string>();
            const categoryCounts: { [key: string]: number } = {};
            const brandCounts: { [key: string]: number } = {};
            const colorCounts: { [key: string]: number } = {};
            const sizeCounts: { [key: string]: number } = {};
            const tagCounts: { [key: string]: number } = {};
            const stockStatusCounts: { [key: string]: number } = {};
            let featuredCount = 0;
            let notFeaturedCount = 0;
            let saleCount = 0;
            let notSaleCount = 0;

            // products.forEach((product: Product) => {
            products.forEach((product: any) => {
              if (product.categories) {
                product.categories.forEach((cat: string) => {
                  allCategories.add(cat);
                  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
              }
              if (product.brands) {
                product.brands.forEach((brand: string) => {
                  allBrands.add(brand);
                  brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                });
              }
              if (product.colors) {
                product.colors.forEach((color: string) => {
                  allColors.add(color);
                  colorCounts[color] = (colorCounts[color] || 0) + 1;
                });
              }
              if (product.sizes) {
                product.sizes.forEach((size: string) => {
                  allSizes.add(size);
                  sizeCounts[size] = (sizeCounts[size] || 0) + 1;
                });
              }
              if (product.tags) {
                product.tags.forEach((tag: string) => {
                  allTags.add(tag);
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
              }
              
              // Count stock status
              if (product.stockStatus) {
                stockStatusCounts[product.stockStatus] = (stockStatusCounts[product.stockStatus] || 0) + 1;
              }
              
              // Count featured products
              if (product.featured) {
                featuredCount++;
              } else {
                notFeaturedCount++;
              }
              
              // Count sale products - updated logic
              const isOnSale = product.salePrice && 
                  product.salePrice !== "" && 
                  product.salePrice !== "0" && 
                  product.salePrice !== "0.00" && 
                  product.regularPrice && 
                  parseFloat(product.salePrice) < parseFloat(product.regularPrice);
              
              if (isOnSale) {
                saleCount++;
              } else {
                notSaleCount++;
              }
            });

            setAvailableCategories(Array.from(allCategories));
            setAvailableBrands(Array.from(allBrands));
            setAvailableColors(Array.from(allColors));
            setAvailableSizes(Array.from(allSizes));
            setAvailableTags(Array.from(allTags));
            setCategoryCounts(categoryCounts);
            setBrandCounts(brandCounts);
            setColorCounts(colorCounts);
            setSizeCounts(sizeCounts);
            setTagCounts(tagCounts);
            setStockStatusCounts(stockStatusCounts);
            setFeaturedCount(featuredCount);
            setNotFeaturedCount(notFeaturedCount);
            setSaleCount(saleCount);
            setNotSaleCount(notSaleCount);
          }
        } catch (err) {
          if (retries > 0) {
            setTimeout(() => fetchWithRetry(retries - 1), 1000);
          } else {
            console.error("Failed to fetch initial filter data:", err);
          }
        } finally {
          setIsPriceLoading(false);
        }
      };

        void fetchWithRetry();
      };

      void initFilters();
    }, [storeUrl, isInitialState]);

    // Click outside handler
    // useEffect(() => {
    //   const handleClickOutside = (event: MouseEvent) => {
    //     const target = event.target as HTMLElement;
    //
    //     // First, check if click is on the search input itself
    //     if (inputRef.current && inputRef.current.contains(target)) {
    //       console.log("Click detected on search input, keeping autocomplete open");
    //       return;
    //     }
    //
    //     // Check if the click is on a suggestion item or autocomplete dropdown
    //     const isSuggestionClick = target.closest("[data-suggestion-item]");
    //     const isAutocompleteClick = target.closest("[data-autocomplete-dropdown]");
    //
    //     if (isSuggestionClick || isAutocompleteClick) {
    //       console.log(
    //         "Click detected on suggestion item or dropdown, not closing autocomplete",
    //       );
    //       return;
    //     }
    //
    //     // Check if click is within the search container
    //     if (searchRef.current && searchRef.current.contains(target)) {
    //       console.log("Click detected within search container, keeping autocomplete open");
    //       return;
    //     }
    //
    //     // Only close if click is truly outside everything
    //     console.log("Click outside detected, closing autocomplete");
    //     setShowAutocomplete(false);
    //   };
    //
    //   document.addEventListener("click", handleClickOutside);
    //   return () => document.removeEventListener("click", handleClickOutside);
    // }, []);

    // Autocomplete search
    useEffect(() => {
      if (!storeUrl) return;

      let isCancelled = false;

      // Only show autocomplete when user is actually typing and has a meaningful query
      // Skip autocomplete if the change is from selecting a suggestion or not from user typing
      if (searchQuery && searchQuery.length > 0 && debouncedSearchQuery?.trim() && userTypingRef.current && !isFromSuggestionSelection) {
        setShowAutocomplete(true);
        startTransition(() => {
          setIsAutocompleteLoading(true);
          void (async () => {
            try {
              const params = new URLSearchParams();
              params.append("q", debouncedSearchQuery.trim());
              params.append("storeUrl", storeUrl);

              const url = `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`;
              // Autocomplete API call

              const response = await fetch(url, {});

              if (!response.ok) {
                console.error("Autocomplete API error:", response.status, response.statusText);
                throw new Error("bad response");
              }

              const result = (await response.json()) as unknown;
              
              // Check if component is still mounted and not cancelled
              if (isCancelled) return;
              
              // Autocomplete API result processed

              // Better handling of different response formats with type safety
              let rawSuggestions: string[] = [];
              if (Array.isArray(result)) {
                rawSuggestions = (result as Product[])
                  .map((r: Product) => {
                    // Handle different possible field names with nullish coalescing
                    return r.title || (r.name ?? "Unknown Product");
                  })
                  .filter(Boolean);
              } else if (isAutocompleteResponse(result)) {
                const { suggestions } = result;
                if (suggestions.length > 0) {
                  rawSuggestions = suggestions.map((s: string) => String(s));
                }
              }

              // Apply fuzzy matching and scoring to improve suggestions
              const query = debouncedSearchQuery.trim();
              const scoredSuggestions = rawSuggestions
                .map((suggestion) => ({
                  text: suggestion,
                  score: scoreSuggestion(query, suggestion),
                }))
                .filter((item) => item.score > 0) // Only include suggestions with positive scores
                .sort((a, b) => b.score - a.score) // Sort by score (highest first)
                .map((item) => item.text)
                .slice(0, 10); // Limit to top 10 suggestions

              // Process suggestions
              if (!isCancelled) {
                setAutocompleteSuggestions(scoredSuggestions);
                setHighlightedSuggestionIndex(-1); // Reset highlight when new suggestions arrive
              }
            } catch (error) {
              if (!isCancelled) {
                console.error("Failed to fetch autocomplete suggestions:", error);
                setAutocompleteSuggestions([]);
              }
            } finally {
              if (!isCancelled) {
                setIsAutocompleteLoading(false);
              }
            }
          })();
        });
      } else {
        // Clear suggestions when search query is empty
        setShowAutocomplete(false);
        setAutocompleteSuggestions([]);
        setIsAutocompleteLoading(false);
      }

      return () => {
        isCancelled = true;
      };
    }, [debouncedSearchQuery, storeUrl, searchQuery, scoreSuggestion, isFromSuggestionSelection, userTypingRef]);

    // Extract search logic into a reusable function
    const performSearch = useCallback(
      (query: string) => {
        if (!storeUrl) return;

        startTransition(() => {
          setIsLoading(true);
          setCurrentPage(1);
          setHasMoreProducts(true);
          const fetchProducts = async () => {
            const abortController = new AbortController();
            if (
              typeof debouncedPriceRange[0] === "undefined" ||
              typeof debouncedPriceRange[1] === "undefined"
            ) {
              setFilteredProducts([]);
              setIsLoading(false);
              return;
            }

            try {
              const params = new URLSearchParams();
              if (query) {
                params.append("q", query);

              }
              if (storeUrl) {
                params.append("storeUrl", storeUrl);
              }

              if (filters.categories.length > 0) {
                console.log("🔍 Sending categories filter:", filters.categories);
                params.append("categories", filters.categories.join(","));
              }
              if (filters.colors.length > 0) {
                params.append("colors", filters.colors.join(","));
              }
              if (filters.sizes.length > 0) {
                params.append("sizes", filters.sizes.join(","));
              }
              if (filters.brands.length > 0) {
                params.append("brands", filters.brands.join(","));
              }
              if (filters.tags.length > 0) {
                params.append("tags", filters.tags.join(","));
              }
              // Mandatory facets
              if (filters.stockStatus.length > 0) {
                params.append("stockStatus", filters.stockStatus.join(","));
              }
              // Handle featured products filter
              if (filters.featuredProducts.length > 0) {
                if (filters.featuredProducts.includes("Featured") && !filters.featuredProducts.includes("Not Featured")) {
                  params.append("featured", "true");
                } else if (filters.featuredProducts.includes("Not Featured") && !filters.featuredProducts.includes("Featured")) {
                  params.append("featured", "false");
                }
                // If both are selected, don't add any featured filter (show all)
              }
              
              // Handle sale status filter
              if (filters.saleStatus.length > 0) {
                console.log("filterttttt",filters)
                if (filters.saleStatus.includes("On Sale") && !filters.saleStatus.includes("Not On Sale")) {
                  params.append("insale", "true");
                } else if (filters.saleStatus.includes("Not On Sale") && !filters.saleStatus.includes("On Sale")) {
                  params.append("insale", "false");
                }
                // If both are selected, don't add any sale filter (show all)
              }
              params.append("minPrice", debouncedPriceRange[0].toString());
              params.append("maxPrice", debouncedPriceRange[1].toString());
              params.append("page", "1");
              params.append("limit", "12");

              const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
                { signal: abortController.signal }
              );

              if (!response.ok) {
                throw new Error("bad response");
              }
              const result = (await response.json()) as unknown;

            // Handle paginated response format
            let products: Product[];
            let total = 0;
            let hasMore = false;

            if (isSearchResponse(result)) {
              products = result.products;
              total = result.total || 0;
              hasMore = result.hasMore || false;

              // Process facet data from API response
              if (result.facets) {
                // Process stock status facets (simplified like featured products)
                if (result.facets.instock && Array.isArray(result.facets.instock.buckets)) {
                  const stockStatusCounts: { [key: string]: number } = {};
                  result.facets.instock.buckets.forEach((bucket: any) => {
                    const status = bucket.key;
                    const displayName = status === "instock" ? "In Stock" : 
                                     status === "outofstock" ? "Out of Stock" : 
                                     status === "onbackorder" ? "On Backorder" : status;
                    stockStatusCounts[displayName] = bucket.doc_count;
                  });
                  setStockStatusCounts(stockStatusCounts);
                }

                // Process featured facets
                if (result.facets.featured && Array.isArray(result.facets.featured.buckets)) {
                  let featuredCount = 0;
                  let notFeaturedCount = 0;
                  result.facets.featured.buckets.forEach((bucket: any) => {
                    if (bucket.key_as_string === "true") {
                      featuredCount = bucket.doc_count;
                    } else if (bucket.key_as_string === "false") {
                      notFeaturedCount = bucket.doc_count;
                    }
                  });
                  setFeaturedCount(featuredCount);
                  setNotFeaturedCount(notFeaturedCount);
                }

                // Process sale facets
                if (result.facets.insale && Array.isArray(result.facets.insale.buckets)) {
                  let saleCount = 0;
                  let notSaleCount = 0;
                  result.facets.insale.buckets.forEach((bucket: any) => {
                    if (bucket.key_as_string === "true") {
                      saleCount = bucket.doc_count;
                    } else if (bucket.key_as_string === "false") {
                      notSaleCount = bucket.doc_count;
                    }
                  });
                  setSaleCount(saleCount);
                  setNotSaleCount(notSaleCount);
                }
              }

              // Debug: Log the first product to see what fields are available
              if (products.length > 0) {
                console.log("Search result product:", {
                  id: products[0].id,
                  title: products[0].title,
                  shopifyVariantId: products[0].shopifyVariantId,
                  shopifyProductId: products[0].shopifyProductId,
                  storeType: products[0].storeType,
                  availableFields: Object.keys(products[0]),
                });
              }
            } else if (Array.isArray(result)) {
              products = result;
              total = result.length;
              hasMore = false;

              // Debug: Log the first product to see what fields are available
              if (products.length > 0) {
                console.log("Search result product (array format):", {
                  id: products[0].id,
                  title: products[0].title,
                  shopifyVariantId: products[0].shopifyVariantId,
                  shopifyProductId: products[0].shopifyProductId,
                  storeType: products[0].storeType,
                  availableFields: Object.keys(products[0]),
                });
              }
            } else {
              console.error(
                "Kalifind Search: Unexpected search response format:",
                result,
              );
              products = [];
              total = 0;
              hasMore = false;
            }

              setFilteredProducts(products);
              setTotalProducts(total);
              setDisplayedProducts(products.length);
              setHasMoreProducts(hasMore);
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                console.log("Search request was cancelled");
                return;
              }
              console.error("Failed to fetch products:", error);
              setFilteredProducts([]);
            } finally {
              setIsLoading(false);
            }
          };

          void fetchProducts();
        });
      },
      [storeUrl, debouncedPriceRange, filters]
    );

    // search products
    useEffect(() => {
      // Skip search if we're in initial state showing recommendations
      if (isPriceLoading || !storeUrl || showRecommendations || isInitialState) {
        return; // Wait for the initial price to be loaded or skip if showing recommendations or in initial state
      }

      // Skip search if we're searching from a suggestion click (already handled)
      if (isSearchingFromSuggestion) {
        setIsSearchingFromSuggestion(false);
        return;
      }

      // Check if we've already searched for this exact query and filters
      const currentQuery = debouncedSearchQuery?.trim() || "";
      const currentFilters = JSON.stringify(filters);
      
      console.log("🔍 Search useEffect - Current filters:", filters);
      console.log("🔍 Search useEffect - Current query:", currentQuery);
      
      if (lastSearchedQueryRef.current === currentQuery && lastSearchedFiltersRef.current === currentFilters) {
        console.log("⏭️ Skipping search - same query and filters");
        return; // Skip if we've already searched for this query and filters combination
      }

      // Update the last searched query and filters
      lastSearchedQueryRef.current = currentQuery;
      lastSearchedFiltersRef.current = currentFilters;

      // Fetch all products when search query is empty, or perform search with query
      if (!debouncedSearchQuery?.trim()) {
        void performSearch(""); // Pass empty string to fetch all products
      } else {
        void performSearch(debouncedSearchQuery);
      }
    }, [
      isPriceLoading,
      debouncedSearchQuery,
      debouncedPriceRange,
      storeUrl,
      showRecommendations,
      isInitialState,
      isSearchingFromSuggestion,
      forceSearch,
      filters.categories,
      filters.colors,
      filters.sizes,
      filters.brands,
      filters.tags,
      filters.stockStatus,
      filters.featuredProducts,
      filters.saleStatus,
    ]);

    const sortedProducts = useMemo(() => {
      // Ensure filteredProducts is an array before processing
      if (!Array.isArray(filteredProducts)) {
        console.warn("Kalifind Search: filteredProducts is not an array:", filteredProducts);
        return [];
      }

      const productsToSort = [...filteredProducts];
      switch (sortOption) {
        case "a-z":
          return productsToSort.sort((a, b) => a.title.localeCompare(b.title));
        case "z-a":
          return productsToSort.sort((a, b) => b.title.localeCompare(a.title));
        case "price-asc":
          return productsToSort.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        case "price-desc":
          return productsToSort.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        default:
          return productsToSort;
      }
    }, [filteredProducts, sortOption]);

    const handleSearch = (query: string) => {
      // Handle search called
      setSearchQuery(query);
      setShowRecommendations(false);
      
      // Track search submission with UBI
      const ubiClient = getUBIClient();
      if (ubiClient && query.trim()) {
        ubiClient.trackSearchSubmitted(query.trim());
      }

      // Mark this as typing action and set user typing flag
      lastActionRef.current = 'typing';
      userTypingRef.current = true;

      // Always show autocomplete when user starts typing (even for single characters)
      // But not when the change is from selecting a suggestion
      if (query.length > 0 && !isFromSuggestionSelection) {
        setShowAutocomplete(true);
        setIsInteractingWithDropdown(false);
      } else {
        // Hide autocomplete when input is cleared
        setShowAutocomplete(false);
        setAutocompleteSuggestions([]);
        setHighlightedSuggestionIndex(-1);
        setIsInteractingWithDropdown(false);
      }

      // Reset the suggestion selection flag when user types (after the autocomplete logic)
      setIsFromSuggestionSelection(false);

      // Note: Recent searches are now only added on Enter key press or suggestion click
      // This prevents adding to recent searches just by typing
    };

    // Helper function to add to recent searches
    const addToRecentSearches = (query: string) => {
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches((prev) => {
          const newSearches = [query.trim(), ...prev.filter((item) => item !== query.trim())].slice(
            0,
            10
          );
          return newSearches;
        });
      }
    };


    const handleSuggestionClick = (suggestion: string) => {
      // Clicking a suggestion:
      // - Sets the clicked value into the search input
      // - The search useEffect will automatically trigger a search for that value
      // - Saves the clicked value into recent searches via Zustand and updates localStorage
      // Suggestion clicked

      // Set flag to prevent autocomplete from triggering
      setIsFromSuggestionSelection(true);
      lastActionRef.current = 'suggestion';
      userTypingRef.current = false; // Clear user typing flag

      // Close autocomplete completely
      setShowAutocomplete(false);
      setHighlightedSuggestionIndex(-1);
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
      setIsInteractingWithDropdown(false);

      // Add to recent searches
      addToRecentSearches(suggestion);

      // Update search behavior state
      setShowRecommendations(false);
      setShowFilters(true);
      setIsInitialState(false);
      setHasSearched(true);

      // Set the search query - the search useEffect will automatically trigger the search
      setSearchQuery(suggestion);

      // Blur input to close any mobile keyboards
      inputRef.current?.blur();
    };

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

        // Always trigger search on Enter, whether query is empty or not
        if (query.trim()) {
          // Add to recent searches only on Enter key press for non-empty queries
          addToRecentSearches(query);
        }

        // Close autocomplete and trigger search
        setShowAutocomplete(false);
        setHighlightedSuggestionIndex(-1);
        setAutocompleteSuggestions([]);

        // Trigger search immediately when Enter is pressed
        setShowRecommendations(false);
        setShowFilters(true);
        setIsInitialState(false);
        if (!hasSearched) {
          setHasSearched(true);
        }

        // Force a search by incrementing the forceSearch counter
        setForceSearch((prev) => prev + 1);

        inputRef.current?.blur();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (showAutocomplete && autocompleteSuggestions.length > 0) {
          setHighlightedSuggestionIndex((prev) =>
            prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
          );
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (showAutocomplete && autocompleteSuggestions.length > 0) {
          setHighlightedSuggestionIndex((prev) =>
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

    const handleRemoveRecentSearch = (search: string) => {
      setRecentSearches((prev) => prev.filter((item) => item !== search));
    };

    const handleClearRecentSearches = () => {
      setRecentSearches([]);
    };

    const handleCategoryChange = (category: string) => {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      }));
      
      // Track filter click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackFilterClick('category', category);
      }
    };

    const handleBrandChange = (brand: string) => {
      setFilters((prev) => ({
        ...prev,
        brands: prev.brands.includes(brand)
          ? prev.brands.filter((b) => b !== brand)
          : [...prev.brands, brand],
      }));
      
      // Track filter click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackFilterClick('brand', brand);
      }
    };

    const handleSizeChange = (size: string) => {
      setFilters((prev) => ({
        ...prev,
        sizes: prev.sizes.includes(size)
          ? prev.sizes.filter((s) => s !== size)
          : [...prev.sizes, size],
      }));
      
      // Track filter click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackFilterClick('size', size);
      }
    };

    const handleColorChange = (color: string) => {
      setFilters((prev) => ({
        ...prev,
        colors: prev.colors.includes(color)
          ? prev.colors.filter((c) => c !== color)
          : [...prev.colors, color],
      }));
      
      // Track filter click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackFilterClick('color', color);
      }
    };

    const handleTagChange = (tag: string) => {
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      }));
      
      // Track filter click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackFilterClick('tag', tag);
      }
    };

    // Mandatory facet handlers
    const handleStockStatusChange = (status: string) => {
      setFilters((prev) => ({
        ...prev,
        stockStatus: prev.stockStatus.includes(status)
          ? prev.stockStatus.filter((s) => s !== status)
          : [...prev.stockStatus, status],
      }));
    };

    const handleFeaturedProductsChange = (status: string) => {
      setFilters((prev) => ({
        ...prev,
        featuredProducts: prev.featuredProducts.includes(status)
          ? prev.featuredProducts.filter((s) => s !== status)
          : [...prev.featuredProducts, status],
      }));
    };

    const handleSaleStatusChange = (status: string) => {
      setFilters((prev) => ({
        ...prev,
        saleStatus: prev.saleStatus.includes(status)
          ? prev.saleStatus.filter((s) => s !== status)
          : [...prev.saleStatus, status],
      }));
    };

    // Load more products function
    const loadMoreProducts = useCallback(async () => {
      if (isLoadingMore || !hasMoreProducts) return;

      setIsLoadingMore(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearchQuery) {
          params.append("q", debouncedSearchQuery);
        }
        if (storeUrl) {
          params.append("storeUrl", storeUrl);
        }

        // Add all current filters
        if (filters.categories.length > 0) {
          params.append("categories", filters.categories.join(","));
        }
        if (filters.colors.length > 0) {
          params.append("colors", filters.colors.join(","));
        }
        if (filters.sizes.length > 0) {
          params.append("sizes", filters.sizes.join(","));
        }
        if (filters.brands.length > 0) {
          params.append("brands", filters.brands.join(","));
        }
        if (filters.tags.length > 0) {
          params.append("tags", filters.tags.join(","));
        }
        if (filters.stockStatus.length > 0) {
          // Map frontend stock status values to backend boolean values
          const stockStatusValues = filters.stockStatus.map(status => {
            if (status === "In Stock") return "true";
            if (status === "Out of Stock") return "false";
            if (status === "On Backorder") return "false";
            return "true"; // default to true for other values
          });
          params.append("instock", stockStatusValues.join(","));
        }
        // Handle featured products filter
        if (filters.featuredProducts.length > 0) {
          if (filters.featuredProducts.includes("Featured") && !filters.featuredProducts.includes("Not Featured")) {
            params.append("featured", "true");
          } else if (filters.featuredProducts.includes("Not Featured") && !filters.featuredProducts.includes("Featured")) {
            params.append("featured", "false");
          }
          // If both are selected, don't add any featured filter (show all)
        }
        
        // Handle sale status filter
        if (filters.saleStatus.length > 0) {
          if (filters.saleStatus.includes("On Sale") && !filters.saleStatus.includes("Not On Sale")) {
            params.append("insale", "true");
          } else if (filters.saleStatus.includes("Not On Sale") && !filters.saleStatus.includes("On Sale")) {
            params.append("insale", "false");
          }
          // If both are selected, don't add any sale filter (show all)
        }
        params.append("minPrice", debouncedPriceRange[0].toString());
        params.append("maxPrice", debouncedPriceRange[1].toString());

        params.append("page", (currentPage + 1).toString());
        params.append("limit", "12");

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
          {}
        );

        if (!response.ok) {
          throw new Error("Failed to load more products");
        }

        const result = (await response.json()) as unknown;
        let products: Product[];
        let hasMore = false;

        if (isSearchResponse(result)) {
          const { products: responseProducts, hasMore: responseHasMore } = result;
          products = responseProducts;
          hasMore = responseHasMore ?? false;
        } else if (Array.isArray(result)) {
          products = result as Product[];
          hasMore = false;
        } else {
          products = [];
          hasMore = false;
        }

        if (products.length === 0) {
          setHasMoreProducts(false);
        } else {
          setFilteredProducts((prev) => [...prev, ...products]);
          setDisplayedProducts((prev) => prev + products.length);
          setCurrentPage((prev) => prev + 1);
          setHasMoreProducts(hasMore);
        }
      } catch (error) {
        console.error("Failed to load more products:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }, [
      isLoadingMore,
      hasMoreProducts,
      debouncedSearchQuery,
      storeUrl,
      currentPage,
      filters,
      debouncedPriceRange,
    ]);

    // Infinite scroll observer for mobile
    useEffect(() => {
      if (!isMobile) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMoreProducts && !isLoadingMore) {
            void loadMoreProducts();
          }
        },
        { threshold: 0.1 }
      );

      const loadMoreTrigger = document.getElementById("load-more-trigger");
      if (loadMoreTrigger) {
        observer.observe(loadMoreTrigger);
      }

      return () => {
        if (loadMoreTrigger) {
          observer.unobserve(loadMoreTrigger);
        }
      };
    }, [isMobile, hasMoreProducts, isLoadingMore, loadMoreProducts]);

    // Function to calculate discount percentage
    const calculateDiscountPercentage = (regularPrice: string, salePrice: string): number | null => {
      try {
        const regular = parseFloat(regularPrice.replace(/[^\d.,]/g, "").replace(",", "."));
        const sale = parseFloat(salePrice.replace(/[^\d.,]/g, "").replace(",", "."));

        if (isNaN(regular) || isNaN(sale) || regular <= 0 || sale <= 0 || sale >= regular) {
          return null;
        }

        const discount = ((regular - sale) / regular) * 100;
        return Math.round(discount);
      } catch {
        return null;
      }
    };

    // Product click handler
    const handleProductClick = (product: Product) => {
      // Close autocomplete dropdown when product is clicked
      setShowAutocomplete(false);
      setAutocompleteSuggestions([]);
      setHighlightedSuggestionIndex(-1);
      
      // Track result click with UBI
      const ubiClient = getUBIClient();
      if (ubiClient) {
        const position = sortedProducts.findIndex(p => p.id === product.id) + 1;
        ubiClient.trackResultClick(product.id, position);
      }

      if (product.productUrl) {
        window.open(product.productUrl, "_blank");
      } else if (product.url) {
        window.open(product.url, "_blank");
      } else {
        console.warn("No product URL available for:", product.title);
      }
    };

    // Cart functionality
    const handleAddToCart = async (product: Product) => {
      if (!storeUrl) {
        console.error("Store URL is required for cart operations");
        return;
      }

      setAddingToCart(product.id);
      setCartMessage(null);

      try {
        const result = await addToCart(product, storeUrl);
        setCartMessage(result.message);

        // Clear message after 3 seconds
        setTimeout(() => {
          setCartMessage(null);
        }, 3000);
      } catch (error) {
        console.error("Add to cart failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        handleCartError(error as Error, product);
        setCartMessage(errorMessage);

        // Clear message after 3 seconds
        setTimeout(() => {
          setCartMessage(null);
        }, 3000);
      } finally {
        setAddingToCart(null);
      }
    };

    const LoadingSkeleton = () => (
      <div className="!grid !w-full !grid-cols-2 !gap-[16px] sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="!w-full !animate-pulse-slow !rounded-lg !bg-loading !p-[8px] md:!p-[16px]"
          >
            <div className="!relative !mb-[12px] !h-[128px] !overflow-hidden !rounded-md !bg-loading-shimmer md:!mb-[16px] md:!h-[192px]">
              <div className="!absolute !inset-0 !animate-shimmer !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent"></div>
            </div>
            <div className="!mb-[8px] !h-[16px] !rounded !bg-loading-shimmer"></div>
            <div className="!h-[24px] !w-[80px] !rounded !bg-loading-shimmer"></div>
          </div>
        ))}
      </div>
    );

    return (
      // <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px] lg:px-[96px]">
      <div className="box-border !min-h-screen w-screen !bg-background lg:pt-[4px]">
        {!hideHeader && (
          <div className="!w-full !bg-background pt-[12px] lg:px-[48px]">
            <div className="!mx-auto !flex !w-full flex-col !items-center justify-center lg:flex-row ">
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
                  <div className="flex !w-full ">
                    <div className="!relative !w-full !flex-1 !border-b-2 !border-search-highlight">
                      <Search className="!absolute !left-[7px] !top-1/2 !h-[20px] !w-[20px] !-translate-y-1/2 !transform !text-muted-foreground" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => {
                          // Input focused
                          if (searchQuery && searchQuery.length > 0 && userTypingRef.current && !isFromSuggestionSelection) {
                            setShowAutocomplete(true);
                            setIsInteractingWithDropdown(false);
                          }
                        }}
                        onBlur={(e) => {
                          // Input blurred
                          // Only close autocomplete if the blur is not caused by clicking on a suggestion
                          // or if the input is being cleared
                          const relatedTarget = e.relatedTarget as HTMLElement | null;
                          const isClickingOnSuggestion =
                            relatedTarget?.closest("[data-suggestion-item]") ??
                            relatedTarget?.closest("[data-autocomplete-dropdown]");

                          if (!isClickingOnSuggestion && !isInteractingWithDropdown) {
                            // Small delay to allow for suggestion clicks to process
                            setTimeout(() => {
                              setShowAutocomplete(false);
                            }, 100);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search"
                        className="!w-full !border-none !bg-inherit !py-[12px] !pl-[30px] !pr-[16px] !text-foreground !placeholder-muted-foreground focus:!border-none focus:!outline-none focus:!ring-0"
                      />

                      {/* <div className="!absolute !right-[12px] !top-1/2 !transform !-translate-y-1/2 !flex !gap-[8px]"></div> */}
                    </div>
                    <button
                      className="!flex-shrink-0 !rounded-lg !transition-colors !duration-200 hover:!bg-muted/20"
                      aria-label="Close search"
                      onClick={onClose}
                    >
                      <X className="!mr-[10px] !h-[25px] !w-[25px] font-bold !text-muted-foreground !transition-colors !duration-200 hover:!text-foreground" />
                    </button>
                  </div>
                </div>

                {showAutocomplete &&
                  searchQuery &&
                  searchQuery.length > 0 &&
                  (isAutocompleteLoading || autocompleteSuggestions.length > 0) && (
                    <div
                      data-autocomplete-dropdown="true"
                      className="!absolute !left-0 !right-0 !top-full !z-[9999999] !mt-[4px] !w-full !rounded-lg !border !border-border !bg-background !shadow-lg"
                      onMouseEnter={() => setIsInteractingWithDropdown(true)}
                      onMouseLeave={() => setIsInteractingWithDropdown(false)}
                    >
                      <div className="!p-[16px] [&_*]:!z-[9999999]">
                        {isAutocompleteLoading ? (
                          <div className="!flex !items-center !justify-center !gap-[8px] !py-[12px] !text-muted-foreground">
                            <div className="!h-4 !w-4 !animate-spin !rounded-full !border-2 !border-muted-foreground !border-t-transparent"></div>
                            <span>Loading suggestions...</span>
                          </div>
                        ) : autocompleteSuggestions.length > 0 ? (
                          <>
                            <h3 className="!mb-[12px] !text-[14px] !font-medium leading-[6px] !text-foreground">
                              Suggestions
                            </h3>
                            <div className="!space-y-[8px]">
                              {autocompleteSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  data-suggestion-item="true"
                                  className={`z-[9999999] !flex !cursor-pointer !items-center !gap-[8px] !rounded !p-[8px] hover:!bg-muted ${index === highlightedSuggestionIndex ? "!bg-muted" : ""
                                    }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Prevent click outside from interfering
                                    e.nativeEvent.stopImmediatePropagation();
                                    setIsInteractingWithDropdown(false);
                                    handleSuggestionClick(suggestion);
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Prevent click outside from interfering
                                    e.nativeEvent.stopImmediatePropagation();
                                  }}
                                >
                                  <Search className="!h-[16px] !w-[16px] !text-muted-foreground" />
                                  <span className="pointer-events-none !text-muted-foreground">
                                    {suggestion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="!flex !flex-col !items-center !justify-center !py-6 !text-center !duration-300 !animate-in !fade-in">
                            <div className="!mb-3 !flex !h-10 !w-10 !items-center !justify-center !rounded-full !bg-muted !duration-500 !animate-in !zoom-in">
                              <Search className="!h-5 !w-5 !text-muted-foreground" />
                            </div>
                            <div className="!duration-500 !animate-in !slide-in-from-bottom-2">
                              <p className="!mb-1 !text-sm !font-medium !text-foreground">
                                Search not found
                              </p>
                              <p className="!text-xs !text-muted-foreground">
                                No suggestions found for "{searchQuery}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

      <div
        className={`!fixed !bottom-[16px] !left-1/2 !-translate-x-1/2 !z-50 ${shouldShowFilters ? "!block xl:!hidden" : "!hidden"}`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <button className="!flex !items-center !gap-[8px] !px-[16px] !py-[12px] !bg-primary !text-primary-foreground !rounded-full !font-medium !shadow-lg !hover:!bg-primary-hover !transition-all !duration-300 !transform !hover:!scale-105">
              <Filter className="!w-[16px] !h-[16px]" />
              Filters
              <span className="!bg-primary-foreground !text-primary !px-[8px] !py-[4px] !rounded-full !text-xs !font-bold">
                {filters.categories.length +
                  filters.colors.length +
                  filters.sizes.length +
                  filters.brands.length +
                  filters.tags.length +
                  filters.stockStatus.length +
                  filters.featuredProducts.length +
                  filters.saleStatus.length}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="!z-[100000] !flex !flex-col max-h-[93vh]">
            <div className="!px-[16px] sm:!p-[16px] !overflow-y-auto !flex-1">
              <Accordion
                type="multiple"
                defaultValue={[
                  "category",
                  "price",
                  "size",
                  "stockStatus",
                  ...(isShopifyStore ? [] : ["featured"]),
                  "sale",
                  "color",
                  "brand",
                  "tags",
                ]}
                className="!w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {availableCategories.map((category) => (
                        <label
                          key={category}
                          className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[24px]">
                              {category}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                            {categoryCounts[category] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {showOptionalFilters.brands && (
                  <AccordionItem value="brand">
                    <AccordionTrigger className="!font-extrabold text-[16px]">
                      Brand
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {availableBrands.map((brand) => (
                          <label
                            key={brand}
                            className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.brands.includes(brand)}
                                onChange={() => handleBrandChange(brand)}
                                className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                              />
                              <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                                {brand}
                              </span>
                            </div>
                            <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                              {brandCounts[brand] || 0}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {!isPriceLoading && (
                  <AccordionItem value="price">
                    <AccordionTrigger className="!font-extrabold text-[16px]">
                      <b className="!font-extrabold">Price</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[16px] !pt-[16px]">
                        <Slider
                          value={[filters.priceRange[1]]}
                          onValueChange={(value: number[]) =>
                            setFilters((prev: FilterState) => ({
                              ...prev,
                              priceRange: [prev.priceRange[0], value[0]],
                            }))
                          }
                          max={maxPrice}
                          step={10}
                          className="!w-full"
                        />
                        <div className="!flex !justify-between !text-[14px] !text-muted-foreground">
                          <span>{filters.priceRange[0]} €</span>
                          <span>{filters.priceRange[1]} €</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="size">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Size</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!grid !grid-cols-4 !gap-[8px] !pt-[16px]">
                      {availableSizes.map((size) => (
                        <div
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`my-border !rounded-lg !py-[8px] !text-[12px] sm:!py-[12px] sm:!text-[14px] !font-medium text-center ${
                            filters.sizes.includes(size)
                              ? "!bg-primary !text-primary-foreground"
                              : ""
                          }`}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {showOptionalFilters.colors && (
                  <AccordionItem value="color">
                    <AccordionTrigger className="!font-extrabold text-[16px]">
                      <b className="!font-extrabold">Color</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!flex !gap-[8px] !flex-wrap !pt-[16px]">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`!w-[32px] !h-[32px] sm:!w-[40px] sm:!h-[40px] !rounded-full !border-4 !transition-all ${
                              filters.colors.includes(color)
                                ? "!border-primary !scale-110 !shadow-lg"
                                : "!border-border hover:!border-muted-foreground"
                            }`}
                            style={{
                              backgroundColor: color.toLowerCase(),
                              transform: filters.colors.includes(color)
                                ? "scale(1.1)"
                                : "scale(1)",
                            }}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {showOptionalFilters.tags && (
                  <AccordionItem value="tags">
                    <AccordionTrigger className="!font-extrabold text-[16px]">
                      <b className="!font-extrabold">Tags</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {availableTags.map((tag) => (
                          <label
                            key={tag}
                            className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.tags.includes(tag)}
                                onChange={() => handleTagChange(tag)}
                                className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                              />
                              <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                                {tag}
                              </span>
                            </div>
                            <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                              {tagCounts[tag] || 0}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                  {/* Mandatory Facets for Mobile */}
                  <AccordionItem value="stockStatus">
                    <AccordionTrigger className="text-[16px] !font-extrabold">
                      <b className="!font-extrabold">Stock Status</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {["In Stock", "Out of Stock", "On Backorder"].map((status) => (
                          <label
                            key={status}
                            className="!flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] hover:!bg-muted sm:!p-[8px]"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.stockStatus.includes(status)}
                                onChange={() => handleStockStatusChange(status)}
                                className="!h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary sm:!h-5 sm:!w-5 "
                              />
                              <span className="!text-[14px] !text-foreground sm:!text-[16px] lg:leading-[16px]">
                                {status}
                              </span>
                            </div>
                            <span className="!rounded !bg-muted !px-[8px] !py-[4px] !text-[12px] !text-muted-foreground sm:!text-[14px]">
                              {stockStatusCounts[status] ?? 0}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {!isShopifyStore && (
                    <AccordionItem value="featured">
                      <AccordionTrigger className="text-[16px] !font-extrabold">
                        <b className="!font-extrabold">Featured Products</b>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="!space-y-[8px]">
                          {["Featured", "Not Featured"].map((status) => (
                            <label
                              key={status}
                              className="!flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] hover:!bg-muted sm:!p-[8px]"
                            >
                              <div className="!flex !items-center !gap-[12px]">
                                <input
                                  type="checkbox"
                                  checked={filters.featuredProducts.includes(status)}
                                  onChange={() => handleFeaturedProductsChange(status)}
                                  className="!h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary sm:!h-5 sm:!w-5 "
                                />
                                <span className="!text-[14px] !text-foreground sm:!text-[16px] lg:leading-[16px]">
                                  {status}
                                </span>
                              </div>
                              <span className="!rounded !bg-muted !px-[8px] !py-[4px] !text-[12px] !text-muted-foreground sm:!text-[14px]">
                                {status === "Featured" ? featuredCount : notFeaturedCount}
                              </span>
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="sale">
                    <AccordionTrigger className="text-[16px] !font-extrabold">
                      <b className="!font-extrabold">Sale Status</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {["On Sale", "Not On Sale"].map((status) => (
                          <label
                            key={status}
                            className="!flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] hover:!bg-muted sm:!p-[8px]"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.saleStatus.includes(status)}
                                onChange={() => handleSaleStatusChange(status)}
                                className="!h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary sm:!h-5 sm:!w-5 "
                              />
                              <span className="!text-[14px] !text-foreground sm:!text-[16px] lg:leading-[16px]">
                                {status}
                              </span>
                            </div>
                            <span className="!rounded !bg-muted !px-[8px] !py-[4px] !text-[12px] !text-muted-foreground sm:!text-[14px]">
                              {status === "On Sale" ? saleCount : notSaleCount}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="!mt-auto !bg-background">
                <div className="!flex !items-center !justify-between !bg-gray-50 !p-[12px]">
                  <div className="pl-[8px] text-[14px] !text-foreground">
                    <b>{totalProducts}</b> products found
                  </div>
                  <DrawerClose asChild>
                    <button
                      className="!rounded-full !pr-[4px] !transition-colors hover:!bg-muted"
                      aria-label="Close filters"
                      title="Close filters"
                    >
                      <X className="!h-[20px] !w-[20px] rounded-[9999px] border bg-[#823BED] !text-white" />
                    </button>
                  </DrawerClose>
                </div>
                <div className="!flex !gap-[8px] !border-t !border-border !p-[16px]">
                  <button
                    onClick={() => {
                      setFilters({
                        categories: [],
                        priceRange: [0, maxPrice],
                        colors: [],
                        sizes: [],
                        brands: [],
                        genders: [],
                        tags: [],
                        stockStatus: [],
                        featuredProducts: [],
                        saleStatus: [],
                      });
                    }}
                    className="!flex-1 !rounded-lg !border !border-border !py-[12px] text-[14px] !font-medium !text-foreground !transition-colors hover:!bg-muted"
                  >
                    Clear All
                  </button>
                  <DrawerClose asChild>
                    <button className="!flex-1 !rounded-lg !bg-primary !py-[12px] text-[14px] !font-medium !text-primary-foreground !transition-colors hover:!bg-primary-hover">
                      Apply Filters
                    </button>
                  </DrawerClose>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

      <div className="!flex !w-full lg:px-[64px] !mx-auto">
        <aside
          className="w-80 lg:!w-[312px] !p-[16px] !bg-filter-bg !hidden xl:!block"
          style={{ 
            opacity: shouldShowFilters ? 1 : 0,
            pointerEvents: shouldShowFilters ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <Accordion
            type="multiple"
            defaultValue={[
              "category",
              "price",
              "size",
              "stockStatus",
              ...(isShopifyStore ? [] : ["featured"]),
              "sale",
              "color",
              "brand",
              "tags",
            ]}
          >
            <AccordionItem value="category">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !text-foreground">
                <b>Category</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  {availableCategories.map((category) => (
                    <label
                      key={category}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-[10px]">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground text-[14px] lg:text-[16px]">
                          {category}
                        </span>
                      </div>
                      <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                        {categoryCounts[category] || 0}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {showOptionalFilters.brands && (
              <AccordionItem value="brand">
                <AccordionTrigger className="text-[16px] lg:text-[18px] !font-extrabold !text-foreground">
                  <b>Brand</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {availableBrands.map((brand) => (
                      <label
                        key={brand}
                        className="!flex !items-center !justify-between !cursor-pointer"
                      >
                        <div className="!flex !items-center !gap-[8px]">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 !text-primary !bg-background !border-border !rounded "
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {brand}
                          </span>
                        </div>
                        <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                          {brandCounts[brand] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {!isPriceLoading && (
              <AccordionItem value="price">
                <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[800] !text-foreground">
                  <b className="font-extrabold">Price</b>
                </AccordionTrigger>
                <AccordionContent>
                  <Slider
                    value={[filters.priceRange[1]]}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], value[0]],
                      }))
                    }
                    max={maxPrice}
                    step={10}
                    className="!w-full !mb-[16px] !mt-[8px]"
                  />
                  <div className="!flex !justify-between !text-[12px] lg:text-[14px] !text-muted-foreground">
                    <span>{filters.priceRange[0]} €</span>
                    <span>{filters.priceRange[1]} €</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="size">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Size</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!grid !grid-cols-4 !gap-[8px]">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`my-border !rounded !py-[8px] !text-[12px] lg:text-[14px] !font-medium ${
                        filters.sizes.includes(size)
                          ? "!bg-primary !text-primary-foreground"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {showOptionalFilters.colors && (
              <AccordionItem value="color">
                <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                  <b className="font-extrabold">Color</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!flex !gap-[8px]">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`!w-[24px] !h-[24px] lg:!w-[32px] lg:!h-[32px] !rounded-full !border-2 ${
                          filters.colors.includes(color)
                            ? "!border-primary !scale-110"
                            : "!border-border"
                        }`}
                        style={{
                          backgroundColor: color.toLowerCase(),
                          transform: filters.colors.includes(color)
                            ? "scale(1.1)"
                            : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showOptionalFilters.tags && (
              <AccordionItem value="tags">
                <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                  <b className="font-extrabold">Tags</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="!flex !items-center !justify-between !cursor-pointer"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.tags.includes(tag)}
                            onChange={() => handleTagChange(tag)}
                            className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {tag}
                          </span>
                        </div>
                        <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                          {tagCounts[tag] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

              {/* Mandatory Facets */}
              <AccordionItem value="stockStatus">
                <AccordionTrigger className="text-[16px] !font-[700] !text-foreground lg:text-[18px]">
                  <b className="font-extrabold">Stock Status</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {["In Stock", "Out of Stock", "On Backorder"].map((status) => (
                      <label
                        key={status}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.stockStatus.includes(status)}
                            onChange={() => handleStockStatusChange(status)}
                            className="top-0 !h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary lg:!h-5 lg:!w-5 "
                          />
                          <span className="text-[14px] !text-foreground lg:text-[16px]">
                            {status}
                          </span>
                        </div>
                        <span className="mr-[8px] !text-[12px] !text-muted-foreground lg:text-[14px]">
                          {stockStatusCounts[status] ?? 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {!isShopifyStore && (
                <AccordionItem value="featured">
                  <AccordionTrigger className="text-[16px] !font-[700] !text-foreground lg:text-[18px]">
                    <b className="font-extrabold">Featured Products</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {["Featured", "Not Featured"].map((status) => (
                        <label
                          key={status}
                          className="!flex !cursor-pointer !items-center !justify-between"
                        >
                          <div className="!flex !items-center !gap-[10px]">
                            <input
                              type="checkbox"
                              checked={filters.featuredProducts.includes(status)}
                              onChange={() => handleFeaturedProductsChange(status)}
                              className="top-0 !h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary lg:!h-5 lg:!w-5 "
                            />
                            <span className="text-[14px] !text-foreground lg:text-[16px]">
                              {status}
                            </span>
                          </div>
                          <span className="mr-[8px] !text-[12px] !text-muted-foreground lg:text-[14px]">
                            {status === "Featured" ? featuredCount : notFeaturedCount}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="sale">
                <AccordionTrigger className="text-[16px] !font-[700] !text-foreground lg:text-[18px]">
                  <b className="font-extrabold">Sale Status</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {["On Sale", "Not On Sale"].map((status) => (
                      <label
                        key={status}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.saleStatus.includes(status)}
                            onChange={() => handleSaleStatusChange(status)}
                            className="top-0 !h-[16px] !w-[16px] !rounded !border-border !bg-background !text-primary lg:!h-5 lg:!w-5 "
                          />
                          <span className="text-[14px] !text-foreground lg:text-[16px]">
                            {status}
                          </span>
                        </div>
                        <span className="mr-[8px] !text-[12px] !text-muted-foreground lg:text-[14px]">
                          {status === "On Sale" ? saleCount : notSaleCount}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {isAnyFilterActive && (
              <Button
                size="lg"
                className="mt-[16px] w-full rounded-lg !border-search-highlight py-[16px] text-[14px] font-bold lg:text-[16px]"
                onClick={() => {
                  setFilters({
                    categories: [],
                    priceRange: [0, maxPrice],
                    colors: [],
                    sizes: [],
                    brands: [],
                    genders: [],
                    tags: [],
                    stockStatus: [],
                    featuredProducts: [],
                    saleStatus: [],
                  });
                }}
              >
                Clear All Filters
              </Button>
            )}
          </aside>

          <main className="!w-full !flex-1 !px-[8px] pb-[16px] sm:!px-[16px] sm:pb-[32px]">
            <div className="!w-full !pr-[16px] sm:!pr-[32px] lg:pr-0">
              {recentSearches.length > 0 && (
                <div className="!mt-8">
                  <div className="!mb-[12px] !flex !items-center !justify-between">
                    <h3 className="!text-[16px] !font-bold !text-foreground">Recent Searches</h3>
                    <button
                      onClick={handleClearRecentSearches}
                      className="!text-sm !text-muted-foreground hover:!text-foreground"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="!flex !flex-wrap !gap-[8px]">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="!flex !items-center !gap-[4px] !rounded-full !bg-muted !px-[12px] !py-[6px]"
                      >
                        <span
                          className="!cursor-pointer !text-sm !text-foreground"
                          onClick={() => {
                            handleSearch(search);
                          }}
                        >
                          {search}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecentSearch(search);
                          }}
                          aria-label={`Remove recent search ${search}`}
                          title={`Remove recent search ${search}`}
                          className="!rounded-full !p-1 hover:!bg-background"
                        >
                          <X className="!h-[12px] !w-[12px] !text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!showRecommendations && (
                <div className="!mb-[8px] mt-[8px] hidden pb-[4px]  pt-[22px] !text-[14px] !font-bold !text-foreground sm:!text-[16px] lg:flex lg:text-[18px]">
                  {/* {isAnyFilterActive ? "Search Results" : ""} */}
                  Search Results
                </div>
              )}
              {!showRecommendations && (
                <div className="!mb-[16px] flex items-center justify-between pt-[16px] text-[12px] !text-muted-foreground lg:pt-[0px] lg:text-[16px]">
                  <div className="!ml-[8px]">
                    <b className="!font-extrabold text-foreground">{displayedProducts}</b> out of{" "}
                    <b className="!font-extrabold text-foreground">{totalProducts}</b> products
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="!flex !items-center !rounded-md !border !border-border !px-[8px] !py-[4px] text-[12px] md:!px-[12px] md:!py-[8px] lg:text-[14px]">
                          Sort By
                          <ChevronDown className="!ml-[4px] !h-[12px] !w-[12px] md:!ml-[8px] md:!h-[16px] md:!w-[16px]" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="z-[100000]"
                        container={document.body}
                      >
                        <DropdownMenuLabel className="text-[14px] !font-semibold">
                          Sort by
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSortOption("default");
                          }}
                          className="text-[14px]"
                        >
                          Relevance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSortOption("a-z");
                          }}
                          className="text-[14px]"
                        >
                          Name: A-Z
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSortOption("z-a");
                          }}
                          className="text-[14px]"
                        >
                          Name: Z-A
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSortOption("price-asc");
                          }}
                          className="text-[14px]"
                        >
                          Price: Low to High
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSortOption("price-desc");
                          }}
                          className="text-[14px]"
                        >
                          Price: High to Low
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {showRecommendations ? (
                // Show recommendations and popular searches
                <div className="!w-full">

                  {/* Smart Recommendations */}
                  {(() => {
                    console.log("Rendering recommendations, length:", recommendations.length, "recommendations:", recommendations);
                    return null;
                  })()}
                  {recommendations.length > 0 && (
                    <Recommendations
                      recommendations={recommendations}
                      handleProductClick={handleProductClick}
                      calculateDiscountPercentage={calculateDiscountPercentage}
                      addingToCart={addingToCart}
                      handleAddToCart={handleAddToCart}
                    />
                  )}
                </div>
              ) : isLoading || isPending ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="!grid !w-full !grid-cols-2 !gap-[8px] sm:!grid-cols-2 sm:!gap-[16px] xl:grid-cols-3 2xl:!grid-cols-4">
                    {sortedProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="group !flex !w-full !cursor-pointer !flex-col !rounded-lg !border !border-border !bg-background !p-[8px] !transition-shadow hover:!shadow-lg sm:!p-[12px]"
                      >
                        <div className="!relative !mb-[8px] overflow-hidden">
                          <img
                            src={product.imageUrl ?? product.image}
                            alt={product.title}
                            className="!h-[112px] !w-full !rounded-md !object-cover !transition-transform !duration-300 group-hover:!scale-105 sm:!h-[144px]"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                          {product.featured && (
                            <div className="!absolute !right-2 !top-2 !rounded-full !bg-primary !px-2 !py-1 !text-xs !font-bold !text-primary-foreground">
                              Featured
                            </div>
                          )}
                          {product.salePrice &&
                            product.salePrice !== "" &&
                            product.salePrice !== "0" &&
                            product.salePrice !== "0.00" &&
                            product.regularPrice &&
                            parseFloat(product.salePrice) < parseFloat(product.regularPrice) &&
                            (() => {
                              const discountPercentage = calculateDiscountPercentage(
                                product.regularPrice,
                                product.salePrice
                              );
                              return discountPercentage ? (
                                <div className="!absolute !left-2 !top-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                                  -{discountPercentage}%
                                </div>
                              ) : (
                                <div className="!absolute !left-2 !top-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                                  Sale
                                </div>
                              );
                            })()}
                        </div>
                        <h3 className="!mb-[4px] h-[40px] overflow-hidden !text-[14px] !font-bold !text-foreground sm:!mb-[8px] sm:h-[48px] sm:!text-[16px]">
                          {product.title}
                        </h3>
                        <div className="mt-auto !flex !items-center !justify-between">
                          <div className="!flex !items-center !gap-[8px]">
                            {product.salePrice &&
                              product.salePrice !== "" &&
                              product.salePrice !== "0" &&
                              product.salePrice !== "0.00" &&
                              product.regularPrice &&
                              parseFloat(product.salePrice) < parseFloat(product.regularPrice) ? (
                              <div className="!flex !items-center !gap-2">
                                <span className="!text-[14px] !font-bold !text-primary sm:!text-[16px]">
                                  {product.salePrice}
                                </span>
                                <span className="!text-[12px] !text-muted-foreground !line-through sm:!text-[14px]">
                                  {product.regularPrice}
                                </span>
                              </div>
                            ) : (
                              <span className="!text-[12px] !text-muted-foreground sm:!text-[14px]">
                                {product.price}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleAddToCart(product);
                            }}
                            disabled={addingToCart === product.id}
                            className="!transform !rounded-md !bg-primary !p-[6px] !text-primary-foreground !transition-colors !duration-200 hover:!bg-primary-hover disabled:!cursor-not-allowed disabled:!opacity-50 group-hover:!scale-110 sm:!p-[8px]"
                          >
                            {addingToCart === product.id ? (
                              <div className="!h-[12px] !w-[12px] !animate-spin !rounded-full !border-2 !border-primary-foreground !border-t-transparent sm:!h-[16px] sm:!w-[16px]"></div>
                            ) : (
                              <ShoppingCart className="!h-[12px] !w-[12px] sm:!h-[16px] sm:!w-[16px]" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Infinite scroll trigger for mobile */}
                  {isMobile && hasMoreProducts && (
                    <div id="load-more-trigger" className="!my-4 !h-4 !w-full">
                      {isLoadingMore && (
                        <div className="!flex !items-center !justify-center !py-4">
                          <div className="!flex !items-center !gap-2">
                            <div className="!flex !space-x-2">
                              <div className="animate-bounce-delay-0 !h-2 !w-2 !animate-bounce !rounded-full !bg-primary"></div>
                              <div className="animate-bounce-delay-150 !h-2 !w-2 !animate-bounce !rounded-full !bg-primary"></div>
                              <div className="animate-bounce-delay-300 !h-2 !w-2 !animate-bounce !rounded-full !bg-primary"></div>
                            </div>
                            <span className="!text-sm !text-muted-foreground">
                              Loading {Math.min(12, totalProducts - displayedProducts)} more
                              products...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Load More button for desktop */}
                  {!isMobile && hasMoreProducts && (
                    <div className="!mt-8 !flex !justify-center">
                      <button
                        onClick={() => void loadMoreProducts()}
                        disabled={isLoadingMore}
                        className="!disabled:opacity-50 !disabled:cursor-not-allowed !rounded-lg !bg-primary !px-8 !py-3 !font-medium !text-primary-foreground !transition-colors hover:!bg-primary-hover"
                      >
                        {isLoadingMore
                          ? "Loading..."
                          : `Load More (${Math.min(12, totalProducts - displayedProducts)} more)`}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!isLoading && !isPending && !showRecommendations && sortedProducts.length === 0 && (
                <div className="!w-full !py-[48px] !text-center !duration-300 !animate-in !fade-in">
                  <div className="!flex !flex-col !items-center !gap-4">
                    <div className="!flex !h-16 !w-16 !items-center !justify-center !rounded-full !bg-muted !duration-500 !animate-in !zoom-in">
                      <Search className="!h-8 !w-8 !text-muted-foreground" />
                    </div>
                    <div className="!duration-500 !animate-in !slide-in-from-bottom-2">
                      <p className="!lg:text-[20px] !mb-2 !text-[18px] !font-semibold !text-foreground">
                        Search not found
                      </p>
                      <p className="!lg:text-[16px] !text-[14px] !text-muted-foreground">
                        No products found matching your criteria. Try different keywords or browse our
                        categories.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Message Display */}
              {cartMessage && (
                <div className="!fixed !right-4 !top-4 !z-[999999] !max-w-sm !rounded-lg !bg-primary !px-4 !py-2 !text-primary-foreground !shadow-lg">
                  <div className="!flex !items-center !gap-2">
                    <div className="!h-4 !w-4 !animate-spin !rounded-full !border-2 !border-primary-foreground !border-t-transparent"></div>
                    <span className="!text-sm !font-medium">{cartMessage}</span>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  };

export default KalifindSearch;
