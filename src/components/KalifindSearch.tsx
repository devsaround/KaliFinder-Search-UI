import { ChevronDown, Filter, Search, ShoppingCart, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { getUBIClient } from '@/analytics/ubiClient';
import { apiService } from '@/services/api.service';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/use-debounce';
import { addToCart, handleCartError } from '@/utils/cart';

import type { FilterState, Product } from '../types';
import { isAutocompleteResponse, isSearchResponse } from '../types/api.types';
import Recommendations from './Recommendations';

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
  storeUrl, // Now required to be passed by parent - no hardcoded default
}) => {
  const [storeType, setStoreType] = useState<'shopify' | 'woocommerce' | null>(null);

  // Determine if this is a Shopify store
  const isShopifyStore =
    storeType === 'shopify' || storeUrl?.includes('myshopify.com') || storeUrl?.includes('shopify');

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState(0);

  // New state variables for search behavior
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [isSearchingFromSuggestion, setIsSearchingFromSuggestion] = useState(false);
  const [forceSearch, setForceSearch] = useState(0);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  const [isFromSuggestionSelection, setIsFromSuggestionSelection] = useState(false);
  const lastActionRef = useRef<'typing' | 'suggestion' | null>(null);
  const userTypingRef = useRef(false);
  const lastSearchedQueryRef = useRef<string | null>(null);
  const lastSearchedFiltersRef = useRef<string>('');

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationsFetched, setRecommendationsFetched] = useState(false);
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
  const [sortOption, setSortOption] = useState('default');
  const [globalFacetsFetched, setGlobalFacetsFetched] = useState(false);

  // State for optional filters - only show if vendor has configured them
  const [showOptionalFilters, setShowOptionalFilters] = useState({
    brands: false,
    colors: false,
    sizes: false,
    tags: false,
  });

  // State for mandatory filters - only show if vendor has configured them
  const [showMandatoryFilters, setShowMandatoryFilters] = useState({
    categories: false, // Default to false, will be set based on vendor config
    price: false, // Default to false, will be set based on vendor config
    stockStatus: false, // Default to false, will be set based on vendor config
    featured: false, // Default to false, will be set based on vendor config
    sale: false, // Default to false, will be set based on vendor config
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
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Update price range max when maxPrice changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [prev.priceRange[0], maxPrice],
    }));
  }, [maxPrice]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem('recentSearches');
      if (storedSearches) {
        const parsed: unknown = JSON.parse(storedSearches);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          setRecentSearches(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to parse recent searches from localStorage', error);
      setRecentSearches([]);
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    try {
      if (recentSearches.length > 0) {
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
      } else {
        localStorage.removeItem('recentSearches');
      }
    } catch (error) {
      console.error('Failed to save recent searches to localStorage', error);
    }
  }, [recentSearches]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 500);
  const debouncedFilters = useDebounce(filters, 500);

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
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const searchRequestIdRef = useRef(0);

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
  const shouldShowFilters =
    showFilters || isAnyFilterActive || (searchQuery && searchQuery.trim().length > 0);

  // Fetch vendor facet configuration
  const fetchFacetConfiguration = useCallback(async () => {
    if (!storeUrl) return;

    try {
      const result = await apiService.fetchFacetConfiguration(storeUrl);
      console.log('🔧 Fetched facet configuration:', result);

      // Update optional filters visibility based on vendor configuration
      const optionalFilters = {
        brands: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'brand' && facet.visible
        ),
        colors: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'color' && facet.visible
        ),
        sizes: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'size' && facet.visible
        ),
        tags: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'tags' && facet.visible
        ),
      };
      setShowOptionalFilters(optionalFilters);
      console.log('🎛️ Optional filters visibility:', optionalFilters);

      // Update mandatory filters visibility based on vendor configuration
      const mandatoryFilters = {
        categories: result.some(
          (facet: { field: string; visible: boolean }) =>
            facet.field === 'category' && facet.visible
        ),
        price: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'price' && facet.visible
        ),
        stockStatus: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'instock' && facet.visible
        ),
        featured: result.some(
          (facet: { field: string; visible: boolean }) =>
            facet.field === 'featured' && facet.visible
        ),
        sale: result.some(
          (facet: { field: string; visible: boolean }) => facet.field === 'insale' && facet.visible
        ),
      };
      setShowMandatoryFilters(mandatoryFilters);
      console.log('🎛️ Mandatory filters visibility:', mandatoryFilters);
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      // Keep default values (all false for both optional and mandatory filters)
    }
  }, [storeUrl]);

  // Fetch global facets once on mount (static counts that don't change with search query)
  const fetchGlobalFacets = useCallback(async () => {
    if (!storeUrl || globalFacetsFetched) return;

    try {
      const params = new URLSearchParams();
      params.append('storeUrl', storeUrl);
      params.append('page', '1');
      params.append('limit', '1'); // Minimal products, we mainly need facets

      if (!import.meta.env.VITE_BACKEND_URL) {
        console.error('VITE_BACKEND_URL environment variable is required');
        return;
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/v1/search?${params.toString()}`);

      if (!response.ok) {
        console.error('Failed to fetch global facets');
        return;
      }

      const result = await response.json();

      // Process facet data from API response (same logic as search, but only once)
      if (result.facets) {
        // Process stock status facets
        if (result.facets.instock && Array.isArray(result.facets.instock.buckets)) {
          const stockStatusCounts: { [key: string]: number } = {};
          result.facets.instock.buckets.forEach((bucket: any) => {
            const status = bucket.key;
            const displayName =
              status === 'instock'
                ? 'In Stock'
                : status === 'outofstock'
                  ? 'Out of Stock'
                  : status === 'onbackorder'
                    ? 'On Backorder'
                    : status;
            stockStatusCounts[displayName] = bucket.doc_count;
          });
          setStockStatusCounts(stockStatusCounts);
        }

        // Process featured facets
        if (result.facets.featured && Array.isArray(result.facets.featured.buckets)) {
          let featuredCount = 0;
          let notFeaturedCount = 0;
          result.facets.featured.buckets.forEach((bucket: any) => {
            // OpenSearch returns boolean fields as 1 (true) or 0 (false) in bucket.key
            if (bucket.key === 1 || bucket.key === true) {
              featuredCount = bucket.doc_count;
            } else if (bucket.key === 0 || bucket.key === false) {
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
            // OpenSearch returns boolean fields as 1 (true) or 0 (false) in bucket.key
            if (bucket.key === 1 || bucket.key === true) {
              saleCount = bucket.doc_count;
            } else if (bucket.key === 0 || bucket.key === false) {
              notSaleCount = bucket.doc_count;
            }
          });
          setSaleCount(saleCount);
          setNotSaleCount(notSaleCount);
        }

        // Process category facets
        if (result.facets.category && Array.isArray(result.facets.category.buckets)) {
          const categoryCounts: { [key: string]: number } = {};
          result.facets.category.buckets.forEach((bucket: any) => {
            categoryCounts[bucket.key] = bucket.doc_count;
          });
          setCategoryCounts(categoryCounts);
          setAvailableCategories(Object.keys(categoryCounts));
        }

        // Process brand facets
        if (result.facets.brands && Array.isArray(result.facets.brands.buckets)) {
          const brandCounts: { [key: string]: number } = {};
          result.facets.brands.buckets.forEach((bucket: any) => {
            brandCounts[bucket.key] = bucket.doc_count;
          });
          setBrandCounts(brandCounts);
          setAvailableBrands(Object.keys(brandCounts));
        }

        // Process color facets
        if (result.facets.colors && Array.isArray(result.facets.colors.buckets)) {
          const colorCounts: { [key: string]: number } = {};
          result.facets.colors.buckets.forEach((bucket: any) => {
            colorCounts[bucket.key] = bucket.doc_count;
          });
          setAvailableColors(Object.keys(colorCounts));
        }

        // Process size facets
        if (result.facets.sizes && Array.isArray(result.facets.sizes.buckets)) {
          const sizeCounts: { [key: string]: number } = {};
          result.facets.sizes.buckets.forEach((bucket: any) => {
            sizeCounts[bucket.key] = bucket.doc_count;
          });
          setAvailableSizes(Object.keys(sizeCounts));
        }

        // Process tag facets
        if (result.facets.tags && Array.isArray(result.facets.tags.buckets)) {
          const tagCounts: { [key: string]: number } = {};
          result.facets.tags.buckets.forEach((bucket: any) => {
            tagCounts[bucket.key] = bucket.doc_count;
          });
          setTagCounts(tagCounts);
          setAvailableTags(Object.keys(tagCounts));
        }
      }

      // Extract max price from products in global facets
      if (result.products && Array.isArray(result.products) && result.products.length > 0) {
        const prices = result.products
          .map((p: any) => parseFloat(p.price || p.regularPrice || '0'))
          .filter((price: number) => !isNaN(price) && price > 0);

        if (prices.length > 0) {
          const calculatedMaxPrice = Math.ceil(Math.max(...prices));
          const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 50) * 50;
          setMaxPrice(roundedMaxPrice);
        }
      }

      setGlobalFacetsFetched(true);
      console.log('✅ Global facets fetched and will remain static');
    } catch (error) {
      console.error('Failed to fetch global facets:', error);
    }
  }, [storeUrl, globalFacetsFetched]);

  // Fetch vendor-controlled recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!storeUrl || recommendationsFetched) return;
    try {
      // First check if vendor has configured recommendations
      if (!import.meta.env.VITE_BACKEND_URL) {
        console.error('VITE_BACKEND_URL environment variable is required');
        return;
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const configResponse = await fetch(
        `${backendUrl}/api/v1/recommendations/config?storeUrl=${storeUrl}`,
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
        `${backendUrl}/v1/search/recommended?storeUrl=${storeUrl}&type=vendor-configured`,
        {}
      );

      if (!response.ok) {
        // If vendor-configured recommendations fail, don't show any
        setRecommendations([]);
        return;
      }

      const result = (await response.json()) as unknown;

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
        products = [];
      }

      setRecommendations(products); // Show all recommendations
      setRecommendationsFetched(true);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    }
  }, [storeUrl, recommendationsFetched]);

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

  // Consolidated initial data loading with Promise.all for better performance
  useEffect(() => {
    if (!storeUrl) return;

    // Reset store type when store changes
    setStoreType(null);

    const loadInitialData = async () => {
      try {
        // Load recommendations, facet configuration, and global facets in parallel
        await Promise.all([fetchRecommendations(), fetchFacetConfiguration(), fetchGlobalFacets()]);
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [storeUrl, fetchRecommendations, fetchFacetConfiguration, fetchGlobalFacets]);

  // Removed heavy 1000-product fetch - filter counts now come from search API aggregations
  // This eliminates the major performance bottleneck on initial page load
  // Filter counts are populated when the first search is performed

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
    if (
      debouncedSearchQuery &&
      debouncedSearchQuery.trim().length > 0 &&
      userTypingRef.current &&
      !isFromSuggestionSelection
    ) {
      setShowAutocomplete(true);
      startTransition(() => {
        setIsAutocompleteLoading(true);
        void (async () => {
          try {
            const params = new URLSearchParams();
            params.append('q', debouncedSearchQuery.trim());
            params.append('storeUrl', storeUrl);

            if (!import.meta.env.VITE_BACKEND_URL) {
              console.error('VITE_BACKEND_URL environment variable is required');
              return;
            }
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const url = `${backendUrl}/api/v1/autocomplete?${params.toString()}`;
            // Autocomplete API call

            const response = await fetch(url, {});

            if (!response.ok) {
              console.error('Autocomplete API error:', response.status, response.statusText);
              throw new Error('bad response');
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
                  return r.title || (r.name ?? 'Unknown Product');
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
              console.error('Failed to fetch autocomplete suggestions:', error);
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
  }, [debouncedSearchQuery, storeUrl, scoreSuggestion, isFromSuggestionSelection, userTypingRef]);

  // Extract search logic into a reusable function
  const performSearch = useCallback(
    (query: string) => {
      if (!storeUrl) return;

      // Cancel any existing search request
      if (searchAbortController) {
        searchAbortController.abort();
      }

      const newAbortController = new AbortController();
      setSearchAbortController(newAbortController);

      startTransition(() => {
        setIsLoading(true);
        setCurrentPage(1);
        setHasMoreProducts(true);
        setDisplayedProducts(0);
        setFilteredProducts([]); // ✅ Clear products immediately
        const fetchProducts = async () => {
          const currentRequestId = ++searchRequestIdRef.current; // Generate unique ID
          if (
            typeof debouncedPriceRange[0] === 'undefined' ||
            typeof debouncedPriceRange[1] === 'undefined'
          ) {
            setFilteredProducts([]);
            setIsLoading(false);
            return;
          }

          try {
            const params = new URLSearchParams();
            if (query) {
              params.append('q', query);
            }
            if (storeUrl) {
              params.append('storeUrl', storeUrl);
            }

            if (debouncedFilters.categories.length > 0) {
              params.append('categories', debouncedFilters.categories.join(','));
            }
            if (debouncedFilters.colors.length > 0) {
              params.append('colors', debouncedFilters.colors.join(','));
            }
            if (debouncedFilters.sizes.length > 0) {
              params.append('sizes', debouncedFilters.sizes.join(','));
            }
            if (debouncedFilters.brands.length > 0) {
              params.append('brands', debouncedFilters.brands.join(','));
            }
            if (debouncedFilters.tags.length > 0) {
              params.append('tags', debouncedFilters.tags.join(','));
            }
            // Mandatory facets
            if (debouncedFilters.stockStatus.length > 0) {
              params.append('stockStatus', debouncedFilters.stockStatus.join(','));
            }
            // Handle featured products filter
            if (debouncedFilters.featuredProducts.length > 0) {
              if (
                debouncedFilters.featuredProducts.includes('Featured') &&
                !debouncedFilters.featuredProducts.includes('Not Featured')
              ) {
                params.append('featured', 'true');
              } else if (
                debouncedFilters.featuredProducts.includes('Not Featured') &&
                !debouncedFilters.featuredProducts.includes('Featured')
              ) {
                params.append('featured', 'false');
              }
              // If both are selected, don't add any featured filter (show all)
            }

            // Handle sale status filter
            if (debouncedFilters.saleStatus.length > 0) {
              if (
                debouncedFilters.saleStatus.includes('On Sale') &&
                !debouncedFilters.saleStatus.includes('Not On Sale')
              ) {
                params.append('insale', 'true');
              } else if (
                debouncedFilters.saleStatus.includes('Not On Sale') &&
                !debouncedFilters.saleStatus.includes('On Sale')
              ) {
                params.append('insale', 'false');
              }
              // If both are selected, don't add any sale filter (show all)
            }
            params.append('minPrice', debouncedPriceRange[0].toString());
            params.append('maxPrice', debouncedPriceRange[1].toString());
            params.append('page', '1');
            params.append('limit', isMobile ? '8' : '9');

            if (!import.meta.env.VITE_BACKEND_URL) {
              console.error('VITE_BACKEND_URL environment variable is required');
              return;
            }
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/v1/search?${params.toString()}`, {
              signal: newAbortController.signal,
            });

            if (!response.ok) {
              throw new Error('bad response');
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

              // NOTE: Facet processing removed - facets are now fetched once on mount
              // via fetchGlobalFacets() and remain static regardless of search query
              // This provides a better UX where filter counts don't change as users type

              // Detect store type from first product if available
              if (products.length > 0) {
                const firstProductStoreType = products[0]?.storeType;
                if (
                  firstProductStoreType &&
                  (firstProductStoreType === 'shopify' ||
                    firstProductStoreType === 'woocommerce') &&
                  firstProductStoreType !== storeType
                ) {
                  setStoreType(firstProductStoreType);
                }

                // Calculate max price from products
                const prices = products
                  .map((p) => parseFloat(p.price || p.regularPrice || '0'))
                  .filter((price) => !isNaN(price) && price > 0);

                if (prices.length > 0) {
                  const calculatedMaxPrice = Math.ceil(Math.max(...prices));
                  // Add some buffer (e.g., round up to nearest 10 or 50)
                  const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 50) * 50;
                  setMaxPrice(roundedMaxPrice);
                }
              }
            } else if (Array.isArray(result)) {
              products = result;
              total = result.length;
              hasMore = false;

              // Detect store type from first product if available
              if (products.length > 0) {
                const firstProductStoreType = products[0]?.storeType;
                if (
                  firstProductStoreType &&
                  (firstProductStoreType === 'shopify' ||
                    firstProductStoreType === 'woocommerce') &&
                  firstProductStoreType !== storeType
                ) {
                  setStoreType(firstProductStoreType);
                }
              }
            } else {
              console.error('Kalifind Search: Unexpected search response format:', result);
              products = [];
              total = 0;
              hasMore = false;
            }

            // Validate this response is from the current request
            if (currentRequestId !== searchRequestIdRef.current) {
              // This response is from an old request, ignore it
              return;
            }

            setFilteredProducts(products);
            setTotalProducts(total);
            setDisplayedProducts(products.length);
            setHasMoreProducts(hasMore);
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            console.error('Failed to fetch products:', error);
            setFilteredProducts([]);
          } finally {
            setIsLoading(false);
            setSearchAbortController(null);
          }
        };

        void fetchProducts();
      });
    },
    [storeUrl, debouncedPriceRange, debouncedFilters, searchAbortController, isMobile, storeType]
  );

  // search products
  useEffect(() => {
    // Skip search if we're in initial state showing recommendations
    if (!storeUrl || showRecommendations || isInitialState) {
      return; // Wait for the initial price to be loaded or skip if showing recommendations or in initial state
    }

    // Skip search if we're searching from a suggestion click (already handled)
    if (isSearchingFromSuggestion) {
      setIsSearchingFromSuggestion(false);
      return;
    }

    // Check if we've already searched for this exact query and filters
    const currentQuery = debouncedSearchQuery?.trim() || '';
    const currentFilters = JSON.stringify(debouncedFilters);

    if (
      lastSearchedQueryRef.current === currentQuery &&
      lastSearchedFiltersRef.current === currentFilters
    ) {
      return; // Skip if we've already searched for this query and filters combination
    }

    // Update the last searched query and filters
    lastSearchedQueryRef.current = currentQuery;
    lastSearchedFiltersRef.current = currentFilters;

    // Fetch all products when search query is empty, or perform search with query
    if (!debouncedSearchQuery?.trim()) {
      void performSearch(''); // Pass empty string to fetch all products
    } else {
      void performSearch(debouncedSearchQuery);
    }
  }, [
    debouncedSearchQuery,
    debouncedPriceRange,
    debouncedFilters,
    storeUrl,
    showRecommendations,
    isInitialState,
    isSearchingFromSuggestion,
    forceSearch,
    performSearch,
  ]);

  const sortedProducts = useMemo(() => {
    // Ensure filteredProducts is an array before processing
    if (!Array.isArray(filteredProducts)) {
      console.warn('Kalifind Search: filteredProducts is not an array:', filteredProducts);
      return [];
    }

    const productsToSort = [...filteredProducts];
    switch (sortOption) {
      case 'a-z':
        return productsToSort.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return productsToSort.sort((a, b) => b.title.localeCompare(a.title));
      case 'price-asc':
        return productsToSort.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-desc':
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
    if (event.key === 'Enter') {
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
        params.append('q', debouncedSearchQuery);
      }
      if (storeUrl) {
        params.append('storeUrl', storeUrl);
      }

      // Add all current filters
      if (debouncedFilters.categories.length > 0) {
        params.append('categories', debouncedFilters.categories.join(','));
      }
      if (debouncedFilters.colors.length > 0) {
        params.append('colors', debouncedFilters.colors.join(','));
      }
      if (debouncedFilters.sizes.length > 0) {
        params.append('sizes', debouncedFilters.sizes.join(','));
      }
      if (debouncedFilters.brands.length > 0) {
        params.append('brands', debouncedFilters.brands.join(','));
      }
      if (debouncedFilters.tags.length > 0) {
        params.append('tags', debouncedFilters.tags.join(','));
      }
      if (debouncedFilters.stockStatus.length > 0) {
        // Map frontend stock status values to backend boolean values
        const stockStatusValues = debouncedFilters.stockStatus.map((status) => {
          if (status === 'In Stock') return 'true';
          if (status === 'Out of Stock') return 'false';
          if (status === 'On Backorder') return 'false';
          return 'true'; // default to true for other values
        });
        params.append('instock', stockStatusValues.join(','));
      }
      // Handle featured products filter
      if (debouncedFilters.featuredProducts.length > 0) {
        if (
          debouncedFilters.featuredProducts.includes('Featured') &&
          !debouncedFilters.featuredProducts.includes('Not Featured')
        ) {
          params.append('featured', 'true');
        } else if (
          debouncedFilters.featuredProducts.includes('Not Featured') &&
          !debouncedFilters.featuredProducts.includes('Featured')
        ) {
          params.append('featured', 'false');
        }
        // If both are selected, don't add any featured filter (show all)
      }

      // Handle sale status filter
      if (debouncedFilters.saleStatus.length > 0) {
        if (
          debouncedFilters.saleStatus.includes('On Sale') &&
          !debouncedFilters.saleStatus.includes('Not On Sale')
        ) {
          params.append('insale', 'true');
        } else if (
          debouncedFilters.saleStatus.includes('Not On Sale') &&
          !debouncedFilters.saleStatus.includes('On Sale')
        ) {
          params.append('insale', 'false');
        }
        // If both are selected, don't add any sale filter (show all)
      }
      params.append('minPrice', debouncedPriceRange[0].toString());
      params.append('maxPrice', debouncedPriceRange[1].toString());

      params.append('page', (currentPage + 1).toString());
      params.append('limit', isMobile ? '8' : '9');

      if (!import.meta.env.VITE_BACKEND_URL) {
        console.error('VITE_BACKEND_URL environment variable is required');
        return;
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/v1/search?${params.toString()}`, {});

      if (!response.ok) {
        throw new Error('Failed to load more products');
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
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMoreProducts,
    debouncedSearchQuery,
    storeUrl,
    currentPage,
    debouncedFilters,
    debouncedPriceRange,
    isMobile,
  ]);

  // Infinite scroll observer for mobile
  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Don't trigger during initial load or when already loading main search
        if (entries[0]?.isIntersecting && hasMoreProducts && !isLoadingMore && !isLoading) {
          void loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = loadMoreTriggerRef.current;
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [isMobile, hasMoreProducts, isLoadingMore, isLoading, loadMoreProducts]);

  // Cleanup effect to cancel any pending requests
  useEffect(() => {
    return () => {
      if (searchAbortController) {
        searchAbortController.abort();
      }
    };
  }, [searchAbortController]);

  // Function to calculate discount percentage
  const calculateDiscountPercentage = (regularPrice: string, salePrice: string): number | null => {
    try {
      const regular = parseFloat(regularPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
      const sale = parseFloat(salePrice.replace(/[^\d.,]/g, '').replace(',', '.'));

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
      const position = sortedProducts.findIndex((p) => p.id === product.id) + 1;
      ubiClient.trackResultClick(product.id, position);
    }

    if (product.productUrl) {
      window.open(product.productUrl, '_blank');
    } else if (product.url) {
      window.open(product.url, '_blank');
    } else {
      console.warn('No product URL available for:', product.title);
    }
  };

  // Cart functionality
  const handleAddToCart = async (product: Product) => {
    if (!storeUrl) {
      console.error('Store URL is required for cart operations');
      return;
    }

    setAddingToCart(product.id);
    setCartMessage(null);

    try {
      const result = await addToCart(product, storeUrl);
      setCartMessage(result.message || 'Added to cart successfully');

      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Add to cart failed:', error);
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
          className="!animate-pulse-slow !bg-loading !w-full !rounded-lg !p-[8px] md:!p-[16px]"
        >
          <div className="!bg-loading-shimmer !relative !mb-[12px] !h-[128px] !overflow-hidden !rounded-md md:!mb-[16px] md:!h-[192px]">
            <div className="!animate-shimmer !via-loading-shimmer !absolute !inset-0 !bg-gradient-to-r !from-transparent !to-transparent"></div>
          </div>
          <div className="!bg-loading-shimmer !mb-[8px] !h-[16px] !rounded"></div>
          <div className="!bg-loading-shimmer !h-[24px] !w-[80px] !rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    // <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px] lg:px-[96px]">
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
                  <div className="!border-search-highlight !relative !w-full !flex-1 !border-b-2">
                    <Search className="!text-muted-foreground !absolute !top-1/2 !left-[7px] !h-[20px] !w-[20px] !-translate-y-1/2 !transform" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => {
                        // Input focused
                        if (
                          searchQuery &&
                          searchQuery.length > 0 &&
                          userTypingRef.current &&
                          !isFromSuggestionSelection
                        ) {
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
                          relatedTarget?.closest('[data-suggestion-item]') ??
                          relatedTarget?.closest('[data-autocomplete-dropdown]');

                        if (!isClickingOnSuggestion && !isInteractingWithDropdown) {
                          // Small delay to allow for suggestion clicks to process
                          setTimeout(() => {
                            setShowAutocomplete(false);
                          }, 100);
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search"
                      className="!text-foreground !placeholder-muted-foreground !w-full !border-none !bg-inherit !py-[12px] !pr-[16px] !pl-[30px] focus:!border-none focus:!ring-0 focus:!outline-none"
                    />

                    {/* <div className="!absolute !right-[12px] !top-1/2 !transform !-translate-y-1/2 !flex !gap-[8px]"></div> */}
                  </div>
                  <button
                    className="hover:!bg-muted/20 !flex-shrink-0 !rounded-lg !transition-colors !duration-200"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="!text-muted-foreground hover:!text-foreground !mr-[10px] !h-[25px] !w-[25px] font-bold !transition-colors !duration-200" />
                  </button>
                </div>
              </div>

              {showAutocomplete &&
                searchQuery &&
                searchQuery.length > 0 &&
                (isAutocompleteLoading || autocompleteSuggestions.length > 0) && (
                  <div
                    data-autocomplete-dropdown="true"
                    className="!border-border !bg-background !absolute !top-full !right-0 !left-0 !z-[9999999] !mt-[4px] !w-full !rounded-lg !border !shadow-lg"
                    onMouseEnter={() => setIsInteractingWithDropdown(true)}
                    onMouseLeave={() => setIsInteractingWithDropdown(false)}
                  >
                    <div className="!p-[16px] [&_*]:!z-[9999999]">
                      {isAutocompleteLoading ? (
                        <div className="!text-muted-foreground !flex !items-center !justify-center !gap-[8px] !py-[12px]">
                          <div className="!border-muted-foreground !h-4 !w-4 !animate-spin !rounded-full !border-2 !border-t-transparent"></div>
                          <span>Loading suggestions...</span>
                        </div>
                      ) : autocompleteSuggestions.length > 0 ? (
                        <>
                          <h3 className="!text-foreground !mb-[12px] !text-[14px] leading-[6px] !font-medium">
                            Suggestions
                          </h3>
                          <div className="!space-y-[8px]">
                            {autocompleteSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                data-suggestion-item="true"
                                className={`hover:!bg-muted z-[9999999] !flex !cursor-pointer !items-center !gap-[8px] !rounded !p-[8px] ${
                                  index === highlightedSuggestionIndex ? '!bg-muted' : ''
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
                                <Search className="!text-muted-foreground !h-[16px] !w-[16px]" />
                                <span className="!text-muted-foreground pointer-events-none">
                                  {suggestion}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="!animate-in !fade-in !flex !flex-col !items-center !justify-center !py-6 !text-center !duration-300">
                          <div className="!bg-muted !animate-in !zoom-in !mb-3 !flex !h-10 !w-10 !items-center !justify-center !rounded-full !duration-500">
                            <Search className="!text-muted-foreground !h-5 !w-5" />
                          </div>
                          <div className="!animate-in !slide-in-from-bottom-2 !duration-500">
                            <p className="!text-foreground !mb-1 !text-sm !font-medium">
                              Search not found
                            </p>
                            <p className="!text-muted-foreground !text-xs">
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
        className={`!fixed !bottom-[16px] !left-1/2 !z-50 !-translate-x-1/2 ${shouldShowFilters ? '!block xl:!hidden' : '!hidden'}`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <button className="!bg-primary !text-primary-foreground !hover:!bg-primary-hover !hover:!scale-105 !flex !transform !items-center !gap-[8px] !rounded-full !px-[16px] !py-[12px] !font-medium !shadow-lg !transition-all !duration-300">
              <Filter className="!h-[16px] !w-[16px]" />
              Filters
              <span className="!bg-primary-foreground !text-primary !rounded-full !px-[8px] !py-[4px] !text-xs !font-bold">
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
          <DrawerContent className="!z-[100000] !flex max-h-[93vh] !flex-col">
            <div className="!flex-1 !overflow-y-auto !px-[16px] sm:!p-[16px]">
              <Accordion
                type="multiple"
                defaultValue={[
                  'category',
                  'price',
                  'size',
                  'stockStatus',
                  ...(isShopifyStore ? [] : ['featured']),
                  'sale',
                  'color',
                  'brand',
                  'tags',
                ]}
                className="!w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger className="text-[16px] !font-extrabold">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {availableCategories.map((category) => (
                        <label
                          key={category}
                          className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="!text-primary !bg-background !border-border !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[24px]">
                              {category}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !bg-muted !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
                            {categoryCounts[category] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {showOptionalFilters.brands && (
                  <AccordionItem value="brand">
                    <AccordionTrigger className="text-[16px] !font-extrabold">
                      Brand
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {availableBrands.map((brand) => (
                          <label
                            key={brand}
                            className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.brands.includes(brand)}
                                onChange={() => handleBrandChange(brand)}
                                className="!text-primary !bg-background !border-border !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                              />
                              <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                                {brand}
                              </span>
                            </div>
                            <span className="!text-muted-foreground !bg-muted !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
                              {brandCounts[brand] || 0}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="price">
                  <AccordionTrigger className="text-[16px] !font-extrabold">
                    <b className="!font-extrabold">Price</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[16px] !pt-[16px]">
                      <Slider
                        value={[filters.priceRange[1]]}
                        onValueChange={(value: number[]) =>
                          setFilters((prev: FilterState) => ({
                            ...prev,
                            priceRange: [prev.priceRange[0], value[0] ?? maxPrice],
                          }))
                        }
                        max={maxPrice}
                        step={1}
                        className="!w-full"
                      />
                      <div className="!text-muted-foreground !flex !justify-between !text-[14px]">
                        <span>{filters.priceRange[0]} €</span>
                        <span>{filters.priceRange[1]} €</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="size">
                  <AccordionTrigger className="text-[16px] !font-extrabold">
                    <b className="!font-extrabold">Size</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!grid !grid-cols-4 !gap-[8px] !pt-[16px]">
                      {availableSizes.map((size) => (
                        <div
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`my-border !rounded-lg !py-[8px] text-center !text-[12px] !font-medium sm:!py-[12px] sm:!text-[14px] ${
                            filters.sizes.includes(size)
                              ? '!bg-primary !text-primary-foreground'
                              : ''
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
                    <AccordionTrigger className="text-[16px] !font-extrabold">
                      <b className="!font-extrabold">Color</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!flex !flex-wrap !gap-[8px] !pt-[16px]">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`!h-[32px] !w-[32px] !rounded-full !border-4 !transition-all sm:!h-[40px] sm:!w-[40px] ${
                              filters.colors.includes(color)
                                ? '!border-primary !scale-110 !shadow-lg'
                                : '!border-border hover:!border-muted-foreground'
                            }`}
                            style={{
                              backgroundColor: color.toLowerCase(),
                            }}
                            title={`Filter by ${color} color`}
                            aria-label={`Filter by ${color} color${filters.colors.includes(color) ? ' (selected)' : ''}`}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {showOptionalFilters.tags && (
                  <AccordionItem value="tags">
                    <AccordionTrigger className="text-[16px] !font-extrabold">
                      <b className="!font-extrabold">Tags</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[8px]">
                        {availableTags.map((tag) => (
                          <label
                            key={tag}
                            className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.tags.includes(tag)}
                                onChange={() => handleTagChange(tag)}
                                className="!text-primary !bg-background !border-border !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                              />
                              <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                                {tag}
                              </span>
                            </div>
                            <span className="!text-muted-foreground !bg-muted !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
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
                      {['In Stock', 'Out of Stock', 'On Backorder'].map((status) => (
                        <label
                          key={status}
                          className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.stockStatus.includes(status)}
                              onChange={() => handleStockStatusChange(status)}
                              className="!border-border !bg-background !text-primary !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                              {status}
                            </span>
                          </div>
                          <span className="!bg-muted !text-muted-foreground !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
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
                        {['Featured', 'Not Featured'].map((status) => (
                          <label
                            key={status}
                            className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                          >
                            <div className="!flex !items-center !gap-[12px]">
                              <input
                                type="checkbox"
                                checked={filters.featuredProducts.includes(status)}
                                onChange={() => handleFeaturedProductsChange(status)}
                                className="!border-border !bg-background !text-primary !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                              />
                              <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                                {status}
                              </span>
                            </div>
                            <span className="!bg-muted !text-muted-foreground !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
                              {status === 'Featured' ? featuredCount : notFeaturedCount}
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
                      {['On Sale', 'Not On Sale'].map((status) => (
                        <label
                          key={status}
                          className="hover:!bg-muted !flex !cursor-pointer !items-center !justify-between !rounded-lg !p-[4px] sm:!p-[8px]"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.saleStatus.includes(status)}
                              onChange={() => handleSaleStatusChange(status)}
                              className="!border-border !bg-background !text-primary !h-[16px] !w-[16px] !rounded sm:!h-5 sm:!w-5"
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                              {status}
                            </span>
                          </div>
                          <span className="!bg-muted !text-muted-foreground !rounded !px-[8px] !py-[4px] !text-[12px] sm:!text-[14px]">
                            {status === 'On Sale' ? saleCount : notSaleCount}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="!bg-background !mt-auto">
              <div className="!flex !items-center !justify-between !bg-gray-50 !p-[12px]">
                <div className="!text-foreground pl-[8px] text-[14px]">
                  <b>{totalProducts}</b> products found
                </div>
                <DrawerClose asChild>
                  <button
                    className="hover:!bg-muted !rounded-full !pr-[4px] !transition-colors"
                    aria-label="Close filters"
                    title="Close filters"
                  >
                    <X className="!h-[20px] !w-[20px] rounded-[9999px] border bg-[#823BED] !text-white" />
                  </button>
                </DrawerClose>
              </div>
              <div className="!border-border !flex !gap-[8px] !border-t !p-[16px]">
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
                  className="!border-border !text-foreground hover:!bg-muted !flex-1 !rounded-lg !border !py-[12px] text-[14px] !font-medium !transition-colors"
                >
                  Clear All
                </button>
                <DrawerClose asChild>
                  <button className="!bg-primary !text-primary-foreground hover:!bg-primary-hover !flex-1 !rounded-lg !py-[12px] text-[14px] !font-medium !transition-colors">
                    Apply Filters
                  </button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="!mx-auto !flex !w-full lg:px-[64px]">
        <aside
          className="!bg-filter-bg !hidden w-80 !p-[16px] lg:!w-[312px] xl:!block"
          style={{
            opacity: shouldShowFilters ? 1 : 0,
            pointerEvents: shouldShowFilters ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <Accordion
            type="multiple"
            defaultValue={[
              'category',
              'price',
              'size',
              'color',
              'brand',
              'tags',
              'stockStatus',
              'featured',
              'sale',
            ]}
          >
            {showMandatoryFilters.categories && (
              <AccordionItem value="category">
                <AccordionTrigger className="!text-foreground text-[16px] lg:text-[18px]">
                  <b>Category</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {availableCategories.map((category) => (
                      <label
                        key={category}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleCategoryChange(category)}
                            className="!text-primary !bg-background !border-border top-0 !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {category}
                          </span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {categoryCounts[category] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showOptionalFilters.brands && (
              <AccordionItem value="brand">
                <AccordionTrigger className="!text-foreground text-[16px] !font-extrabold lg:text-[18px]">
                  <b>Brand</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {availableBrands.map((brand) => (
                      <label
                        key={brand}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[8px]">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="!text-primary !bg-background !border-border !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {brand}
                          </span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {brandCounts[brand] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showMandatoryFilters.price && (
              <AccordionItem value="price">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[800] lg:text-[18px]">
                  <b className="font-extrabold">Price</b>
                </AccordionTrigger>
                <AccordionContent>
                  <Slider
                    value={[filters.priceRange[1]]}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], value[0] ?? maxPrice],
                      }))
                    }
                    max={maxPrice}
                    step={1}
                    className="!mt-[8px] !mb-[16px] !w-full"
                  />
                  <div className="!text-muted-foreground !flex !justify-between !text-[12px] lg:text-[14px]">
                    <span>{filters.priceRange[0]} €</span>
                    <span>{filters.priceRange[1]} €</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showOptionalFilters.sizes && (
              <AccordionItem value="size">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Size</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!grid !grid-cols-4 !gap-[8px]">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeChange(size)}
                        className={`my-border !rounded !py-[8px] !text-[12px] !font-medium lg:text-[14px] ${
                          filters.sizes.includes(size) ? '!bg-primary !text-primary-foreground' : ''
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showOptionalFilters.colors && (
              <AccordionItem value="color">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Color</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!flex !gap-[8px]">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`!h-[24px] !w-[24px] !rounded-full !border-2 lg:!h-[32px] lg:!w-[32px] ${
                          filters.colors.includes(color)
                            ? '!border-primary !scale-110'
                            : '!border-border'
                        }`}
                        data-color={color.toLowerCase()}
                        title={`Filter by ${color} color`}
                        aria-label={`Filter by ${color} color${filters.colors.includes(color) ? ' (selected)' : ''}`}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            {showOptionalFilters.tags && (
              <AccordionItem value="tags">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Tags</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {availableTags.map((tag) => (
                      <label
                        key={tag}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.tags.includes(tag)}
                            onChange={() => handleTagChange(tag)}
                            className="!text-primary !bg-background !border-border top-0 !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">{tag}</span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {tagCounts[tag] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Mandatory Facets */}
            {showMandatoryFilters.stockStatus && (
              <AccordionItem value="stockStatus">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Stock Status</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {['In Stock', 'Out of Stock', 'On Backorder'].map((status) => (
                      <label
                        key={status}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.stockStatus.includes(status)}
                            onChange={() => handleStockStatusChange(status)}
                            className="!border-border !bg-background !text-primary top-0 !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {status}
                          </span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {stockStatusCounts[status] ?? 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {!isShopifyStore && showMandatoryFilters.featured && (
              <AccordionItem value="featured">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Featured Products</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {['Featured', 'Not Featured'].map((status) => (
                      <label
                        key={status}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.featuredProducts.includes(status)}
                            onChange={() => handleFeaturedProductsChange(status)}
                            className="!border-border !bg-background !text-primary top-0 !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {status}
                          </span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {status === 'Featured' ? featuredCount : notFeaturedCount}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {showMandatoryFilters.sale && (
              <AccordionItem value="sale">
                <AccordionTrigger className="!text-foreground text-[16px] !font-[700] lg:text-[18px]">
                  <b className="font-extrabold">Sale Status</b>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="!space-y-[8px]">
                    {['On Sale', 'Not On Sale'].map((status) => (
                      <label
                        key={status}
                        className="!flex !cursor-pointer !items-center !justify-between"
                      >
                        <div className="!flex !items-center !gap-[10px]">
                          <input
                            type="checkbox"
                            checked={filters.saleStatus.includes(status)}
                            onChange={() => handleSaleStatusChange(status)}
                            className="!border-border !bg-background !text-primary top-0 !h-[16px] !w-[16px] !rounded lg:!h-5 lg:!w-5"
                          />
                          <span className="!text-foreground text-[14px] lg:text-[16px]">
                            {status}
                          </span>
                        </div>
                        <span className="!text-muted-foreground mr-[8px] !text-[12px] lg:text-[14px]">
                          {status === 'On Sale' ? saleCount : notSaleCount}
                        </span>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
          {isAnyFilterActive && (
            <Button
              size="lg"
              className="!border-search-highlight mt-[16px] w-full rounded-lg py-[16px] text-[14px] font-bold lg:text-[16px]"
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
                  <h3 className="!text-foreground !text-[16px] !font-bold">Recent Searches</h3>
                  <button
                    onClick={handleClearRecentSearches}
                    className="!text-muted-foreground hover:!text-foreground !text-sm"
                  >
                    Clear all
                  </button>
                </div>
                <div className="!flex !flex-wrap !gap-[8px]">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="!bg-muted !flex !items-center !gap-[4px] !rounded-full !px-[12px] !py-[6px]"
                    >
                      <span
                        className="!text-foreground !cursor-pointer !text-sm"
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
                        className="hover:!bg-background !rounded-full !p-1"
                      >
                        <X className="!text-muted-foreground !h-[12px] !w-[12px]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!showRecommendations && (
              <div className="!text-foreground mt-[8px] !mb-[8px] hidden pt-[22px] pb-[4px] !text-[14px] !font-bold sm:!text-[16px] lg:flex lg:text-[18px]">
                {/* {isAnyFilterActive ? "Search Results" : ""} */}
                Search Results
              </div>
            )}
            {!showRecommendations && (
              <div className="!text-muted-foreground !mb-[16px] flex items-center justify-between pt-[16px] text-[12px] lg:pt-[0px] lg:text-[16px]">
                <div className="!ml-[8px]">
                  <b className="text-foreground !font-extrabold">{displayedProducts}</b> out of{' '}
                  <b className="text-foreground !font-extrabold">{totalProducts}</b> products
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="!border-border !flex !items-center !rounded-md !border !px-[8px] !py-[4px] text-[12px] md:!px-[12px] md:!py-[8px] lg:text-[14px]">
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
                          setSortOption('default');
                        }}
                        className="text-[14px]"
                      >
                        Relevance
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('a-z');
                        }}
                        className="text-[14px]"
                      >
                        Name: A-Z
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('z-a');
                        }}
                        className="text-[14px]"
                      >
                        Name: Z-A
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('price-asc');
                        }}
                        className="text-[14px]"
                      >
                        Price: Low to High
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('price-desc');
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
                      className="group !border-border !bg-background !flex !w-full !cursor-pointer !flex-col !rounded-lg !border !p-[8px] !transition-shadow hover:!shadow-lg sm:!p-[12px]"
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
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        {product.featured && (
                          <div className="!bg-primary !text-primary-foreground !absolute !top-2 !right-2 !rounded-full !px-2 !py-1 !text-xs !font-bold">
                            Featured
                          </div>
                        )}
                        {product.salePrice &&
                          product.salePrice !== '' &&
                          product.salePrice !== '0' &&
                          product.salePrice !== '0.00' &&
                          product.regularPrice &&
                          parseFloat(product.salePrice) < parseFloat(product.regularPrice) &&
                          (() => {
                            const discountPercentage = calculateDiscountPercentage(
                              product.regularPrice,
                              product.salePrice
                            );
                            return discountPercentage ? (
                              <div className="!absolute !top-2 !left-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                                -{discountPercentage}%
                              </div>
                            ) : (
                              <div className="!absolute !top-2 !left-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                                Sale
                              </div>
                            );
                          })()}
                      </div>
                      <h3 className="!text-foreground !mb-[4px] h-[40px] overflow-hidden !text-[14px] !font-bold sm:!mb-[8px] sm:h-[48px] sm:!text-[16px]">
                        {product.title}
                      </h3>
                      <div className="mt-auto !flex !items-center !justify-between">
                        <div className="!flex !items-center !gap-[8px]">
                          {product.salePrice &&
                          product.salePrice !== '' &&
                          product.salePrice !== '0' &&
                          product.salePrice !== '0.00' &&
                          product.regularPrice &&
                          parseFloat(product.salePrice) < parseFloat(product.regularPrice) ? (
                            <div className="!flex !items-center !gap-2">
                              <span className="!text-primary !text-[14px] !font-bold sm:!text-[16px]">
                                {product.salePrice}
                              </span>
                              <span className="!text-muted-foreground !text-[12px] !line-through sm:!text-[14px]">
                                {product.regularPrice}
                              </span>
                            </div>
                          ) : (
                            <span className="!text-muted-foreground !text-[12px] sm:!text-[14px]">
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
                          className="!bg-primary !text-primary-foreground hover:!bg-primary-hover !transform !rounded-md !p-[6px] !transition-colors !duration-200 group-hover:!scale-110 disabled:!cursor-not-allowed disabled:!opacity-50 sm:!p-[8px]"
                          aria-label={`Add ${product.title} to cart`}
                          title={`Add ${product.title} to cart`}
                        >
                          {addingToCart === product.id ? (
                            <div className="!border-primary-foreground !h-[12px] !w-[12px] !animate-spin !rounded-full !border-2 !border-t-transparent sm:!h-[16px] sm:!w-[16px]"></div>
                          ) : (
                            <ShoppingCart className="!h-[12px] !w-[12px] sm:!h-[16px] sm:!w-[16px]" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Infinite scroll trigger for mobile */}
                {isMobile && hasMoreProducts && displayedProducts > 0 && !isLoading && (
                  <div
                    ref={loadMoreTriggerRef}
                    id="load-more-trigger"
                    className="!my-4 !h-16 !w-full"
                  >
                    {isLoadingMore && (
                      <div className="!flex !items-center !justify-center !py-4">
                        <div className="!flex !items-center !gap-2">
                          <div className="!flex !space-x-2">
                            <div className="animate-bounce-delay-0 !bg-primary !h-2 !w-2 !animate-bounce !rounded-full"></div>
                            <div className="animate-bounce-delay-150 !bg-primary !h-2 !w-2 !animate-bounce !rounded-full"></div>
                            <div className="animate-bounce-delay-300 !bg-primary !h-2 !w-2 !animate-bounce !rounded-full"></div>
                          </div>
                          <span className="!text-muted-foreground !text-sm">
                            Loading {Math.min(12, totalProducts - displayedProducts)} more
                            products...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Load More button for desktop */}
                {!isMobile && hasMoreProducts && displayedProducts > 0 && !isLoading && (
                  <div className="!mt-8 !flex !justify-center">
                    <button
                      onClick={() => void loadMoreProducts()}
                      disabled={isLoadingMore}
                      className="!disabled:opacity-50 !disabled:cursor-not-allowed !bg-primary !text-primary-foreground hover:!bg-primary-hover !rounded-lg !px-8 !py-3 !font-medium !transition-colors"
                    >
                      {isLoadingMore
                        ? 'Loading...'
                        : `Load More (${Math.min(12, totalProducts - displayedProducts)} more)`}
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading &&
              !isPending &&
              !showRecommendations &&
              sortedProducts.length === 0 &&
              hasSearched && (
                <div className="!animate-in !fade-in !w-full !py-[48px] !text-center !duration-300">
                  <div className="!flex !flex-col !items-center !gap-4">
                    <div className="!bg-muted !animate-in !zoom-in !flex !h-16 !w-16 !items-center !justify-center !rounded-full !duration-500">
                      <Search className="!text-muted-foreground !h-8 !w-8" />
                    </div>
                    <div className="!animate-in !slide-in-from-bottom-2 !duration-500">
                      <p className="!lg:text-[20px] !text-foreground !mb-2 !text-[18px] !font-semibold">
                        Search not found
                      </p>
                      <p className="!lg:text-[16px] !text-muted-foreground !text-[14px]">
                        No products found matching your criteria. Try different keywords or browse
                        our categories.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Cart Message Display */}
            {cartMessage && (
              <div className="!bg-primary !text-primary-foreground !fixed !top-4 !right-4 !z-[999999] !max-w-sm !rounded-lg !px-4 !py-2 !shadow-lg">
                <div className="!flex !items-center !gap-2">
                  <div className="!border-primary-foreground !h-4 !w-4 !animate-spin !rounded-full !border-2 !border-t-transparent"></div>
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
