import React, {
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Search, ShoppingCart, X, Filter, ChevronDown } from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Product, FilterState } from "../types";

const KalifindSearch: React.FC<{
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
}> = ({
  onClose,
  searchQuery: initialSearchQuery,
  hideHeader = false,
  storeUrl = "https://findifly.kinsta.cloud",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
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
  const [hasSearched, setHasSearched] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>(["shirt", "underwear", "plan"]);
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
  const [sortOption, setSortOption] = useState("default");
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
    featuredProducts: false,
    saleStatus: false,
  });

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem("recentSearches");
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
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

  // Sync search query from parent (for mobile/tablet)
  useEffect(() => {
    if (
      initialSearchQuery !== undefined &&
      initialSearchQuery !== searchQuery
    ) {
      console.log("Syncing search query from parent:", initialSearchQuery);
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

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
    filters.featuredProducts ||
    filters.saleStatus;

  // Show filters if user has searched or filters are active
  const shouldShowFilters = showFilters || isAnyFilterActive;

  // Fetch popular searches
  const fetchPopularSearches = async () => {
    if (!storeUrl) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/search/popular?storeUrl=${storeUrl}`,
        {}
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch popular searches");
      }
      
      const result = await response.json();
      
      // Handle response format
      let searches: string[];
      if (Array.isArray(result)) {
        searches = result;
      } else if (result && Array.isArray(result.searches)) {
        searches = result.searches;
      } else {
        searches = ["shirt", "underwear", "plan"]; // Fallback to default
      }
      
      setPopularSearches(searches.slice(0, 6)); // Limit to 6 popular searches
    } catch (error) {
      console.error("Failed to fetch popular searches:", error);
      // Keep default popular searches
    }
  };

  // Fetch smart recommendations
  const fetchRecommendations = async () => {
    if (!storeUrl) return;
    try {
      // Try to fetch AI-powered recommendations first
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/search/recommended?storeUrl=${storeUrl}&type=smart`,
        {}
      );
      
      if (!response.ok) {
        // Fallback to trending products if smart recommendations fail
        const trendingResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/search/trending?storeUrl=${storeUrl}`,
          {}
        );
        
        if (!trendingResponse.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        
        const trendingResult = await trendingResponse.json();
        let products: Product[];
        if (Array.isArray(trendingResult)) {
          products = trendingResult;
        } else if (trendingResult && Array.isArray(trendingResult.products)) {
          products = trendingResult.products;
        } else {
          products = [];
        }
        
        setRecommendations(products.slice(0, 8));
        return;
      }
      
      const result = await response.json();
      
      // Handle response format
      let products: Product[];
      if (Array.isArray(result)) {
        products = result;
      } else if (result && Array.isArray(result.products)) {
        products = result.products;
      } else {
        products = [];
      }
      
      setRecommendations(products.slice(0, 8)); // Limit to 8 recommendations
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setRecommendations([]);
    }
  };

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
      fetchRecommendations();
      fetchPopularSearches();
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
      if (!hasSearched) {
        setHasSearched(true);
      }
    }
  }, [searchQuery, hasSearched, storeUrl]);

  useEffect(() => {
    const initFilters = async () => {
      if (!storeUrl) return;


      const fetchWithRetry = async (retries = 3) => {
        try {
          const params = new URLSearchParams();
          params.append("storeUrl", storeUrl);

          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
            {},
          );

          if (!response.ok) {
            throw new Error("bad response");
          }

          const result = await response.json();
          
          // Handle both array and object response formats
          let products: Product[];
          if (Array.isArray(result)) {
            products = result;
          } else if (result && Array.isArray(result.products)) {
            products = result.products;
          } else {
            console.error("Kalifind Search: Unexpected API response format:", result);
            return;
          }

          if (products && products.length > 0) {
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
            
            products.forEach((product: Product) => {
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

      fetchWithRetry();
    };

    initFilters();
  }, [storeUrl]);

  // Click outside handler
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

  // Autocomplete search
  useEffect(() => {
    if (!storeUrl) return;
    if (debouncedSearchQuery) {
      startTransition(() => {
        setIsAutocompleteLoading(true);
        (async () => {
          try {
            const params = new URLSearchParams();
            if (debouncedSearchQuery) {
              params.append("q", debouncedSearchQuery);
            }
            if (storeUrl) {
              params.append("storeUrl", storeUrl);
            }

            const url = `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`;
            console.log("Autocomplete API call:", url);
            
            const response = await fetch(url, {});

            if (!response.ok) {
              console.error("Autocomplete API error:", response.status, response.statusText);
              throw new Error("bad response");
            }

            const result = await response.json();
            console.log("Autocomplete API result:", result);
            setAutocompleteSuggestions(result.map((r: Product) => r.title || r.name) || []);
            setHighlightedSuggestionIndex(-1); // Reset highlight when new suggestions arrive
          } catch (error) {
            console.error("Failed to fetch autocomplete suggestions:", error);
            setAutocompleteSuggestions([]);
          } finally {
            setIsAutocompleteLoading(false);
          }
        })();
      });
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [debouncedSearchQuery, storeUrl]);

  // search products
  useEffect(() => {
    console.log("Search effect triggered:", {
      isPriceLoading,
      storeUrl,
      showRecommendations,
      isInitialState,
      debouncedSearchQuery,
      searchQuery
    });
    
    if (isPriceLoading || !storeUrl || showRecommendations || isInitialState) {
      console.log("Search effect skipped due to conditions");
      return; // Wait for the initial price to be loaded or skip if showing recommendations or in initial state
    }

    startTransition(() => {
      setIsLoading(true);
      setCurrentPage(1);
      setHasMoreProducts(true);
      const fetchProducts = async () => {
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
          if (debouncedSearchQuery) {
            params.append("q", debouncedSearchQuery);
            
            // Add popular search boosting
            const lowerQuery = debouncedSearchQuery.toLowerCase();
            const matchingPopularTerms = popularSearches.filter(term => 
              lowerQuery.includes(term.toLowerCase())
            );
            if (matchingPopularTerms.length > 0) {
              params.append("popularTerms", matchingPopularTerms.join(","));
            }
          }
          if (storeUrl) {
            params.append("storeUrl", storeUrl);
          }

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
          // Mandatory facets
          if (filters.stockStatus.length > 0) {
            params.append("stockStatus", filters.stockStatus.join(","));
          }
          if (filters.featuredProducts) {
            params.append("featured", "true");
          }
          if (filters.saleStatus) {
            params.append("onSale", "true");
          }
          params.append("minPrice", debouncedPriceRange[0].toString());
          params.append(
            "maxPrice",
            debouncedPriceRange[1].toString() ?? "999999",
          );
          params.append("page", "1");
          params.append("limit", "12");

          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/v1/search?${params.toString()}`,
            {},
          );

          console.log(
            `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
          );
          if (!response.ok) {
            throw new Error("bad response");
          }
          const result = await response.json();
          
          // Handle paginated response format
          let products: Product[];
          let total = 0;
          let hasMore = false;
          
          if (result && Array.isArray(result.products)) {
            products = result.products;
            total = result.total || 0;
            hasMore = result.hasMore || false;
          } else if (Array.isArray(result)) {
            products = result;
            total = result.length;
            hasMore = false;
          } else {
            console.error("Kalifind Search: Unexpected search response format:", result);
            products = [];
            total = 0;
            hasMore = false;
          }
          
          setFilteredProducts(products);
          setTotalProducts(total);
          setDisplayedProducts(products.length);
          setHasMoreProducts(hasMore);
          console.log(products);
        } catch (error) {
          console.error("Failed to fetch products:", error);
          setFilteredProducts([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
    });
  }, [
    isPriceLoading, // Add this
    debouncedSearchQuery,
    filters.categories,
    filters.colors,
    filters.sizes,
    filters.brands,
    filters.tags,
    filters.stockStatus,
    filters.featuredProducts,
    filters.saleStatus,
    filters.priceRange,
    debouncedPriceRange,
    storeUrl,
    showRecommendations,
    isInitialState,
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
        return productsToSort.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price),
        );
      case "price-desc":
        return productsToSort.sort(
          (a, b) => parseFloat(b.price) - parseFloat(a.price),
        );
      default:
        return productsToSort;
    }
  }, [filteredProducts, sortOption]);

  const handleSearch = (query: string) => {
    console.log("handleSearch called with:", query);
    setSearchQuery(query);
    
    // Show autocomplete when user starts typing
    if (query.trim()) {
      setShowAutocomplete(true);
    }
    
    // Add to recent searches if it's a new search
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => {
        const newSearches = [
          query.trim(),
          ...prev.filter((item) => item !== query.trim()),
        ].slice(0, 10);
        return newSearches;
      });
    }
  };

  const handlePopularSearchClick = (term: string) => {
    handleSearch(term);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Clicking a suggestion:
    // - Sets the clicked value into the search input
    // - Automatically triggers a search for that value
    // - Saves the clicked value into recent searches via Zustand and updates localStorage
    console.log("Suggestion clicked:", suggestion);
    setSearchQuery(suggestion);
    console.log("Search query set to:", suggestion);
    setShowAutocomplete(false);
    setHighlightedSuggestionIndex(-1);
    inputRef.current?.blur();
    
    // Add to recent searches
    if (suggestion.trim() && !recentSearches.includes(suggestion.trim())) {
      setRecentSearches((prev) => {
        const newSearches = [
          suggestion.trim(),
          ...prev.filter((item) => item !== suggestion.trim()),
        ].slice(0, 10);
        return newSearches;
      });
    }

    // Trigger search immediately by updating the search behavior state
    setShowRecommendations(false);
    setShowFilters(true);
    setIsInitialState(false);
    if (!hasSearched) {
      setHasSearched(true);
    }
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
      
      if (query) {
        setRecentSearches((prev) => {
          const newSearches = [
            query,
            ...prev.filter((item) => item !== query),
          ].slice(0, 10);
          return newSearches;
        });
        setShowAutocomplete(false);
        inputRef.current?.blur();
        
        // Trigger search immediately when Enter is pressed
        setShowRecommendations(false);
        setShowFilters(true);
        setIsInitialState(false);
        if (!hasSearched) {
          setHasSearched(true);
        }
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
  };

  const handleBrandChange = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleSizeChange = (size: string) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleColorChange = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const handleTagChange = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
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

  const handleFeaturedProductsChange = () => {
    setFilters((prev) => ({
      ...prev,
      featuredProducts: !prev.featuredProducts,
    }));
  };

  const handleSaleStatusChange = () => {
    setFilters((prev) => ({
      ...prev,
      saleStatus: !prev.saleStatus,
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
        params.append("stockStatus", filters.stockStatus.join(","));
      }
      if (filters.featuredProducts) {
        params.append("featured", "true");
      }
      if (filters.saleStatus) {
        params.append("onSale", "true");
      }
      params.append("minPrice", debouncedPriceRange[0].toString());
      params.append("maxPrice", debouncedPriceRange[1].toString() ?? "999999");
      
      params.append("page", (currentPage + 1).toString());
      params.append("limit", "12");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
        {}
      );

      if (!response.ok) {
        throw new Error("Failed to load more products");
      }

      const result = await response.json();
      let products: Product[];
      let hasMore = false;
      
      if (result && Array.isArray(result.products)) {
        products = result.products;
        hasMore = result.hasMore || false;
      } else if (Array.isArray(result)) {
        products = result;
        hasMore = false;
      } else {
        products = [];
        hasMore = false;
      }

      if (products.length === 0) {
        setHasMoreProducts(false);
      } else {
        setFilteredProducts(prev => [...prev, ...products]);
        setDisplayedProducts(prev => prev + products.length);
        setCurrentPage(prev => prev + 1);
        setHasMoreProducts(hasMore);
      }
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreProducts, debouncedSearchQuery, storeUrl, currentPage, filters, debouncedPriceRange]);

  // Infinite scroll observer for mobile
  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreProducts && !isLoadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [isMobile, hasMoreProducts, isLoadingMore, loadMoreProducts]);

  const LoadingSkeleton = () => (
    <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[16px] !w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="!bg-loading !rounded-lg !p-[8px] md:!p-[16px] !animate-pulse-slow !w-full"
        >
          <div className="!bg-loading-shimmer !h-[128px] md:!h-[192px] !rounded-md !mb-[12px] md:!mb-[16px] !relative !overflow-hidden">
            <div className="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
          </div>
          <div className="!bg-loading-shimmer !h-[16px] !rounded !mb-[8px]"></div>
          <div className="!bg-loading-shimmer !h-[24px] !rounded !w-[80px]"></div>
        </div>
      ))}
    </div>
  );

  return (
    // <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px] lg:px-[96px]">
    <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px]">
      {!hideHeader && (
        <div className="!bg-background !w-full pt-[12px] lg:px-[48px]">
          <div className="!flex !items-center justify-center !mx-auto flex-col lg:flex-row !w-full ">
            <div className="!flex !items-center !gap-[8px] justify-between md:justify-normal">
              <div className="lg:!flex !items-center !hidden w-[340px]">
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
              className="lg:pl-[0px] !flex-1 !relative !w-full px-[16px] md:px-0"
              ref={searchRef}
            >
              <div
                className="!flex !items-center !gap-[8px] !flex-1 !w-full"
                ref={searchRef}
              >
                <div className="!w-full flex ">
                  <div className="!relative !flex-1 !w-full !border-b-2 !border-search-highlight">
                    <Search className="!absolute !left-[7px] !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-[20px] !h-[20px]" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowAutocomplete(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search"
                      className="!w-full !pl-[30px] !pr-[16px] !py-[12px] !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!border-none focus:!ring-0"
                      style={{
                        background: "inherit",
                        border: "none",
                        color: "inherit",
                        paddingLeft: "30px",
                      }}
                    />

                    {/* <div className="!absolute !right-[12px] !top-1/2 !transform !-translate-y-1/2 !flex !gap-[8px]"></div> */}
                  </div>
                  <button
                    className="!rounded-lg hover:!bg-muted/20 !transition-colors !duration-200 !flex-shrink-0"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="font-bold !mr-[10px] !w-[25px] !h-[25px] !text-muted-foreground hover:!text-foreground !transition-colors !duration-200" />
                  </button>
                </div>
              </div>

              {showAutocomplete && debouncedSearchQuery && (
                  <div className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-50 !mt-[4px] !w-full">
                    <div className="!z-[999] !p-[16px]">
                      {isAutocompleteLoading ? (
                        <div className="!flex !items-center !justify-center !py-[12px] !gap-[8px] !text-muted-foreground">
                          <div className="!w-4 !h-4 !border-2 !border-muted-foreground !border-t-transparent !rounded-full !animate-spin"></div>
                          <span>Loading suggestions...</span>
                        </div>
                      ) : autocompleteSuggestions.length > 0 ? (
                        <>
                          <h3 className="!text-[14px] leading-[6px] !font-medium !text-foreground !mb-[12px]">
                            Suggestions
                          </h3>
                          <div className="!space-y-[8px]">
                            {autocompleteSuggestions.map(
                              (suggestion, index) => (
                                <div
                                  key={index}
                                  className={`!flex !items-center !gap-[8px] !cursor-pointer hover:!bg-muted !p-[8px] !rounded ${
                                    index === highlightedSuggestionIndex ? '!bg-muted' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Desktop suggestion clicked:", suggestion);
                                    handleSuggestionClick(suggestion);
                                  }}
                                >
                                  <Search className="!w-[16px] !h-[16px] !text-muted-foreground" />
                                  <span className="!text-muted-foreground">
                                    {suggestion}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      ) : !isAutocompleteLoading ? (
                        <div className="!flex !items-center !justify-center !py-[12px] !text-muted-foreground">
                          <Search className="!w-4 !h-4 !mr-2" />
                          <span>No suggestions found for "{debouncedSearchQuery}"</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <div className={`!fixed !bottom-[16px] !left-1/2 !-translate-x-1/2 !z-50 ${shouldShowFilters ? '!block lg:!hidden' : '!hidden'}`}>
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
                  (filters.featuredProducts ? 1 : 0) +
                  (filters.saleStatus ? 1 : 0)}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="!z-[100000] !flex !flex-col max-h-[93vh]">
            <div className="!px-[16px] sm:!p-[16px] !overflow-y-auto !flex-1">
              <Accordion
                type="multiple"
                defaultValue={["category", "price", "size", "color", "brand", "tags"]}
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
                            filters.sizes.includes(size) ? "!bg-primary !text-primary-foreground" : ""
                          }`}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
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
                          }}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
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
                
                {/* Mandatory Facets for Mobile */}
                <AccordionItem value="stockStatus">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Stock Status</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {["In Stock", "Out of Stock", "On Backorder"].map((status) => (
                        <label
                          key={status}
                          className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.stockStatus.includes(status)}
                              onChange={() => handleStockStatusChange(status)}
                              className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                              {status}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="featured">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Featured Products</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      <label className="!flex !items-center !gap-[12px] !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg">
                        <input
                          type="checkbox"
                          checked={filters.featuredProducts}
                          onChange={handleFeaturedProductsChange}
                          className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                          Featured Only
                        </span>
                      </label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="sale">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Sale Status</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      <label className="!flex !items-center !gap-[12px] !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg">
                        <input
                          type="checkbox"
                          checked={filters.saleStatus}
                          onChange={handleSaleStatusChange}
                          className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                          On Sale Only
                        </span>
                      </label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="!mt-auto !bg-background">
              <div className="!flex !items-center !justify-between !p-[12px] !bg-gray-50">
                <div className="pl-[8px] text-[14px] !text-foreground">
                  <b>{totalProducts}</b> products found
                </div>
                <DrawerClose asChild>
                  <button className="!pr-[4px] hover:!bg-muted !rounded-full !transition-colors">
                    <X className="!w-[20px] !h-[20px] border bg-[#823BED] rounded-[9999px] !text-white" />
                  </button>
                </DrawerClose>
              </div>
              <div className="!flex !gap-[8px] !p-[16px] !border-t !border-border">
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
                    featuredProducts: false,
                    saleStatus: false,
                  });
                }}
                  className="!flex-1 !py-[12px] !border !border-border !text-foreground !rounded-lg !font-medium hover:!bg-muted !transition-colors text-[14px]"
                >
                  Clear All
                </button>
                <DrawerClose asChild>
                  <button className="!flex-1 !py-[12px] !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors text-[14px]">
                    Apply Filters
                  </button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="!flex !w-full lg:px-[64px] !mx-auto">
        <aside className={`w-80 lg:!w-[312px] !p-[16px] !bg-filter-bg ${shouldShowFilters ? '!hidden lg:!block' : '!hidden'}`}>
          <Accordion
            type="multiple"
            defaultValue={["category", "price", "size", "color", "brand", "tags"]}
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
                        filters.sizes.includes(size) ? "!bg-primary !text-primary-foreground" : ""
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
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
            
            {/* Mandatory Facets */}
            <AccordionItem value="stockStatus">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Stock Status</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  {["In Stock", "Out of Stock", "On Backorder"].map((status) => (
                    <label
                      key={status}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-[10px]">
                        <input
                          type="checkbox"
                          checked={filters.stockStatus.includes(status)}
                          onChange={() => handleStockStatusChange(status)}
                          className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground text-[14px] lg:text-[16px]">
                          {status}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="featured">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Featured Products</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  <label className="!flex !items-center !gap-[10px] !cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.featuredProducts}
                      onChange={handleFeaturedProductsChange}
                      className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                    />
                    <span className="!text-foreground text-[14px] lg:text-[16px]">
                      Featured Only
                    </span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="sale">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Sale Status</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  <label className="!flex !items-center !gap-[10px] !cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.saleStatus}
                      onChange={handleSaleStatusChange}
                      className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                    />
                    <span className="!text-foreground text-[14px] lg:text-[16px]">
                      On Sale Only
                    </span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {isAnyFilterActive && (
            <Button
              size="lg"
              className="w-full mt-[16px] text-[14px] lg:text-[16px] py-[16px] !border-search-highlight font-bold rounded-lg"
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
                  featuredProducts: false,
                  saleStatus: false,
                });
              }}
            >
              Clear All Filters
            </Button>
          )}
        </aside>

        <main className="!flex-1 pb-[16px] sm:pb-[32px] !w-full !px-[8px] sm:!px-[16px]">
          <div className="!pr-[16px] sm:!pr-[32px] lg:pr-0 !w-full">
            {recentSearches.length > 0 && (
              <div className="!mt-8">
                <div className="!flex !justify-between !items-center !mb-[12px]">
                  <h3 className="!text-[16px] !font-bold !text-foreground">
                    Recent Searches
                  </h3>
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
                      className="!flex !items-center !gap-[4px] !bg-muted !rounded-full !px-[12px] !py-[6px]"
                    >
                      <span
                        className="!text-sm !text-foreground !cursor-pointer"
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
                        className="!rounded-full hover:!bg-background !p-1"
                      >
                        <X className="!w-[12px] !h-[12px] !text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!showRecommendations && (
              <div className="hidden lg:flex pt-[22px] pb-[4px]  !text-[14px] sm:!text-[16px] lg:text-[18px] !font-bold !text-foreground !mb-[8px] mt-[8px]">
                {/* {isAnyFilterActive ? "Search Results" : ""} */}
                Search Results
              </div>
            )}
            {!showRecommendations && (
              <div className="pt-[16px] lg:pt-[0px] !mb-[16px] flex justify-between items-center text-[12px] lg:text-[16px] !text-muted-foreground">
                <div className="!ml-[8px]">
                  <b className="!font-extrabold text-foreground">
                    {displayedProducts}
                  </b>{" "}
                  out of{" "}
                  <b className="!font-extrabold text-foreground">
                    {totalProducts}
                  </b>{" "}
                  products
                </div>
              </div>
            )}
            {!showRecommendations && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div className="!flex !items-center !border !border-border !px-[8px] !py-[4px] md:!px-[12px] md:!py-[8px] !rounded-md text-[12px] lg:text-[14px]">
                      Sort By
                      <ChevronDown className="!w-[12px] !h-[12px] md:!w-[16px] md:!h-[16px] !ml-[4px] md:!ml-[8px]" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[100000]"
                    container={document.body}
                  >
                    <DropdownMenuLabel className="!font-semibold text-[14px]">
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
            )}

            {showRecommendations ? (
              // Show recommendations and popular searches
              <div className="!w-full">
                {/* Popular Searches */}
                <div className="!mb-8">
                  <h3 className="!text-[18px] lg:!text-[20px] !font-bold !text-foreground !mb-4">
                    Popular Searches
                  </h3>
                  <p className="!text-[14px] !text-muted-foreground !mb-4">
                    Trending search terms from other customers
                  </p>
                  <div className="!flex !flex-wrap !gap-2">
                    {popularSearches.map((term, index) => (
                      <button
                        key={term}
                        onClick={() => handlePopularSearchClick(term)}
                        className="!bg-muted hover:!bg-primary hover:!text-primary-foreground !text-foreground !px-4 !py-2 !rounded-full !text-[14px] !font-medium !transition-all !duration-300 !transform hover:!scale-105 !capitalize !border !border-transparent hover:!border-primary"
                      >
                        <span className="!flex !items-center !gap-2">
                          <span className="!text-xs !bg-primary/20 !text-primary !px-2 !py-1 !rounded-full">
                            #{index + 1}
                          </span>
                          {term}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                  <div className="!mb-8">
                    <h3 className="!text-[18px] lg:!text-[20px] !font-bold !text-foreground !mb-4">
                      Smart Recommendations
                    </h3>
                    <p className="!text-[14px] !text-muted-foreground !mb-4">
                      AI-powered product suggestions based on trending items and user behavior
                    </p>
                    <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[8px] sm:!gap-[16px] !w-full">
                      {recommendations.map((product) => (
                        <div
                          key={product.id}
                          className="!bg-background !border !border-border !rounded-lg !p-[8px] sm:!p-[12px] hover:!shadow-lg !transition-shadow !w-full !flex !flex-col group"
                        >
                          <div className="!relative !mb-[8px] overflow-hidden">
                            <img
                              src={product.imageUrl || product.image}
                              alt={product.title}
                              className="!w-full !h-[112px] sm:!h-[144px] !object-cover !rounded-md group-hover:!scale-105 !transition-transform !duration-300"
                            />
                            {product.featured && (
                              <div className="!absolute !top-2 !right-2 !bg-primary !text-primary-foreground !px-2 !py-1 !rounded-full !text-xs !font-bold">
                                Featured
                              </div>
                            )}
                            {product.salePrice && (
                              <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                                Sale
                              </div>
                            )}
                          </div>
                          <h3 className="!text-[14px] sm:!text-[16px] !font-bold !text-foreground !mb-[4px] sm:!mb-[8px] h-[40px] sm:h-[48px] overflow-hidden">
                            {product.title}
                          </h3>
                          <div className="!flex !items-center !justify-between mt-auto">
                            <div className="!flex !items-center !gap-[8px]">
                              {product.salePrice ? (
                                <div className="!flex !items-center !gap-2">
                                  <span className="!text-primary !text-[14px] sm:!text-[16px] !font-bold">
                                    {product.salePrice}
                                  </span>
                                  <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !line-through">
                                    {product.regularPrice}
                                  </span>
                                </div>
                              ) : (
                                <span className="!text-muted-foreground !text-[12px] sm:!text-[14px]">
                                  {product.price}
                                </span>
                              )}
                            </div>
                            <button className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-[6px] sm:!p-[8px] !rounded-md !transition-colors group-hover:!scale-110 !transform !duration-200">
                              <ShoppingCart className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px]" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state for recommendations */}
                {recommendations.length === 0 && (
                  <div className="!text-center !py-[48px] !w-full">
                    <p className="!text-muted-foreground text-[16px] lg:text-[18px]">
                      Loading recommendations...
                    </p>
                  </div>
                )}
              </div>
            ) : isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[8px] sm:!gap-[16px] !w-full">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="!bg-background !border !border-border !rounded-lg !p-[8px] sm:!p-[12px] hover:!shadow-lg !transition-shadow !w-full !flex !flex-col group"
                    >
                      <div className="!relative !mb-[8px] overflow-hidden">
                        <img
                          src={product.imageUrl || product.image}
                          alt={product.title}
                          className="!w-full !h-[112px] sm:!h-[144px] !object-cover !rounded-md group-hover:!scale-105 !transition-transform !duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        {product.featured && (
                          <div className="!absolute !top-2 !right-2 !bg-primary !text-primary-foreground !px-2 !py-1 !rounded-full !text-xs !font-bold">
                            Featured
                          </div>
                        )}
                        {product.salePrice && (
                          <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                            Sale
                          </div>
                        )}
                      </div>
                      <h3 className="!text-[14px] sm:!text-[16px] !font-bold !text-foreground !mb-[4px] sm:!mb-[8px] h-[40px] sm:h-[48px] overflow-hidden">
                        {product.title}
                      </h3>
                      <div className="!flex !items-center !justify-between mt-auto">
                        <div className="!flex !items-center !gap-[8px]">
                          {product.salePrice ? (
                            <div className="!flex !items-center !gap-2">
                              <span className="!text-primary !text-[14px] sm:!text-[16px] !font-bold">
                                {product.salePrice}
                              </span>
                              <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !line-through">
                                {product.regularPrice}
                              </span>
                            </div>
                          ) : (
                            <span className="!text-muted-foreground !text-[12px] sm:!text-[14px]">
                              {product.price}
                            </span>
                          )}
                        </div>
                        <button className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-[6px] sm:!p-[8px] !rounded-md !transition-colors group-hover:!scale-110 !transform !duration-200">
                          <ShoppingCart className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Infinite scroll trigger for mobile */}
                {isMobile && hasMoreProducts && (
                  <div id="load-more-trigger" className="!w-full !h-4 !my-4">
                    {isLoadingMore && (
                      <div className="!flex !justify-center !items-center !py-4">
                        <div className="!flex !items-center !gap-2">
                          <div className="!flex !space-x-2">
                            <div className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="!text-sm !text-muted-foreground">
                            Loading {Math.min(12, totalProducts - displayedProducts)} more products...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Load More button for desktop */}
                {!isMobile && hasMoreProducts && (
                  <div className="!flex !justify-center !mt-8">
                    <button
                      onClick={loadMoreProducts}
                      disabled={isLoadingMore}
                      className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !px-8 !py-3 !rounded-lg !font-medium !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? 'Loading...' : `Load More (${Math.min(12, totalProducts - displayedProducts)} more)`}
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !isPending && !showRecommendations && sortedProducts.length === 0 && (
              <div className="!text-center !py-[48px] !w-full">
                <p className="!text-muted-foreground text-[16px] lg:text-[18px]">
                  No products found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KalifindSearch;
