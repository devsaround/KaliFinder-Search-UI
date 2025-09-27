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
import { addToCart, handleCartError } from "@/utils/cart";
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
import Recommendations from "./Recommendations";

const KalifindSearch: React.FC<{
  storeUrl?: string;
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
  storeUrl = "https://findifly.kinsta.cloud",
  // storeUrl = "https://findifly-dev.myshopify.com",
}) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
    useState(-1);
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

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationsFetched, setRecommendationsFetched] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([
    "shirt",
    "underwear",
    "plan",
  ]);
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
  
  // Color mapping state
  const [colorMappings, setColorMappings] = useState<{ [key: string]: string }>({});

  // Function to convert color names to hex values (same as in dashboard)
  const convertColorNameToHex = (colorName: string): string => {
    try {
      // Common color name mappings
      const colorMap: { [key: string]: string } = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#008000',
        'yellow': '#FFFF00',
        'orange': '#FFA500',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'brown': '#A52A2A',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'grey': '#808080',
        'cyan': '#00FFFF',
        'magenta': '#FF00FF',
        'lime': '#00FF00',
        'navy': '#000080',
        'maroon': '#800000',
        'olive': '#808000',
        'teal': '#008080',
        'silver': '#C0C0C0',
        'gold': '#FFD700',
        'violet': '#8A2BE2',
        'indigo': '#4B0082',
        'coral': '#FF7F50',
        'salmon': '#FA8072',
        'turquoise': '#40E0D0',
        'beige': '#F5F5DC',
        'ivory': '#FFFFF0',
        'khaki': '#F0E68C',
        'lavender': '#E6E6FA',
        'plum': '#DDA0DD',
        'tan': '#D2B48C',
        'wheat': '#F5DEB3',
        'azure': '#F0FFFF',
        'bisque': '#FFE4C4',
        'chocolate': '#D2691E',
        'crimson': '#DC143C',
        'darkblue': '#00008B',
        'darkgreen': '#006400',
        'darkred': '#8B0000',
        'lightblue': '#ADD8E6',
        'lightgreen': '#90EE90',
        'lightpink': '#FFB6C1',
        'lightyellow': '#FFFFE0',
        'mediumblue': '#0000CD',
        'mediumgreen': '#32CD32',
        'mediumred': '#CD5C5C',
        'darkgray': '#A9A9A9',
        'lightgray': '#D3D3D3',
        'darkgrey': '#A9A9A9',
        'lightgrey': '#D3D3D3',
      };

      const normalizedName = colorName.toLowerCase().trim();
      
      // Check if it's a known color name
      if (colorMap[normalizedName]) {
        return colorMap[normalizedName];
      }

      // If not found, return a default color
      return '#808080'; // Default gray
    } catch (error) {
      console.warn(`Could not convert color name "${colorName}" to hex:`, error);
      return '#808080'; // Default gray if conversion fails
    }
  };
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
  const [saleCount, setSaleCount] = useState(0);
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
    featuredProducts: false,
    saleStatus: false,
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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

  // Fuzzy matching function for better autocomplete
  const fuzzyMatch = useCallback(
    (query: string, suggestion: string): boolean => {
      if (!query || !suggestion) return false;

      const queryLower = query.toLowerCase().trim();
      const suggestionLower = suggestion.toLowerCase().trim();

      // Exact match
      if (suggestionLower.includes(queryLower)) return true;

      // Fuzzy matching - check if all characters in query appear in order in suggestion
      let queryIndex = 0;
      for (
        let i = 0;
        i < suggestionLower.length && queryIndex < queryLower.length;
        i++
      ) {
        if (suggestionLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }

      // If we found all characters in order, it's a match
      return queryIndex === queryLower.length;
    },
    [],
  );

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
    [fuzzyMatch],
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
    filters.featuredProducts ||
    filters.saleStatus;

  // Show filters if user has searched or filters are active
  const shouldShowFilters = showFilters || isAnyFilterActive;

  // Fetch popular searches
  const fetchPopularSearches = useCallback(async () => {
    if (!storeUrl) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/search/popular?storeUrl=${storeUrl}`,
        {},
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
  }, [storeUrl]);

  // Fetch vendor facet configuration
  const fetchFacetConfiguration = useCallback(async () => {
    if (!storeUrl) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/facets?storeUrl=${storeUrl}`,
        {},
      );

      if (!response.ok) {
        throw new Error("Failed to fetch facet configuration");
      }

      const result = await response.json();
      console.log("Fetched facet configuration:", result);

      // Update optional filters visibility based on vendor configuration
      const showTags = result.some(
        (facet: { field: string; visible: boolean }) =>
          facet.field === "tags" && facet.visible,
      );
      console.log("Tags facet visible:", showTags);

      setShowOptionalFilters({
        brands: result.some(
          (facet: { field: string; visible: boolean }) =>
            facet.field === "brand" && facet.visible,
        ),
        colors: result.some(
          (facet: { field: string; visible: boolean }) =>
            facet.field === "color" && facet.visible,
        ),
        tags: showTags,
      });
    } catch (error) {
      console.error("Failed to fetch facet configuration:", error);
      // Keep default values (all false)
    }
  }, [storeUrl]);

  // Fetch color mappings
  const fetchColorMappings = useCallback(async () => {
    if (!storeUrl) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/color-mappings/search?storeUrl=${storeUrl}`,
        {},
      );

      if (!response.ok) {
        throw new Error("Failed to fetch color mappings");
      }

      const result = await response.json();
      setColorMappings(result);
    } catch (error) {
      console.error("Failed to fetch color mappings:", error);
      // Keep empty color mappings
    }
  }, [storeUrl]);

  // Fetch vendor-controlled recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!storeUrl || recommendationsFetched) return;
    try {
      // First check if vendor has configured recommendations
      const configResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/recommendations/config?storeUrl=${storeUrl}`,
        {},
      );

      if (!configResponse.ok) {
        // If no config exists, don't show recommendations
        setRecommendations([]);
        return;
      }

      const config = await configResponse.json();

      // Only fetch recommendations if vendor has enabled them
      if (!config.enabled) {
        setRecommendations([]);
        return;
      }

      // Fetch only vendor-configured recommendations
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/v1/search/recommended?storeUrl=${storeUrl}&type=vendor-configured`,
        {},
      );

      if (!response.ok) {
        // If vendor-configured recommendations fail, don't show any
        setRecommendations([]);
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
      setRecommendationsFetched(true);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
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
  }, [searchQuery, storeUrl, setHasSearched]);

  useEffect(() => {
    fetchRecommendations();
    fetchPopularSearches();
    fetchFacetConfiguration();
    fetchColorMappings();
  }, [fetchRecommendations, fetchPopularSearches, fetchFacetConfiguration, fetchColorMappings]);

  useEffect(() => {
    const initFilters = async () => {
      if (!storeUrl) return;

      const fetchWithRetry = async (retries = 3) => {
        try {
          // First, get facet configuration to know the terms limits
          let facetConfig: any[] = [];
          try {
            const facetResponse = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/v1/facets?storeUrl=${storeUrl}`,
              {},
            );
            if (facetResponse.ok) {
              facetConfig = await facetResponse.json();
            }
          } catch (error) {
            console.error("Failed to fetch facet configuration:", error);
          }

          // Then, get initial data with facet aggregations
          const params = new URLSearchParams();
          params.append("storeUrl", storeUrl);
          params.append("limit", "1000"); // Add high limit to fetch all products for filter counts

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
          let facets: any = {};
          if (Array.isArray(result)) {
            products = result;
          } else if (result && Array.isArray(result.products)) {
            products = result.products;
            facets = result.facets || {};
          } else {
            console.error(
              "Kalifind Search: Unexpected API response format:",
              result,
            );
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

            // Use facet aggregations if available, otherwise fall back to product analysis
            if (facets && Object.keys(facets).length > 0) {
              console.log("Using facet aggregations for filter data:", facets);
              console.log("Available facet keys:", Object.keys(facets));
              
              // Process category facets
              if (facets.category && facets.category.buckets) {
                const categories: string[] = [];
                const categoryCounts: { [key: string]: number } = {};
                facets.category.buckets.forEach((bucket: any) => {
                  categories.push(bucket.key);
                  categoryCounts[bucket.key] = bucket.doc_count;
                });
                setAvailableCategories(categories);
                setCategoryCounts(categoryCounts);
              }

              // Process brand facets
              if (facets.brand && facets.brand.buckets) {
                const brands: string[] = [];
                const brandCounts: { [key: string]: number } = {};
                facets.brand.buckets.forEach((bucket: any) => {
                  brands.push(bucket.key);
                  brandCounts[bucket.key] = bucket.doc_count;
                });
                setAvailableBrands(brands);
                setBrandCounts(brandCounts);
              }

              // Process color facets
              if (facets.color && facets.color.buckets) {
                const colors: string[] = [];
                const colorCounts: { [key: string]: number } = {};
                facets.color.buckets.forEach((bucket: any) => {
                  colors.push(bucket.key);
                  colorCounts[bucket.key] = bucket.doc_count;
                });
                setAvailableColors(colors);
                setColorCounts(colorCounts);
              }

              // Process size facets
              if (facets.size && facets.size.buckets) {
                const sizes: string[] = [];
                const sizeCounts: { [key: string]: number } = {};
                facets.size.buckets.forEach((bucket: any) => {
                  sizes.push(bucket.key);
                  sizeCounts[bucket.key] = bucket.doc_count;
                });
                setAvailableSizes(sizes);
                setSizeCounts(sizeCounts);
              }

              // Process tags facets
              if (facets.tags && facets.tags.buckets) {
                console.log("Processing tags facets:", facets.tags);
                const tags: string[] = [];
                const tagCounts: { [key: string]: number } = {};
                facets.tags.buckets.forEach((bucket: any) => {
                  tags.push(bucket.key);
                  tagCounts[bucket.key] = bucket.doc_count;
                });
                console.log("Setting available tags:", tags);
                setAvailableTags(tags);
                setTagCounts(tagCounts);
              } else {
                console.log("No tags facets found in aggregations");
              }

              // Debug: Check if expected facets are missing
              if (!facets.instock) {
                console.log("Missing instock facet - available facets:", Object.keys(facets));
              }
              if (!facets.featured) {
                console.log("Missing featured facet - available facets:", Object.keys(facets));
              }
              if (!facets.insale) {
                console.log("Missing insale facet - available facets:", Object.keys(facets));
              }

              // Process stock status facets
              if (facets.instock && facets.instock.buckets) {
                console.log("Processing stock status facets:", facets.instock);
                console.log("Stock status buckets:", facets.instock.buckets);
                const stockStatusCounts: { [key: string]: number } = {};
                facets.instock.buckets.forEach((bucket: any) => {
                  console.log("Stock status bucket:", bucket);
                  // Map backend values to frontend display values
                  let displayKey = bucket.key;
                  if (bucket.key === 'instock') displayKey = 'In Stock';
                  else if (bucket.key === 'outofstock') displayKey = 'Out of Stock';
                  else if (bucket.key === 'onbackorder') displayKey = 'On Backorder';
                  
                  stockStatusCounts[displayKey] = bucket.doc_count;
                  console.log(`Mapped ${bucket.key} -> ${displayKey}: ${bucket.doc_count}`);
                });
                setStockStatusCounts(stockStatusCounts);
                console.log("Final stock status counts:", stockStatusCounts);
              }

              // Process featured facets
              if (facets.featured && facets.featured.buckets) {
                console.log("Processing featured facets:", facets.featured);
                console.log("Featured buckets:", facets.featured.buckets);
                let featuredCount = 0;
                facets.featured.buckets.forEach((bucket: any) => {
                  console.log("Featured bucket:", bucket);
                  if (bucket.key === true || bucket.key === 'true' || bucket.key === 1 || bucket.key_as_string === 'true') {
                    featuredCount = bucket.doc_count;
                    console.log(`Featured count: ${featuredCount}`);
                  }
                });
                setFeaturedCount(featuredCount);
                console.log("Final featured count:", featuredCount);
              }

              // Process sale facets
              if (facets.insale && facets.insale.buckets) {
                console.log("Processing sale facets:", facets.insale);
                console.log("Sale buckets:", facets.insale.buckets);
                let saleCount = 0;
                facets.insale.buckets.forEach((bucket: any) => {
                  console.log("Sale bucket:", bucket);
                  if (bucket.key === true || bucket.key === 'true' || bucket.key === 1 || bucket.key_as_string === 'true') {
                    saleCount = bucket.doc_count;
                    console.log(`Sale count: ${saleCount}`);
                  }
                });
                setSaleCount(saleCount);
                console.log("Final sale count:", saleCount);
              }
            } else {
              // Fallback to product analysis if no facet aggregations
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
              let saleCount = 0;

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
                }
                
                // Count sale products
                if (product.salePrice && 
                    product.salePrice !== "" && 
                    product.salePrice !== "0" && 
                    product.salePrice !== "0.00" && 
                    product.regularPrice && 
                    product.salePrice !== product.regularPrice) {
                  saleCount++;
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
              setSaleCount(saleCount);
            }
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

    // Only show autocomplete when user is typing and has a meaningful query
    if (searchQuery.length > 0 && debouncedSearchQuery.trim()) {
      setShowAutocomplete(true);
      startTransition(() => {
        setIsAutocompleteLoading(true);
        (async () => {
          try {
            const params = new URLSearchParams();
            params.append("q", debouncedSearchQuery.trim());
            params.append("storeUrl", storeUrl);

            const url = `${import.meta.env.VITE_BACKEND_URL}/v1/autocomplete?${params.toString()}`;
            console.log("Autocomplete API call:", url);

            const response = await fetch(url, {});

            if (!response.ok) {
              console.error(
                "Autocomplete API error:",
                response.status,
                response.statusText,
              );
              throw new Error("bad response");
            }

            const result = await response.json();
            console.log("Autocomplete API result:", result);

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
                    return (
                      r.title ||
                      r.name ||
                      r.product_title ||
                      r.product_name ||
                      String(r)
                    );
                  },
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
                    return (
                      r.title ||
                      r.name ||
                      r.product_title ||
                      r.product_name ||
                      String(r)
                    );
                  },
                )
                .filter(Boolean);
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

            console.log("Raw suggestions:", rawSuggestions);
            console.log("Filtered and scored suggestions:", scoredSuggestions);

            setAutocompleteSuggestions(scoredSuggestions);
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
      // Clear suggestions when search query is empty
      setShowAutocomplete(false);
      setAutocompleteSuggestions([]);
      setIsAutocompleteLoading(false);
    }
  }, [debouncedSearchQuery, storeUrl, searchQuery, scoreSuggestion]);

  // Extract search logic into a reusable function
  const performSearch = useCallback(
    async (query: string) => {
      if (!storeUrl) return;

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
            if (query) {
              params.append("q", query);

              // Add popular search boosting
              const lowerQuery = query.toLowerCase();
              const matchingPopularTerms = popularSearches.filter((term) =>
                lowerQuery.includes(term.toLowerCase()),
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
            let facets: any = {};

            if (result && Array.isArray(result.products)) {
              products = result.products;
              total = result.total || 0;
              hasMore = result.hasMore || false;
              facets = result.facets || {};

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

            // Note: We don't update filter data from search results to keep filters static
            // Filter data is loaded once during initialization and should remain consistent
            // regardless of search query to provide a stable filtering experience

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
    },
    [storeUrl, debouncedPriceRange, popularSearches, filters],
  );


  // search products
  useEffect(() => {
    console.log("Search effect triggered:", {
      isPriceLoading,
      storeUrl,
      showRecommendations,
      isInitialState,
      debouncedSearchQuery,
      searchQuery,
      isSearchingFromSuggestion,
    });

    // Skip search if we're in initial state showing recommendations
    if (isPriceLoading || !storeUrl || showRecommendations || isInitialState) {
      console.log("Search effect skipped due to conditions");
      return; // Wait for the initial price to be loaded or skip if showing recommendations or in initial state
    }

    // Skip search if we're searching from a suggestion click (already handled)
    if (isSearchingFromSuggestion) {
      console.log("Search effect skipped - already searching from suggestion");
      setIsSearchingFromSuggestion(false);
      return;
    }

    // Fetch all products when search query is empty, or perform search with query
    if (!debouncedSearchQuery.trim()) {
      console.log("Search effect - fetching all products (empty query)");
      performSearch(""); // Pass empty string to fetch all products
    } else {
      console.log("Search effect - performing search with query");
      performSearch(debouncedSearchQuery);
    }
  }, [
    isPriceLoading,
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
    performSearch,
    isSearchingFromSuggestion,
    forceSearch,
  ]);

  const sortedProducts = useMemo(() => {
    // Ensure filteredProducts is an array before processing
    if (!Array.isArray(filteredProducts)) {
      console.warn(
        "Kalifind Search: filteredProducts is not an array:",
        filteredProducts,
      );
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
    setShowRecommendations(false);

    // Always show autocomplete when user starts typing (even for single characters)
    if (query.length > 0) {
      setShowAutocomplete(true);
      setIsInteractingWithDropdown(false);
    } else {
      // Hide autocomplete when input is cleared
      setShowAutocomplete(false);
      setAutocompleteSuggestions([]);
      setHighlightedSuggestionIndex(-1);
      setIsInteractingWithDropdown(false);
    }

    // Note: Recent searches are now only added on Enter key press or suggestion click
    // This prevents adding to recent searches just by typing
  };

  // Helper function to add to recent searches
  const addToRecentSearches = (query: string) => {
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
    addToRecentSearches(term); // Add to recent searches when clicking popular search
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Clicking a suggestion:
    // - Sets the clicked value into the search input
    // - The search useEffect will automatically trigger a search for that value
    // - Saves the clicked value into recent searches via Zustand and updates localStorage
    console.log("Suggestion clicked:", suggestion);

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

    // Set the search query and perform search directly
    setSearchQuery(suggestion);
    performSearch(suggestion);

    // Blur input to close any mobile keyboards
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const query = event.currentTarget.value;

      // If there's a highlighted suggestion, use that instead
      if (
        highlightedSuggestionIndex >= 0 &&
        autocompleteSuggestions[highlightedSuggestionIndex]
      ) {
        const selectedSuggestion =
          autocompleteSuggestions[highlightedSuggestionIndex];
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
      setForceSearch(prev => prev + 1);

      inputRef.current?.blur();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (showAutocomplete && autocompleteSuggestions.length > 0) {
        setHighlightedSuggestionIndex((prev) =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
        );
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (showAutocomplete && autocompleteSuggestions.length > 0) {
        setHighlightedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
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
        {},
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
        if (entries[0].isIntersecting && hasMoreProducts && !isLoadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 },
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
  const calculateDiscountPercentage = (
    regularPrice: string,
    salePrice: string,
  ): number | null => {
    try {
      const regular = parseFloat(
        regularPrice.replace(/[^\d.,]/g, "").replace(",", "."),
      );
      const sale = parseFloat(
        salePrice.replace(/[^\d.,]/g, "").replace(",", "."),
      );

      if (
        isNaN(regular) ||
        isNaN(sale) ||
        regular <= 0 ||
        sale <= 0 ||
        sale >= regular
      ) {
        return null;
      }

      const discount = ((regular - sale) / regular) * 100;
      return Math.round(discount);
    } catch (error) {
      return null;
    }
  };

  // Product click handler
  const handleProductClick = (product: Product) => {
    // Close autocomplete dropdown when product is clicked
    setShowAutocomplete(false);
    setAutocompleteSuggestions([]);
    setHighlightedSuggestionIndex(-1);
    
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
      setCartMessage(result.message || "Added to cart!");

      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Add to cart failed:", error);
      handleCartError(error as Error, product);
      setCartMessage("Failed to add to cart. Redirecting to product page...");

      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage(null);
      }, 3000);
    } finally {
      setAddingToCart(null);
    }
  };

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
                      onFocus={() => {
                        console.log("Input focused, searchQuery length:", searchQuery.length);
                        if (searchQuery.length > 0) {
                          setShowAutocomplete(true);
                          setIsInteractingWithDropdown(false);
                        }
                      }}
                      onBlur={(e) => {
                        console.log("Input blurred, relatedTarget:", e.relatedTarget);
                        // Only close autocomplete if the blur is not caused by clicking on a suggestion
                        // or if the input is being cleared
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        const isClickingOnSuggestion = relatedTarget?.closest("[data-suggestion-item]") || 
                                                      relatedTarget?.closest("[data-autocomplete-dropdown]");
                        
                        if (!isClickingOnSuggestion && !isInteractingWithDropdown) {
                          // Small delay to allow for suggestion clicks to process
                          setTimeout(() => {
                            if (!isInteractingWithDropdown) {
                              setShowAutocomplete(false);
                            }
                          }, 100);
                        }
                      }}
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

              {showAutocomplete &&
                searchQuery.length > 0 &&
                (isAutocompleteLoading ||
                  autocompleteSuggestions.length > 0) && (
                  <div 
                    data-autocomplete-dropdown="true"
                    className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-[9999999] !mt-[4px] !w-full"
                    onMouseEnter={() => setIsInteractingWithDropdown(true)}
                    onMouseLeave={() => setIsInteractingWithDropdown(false)}
                  >
                    <div className="[&_*]:!z-[9999999] !p-[16px]">
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
                                  data-suggestion-item="true"
                                  className={`z-[9999999] !flex !items-center !gap-[8px] !cursor-pointer hover:!bg-muted !p-[8px] !rounded ${
                                    index === highlightedSuggestionIndex
                                      ? "!bg-muted"
                                      : ""
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                      "Desktop suggestion clicked:",
                                      suggestion,
                                    );
                                    console.log(
                                      "About to call handleSuggestionClick",
                                    );
                                    // Prevent click outside from interfering
                                    e.nativeEvent.stopImmediatePropagation();
                                    setIsInteractingWithDropdown(false);
                                    handleSuggestionClick(suggestion);
                                    console.log(
                                      "handleSuggestionClick called successfully",
                                    );
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log(
                                      "Desktop suggestion mousedown:",
                                      suggestion,
                                    );
                                    // Prevent click outside from interfering
                                    e.nativeEvent.stopImmediatePropagation();
                                  }}
                                >
                                  <Search className="!w-[16px] !h-[16px] !text-muted-foreground" />
                                  <span className="!text-muted-foreground pointer-events-none">
                                    {suggestion}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="!flex !flex-col !items-center !justify-center !py-6 !text-center !animate-in !fade-in !duration-300">
                          <div className="!w-10 !h-10 !bg-muted !rounded-full !flex !items-center !justify-center !mb-3 !animate-in !zoom-in !duration-500">
                            <Search className="!w-5 !h-5 !text-muted-foreground" />
                          </div>
                          <div className="!animate-in !slide-in-from-bottom-2 !duration-500">
                            <p className="!text-foreground !font-medium !mb-1 !text-sm">Search not found</p>
                            <p className="!text-muted-foreground !text-xs">No suggestions found for "{searchQuery}"</p>
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
        className={`!fixed !bottom-[16px] !left-1/2 !-translate-x-1/2 !z-50 ${shouldShowFilters ? "!block lg:!hidden" : "!hidden"}`}
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
                  (filters.featuredProducts ? 1 : 0) +
                  (filters.saleStatus ? 1 : 0)}
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
                  "featured",
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
                        {availableColors.map((color) => {
                          // Get hex value from color mappings, fallback to auto-converted color
                          const hexValue = colorMappings[color.toLowerCase()] || convertColorNameToHex(color);
                          return (
                            <button
                              key={color}
                              onClick={() => handleColorChange(color)}
                              className={`!w-[32px] !h-[32px] sm:!w-[40px] sm:!h-[40px] !rounded-full !border-4 !transition-all ${
                                filters.colors.includes(color)
                                  ? "!border-primary !scale-110 !shadow-lg"
                                  : "!border-border hover:!border-muted-foreground"
                              }`}
                              style={{
                                backgroundColor: hexValue,
                                transform: filters.colors.includes(color)
                                  ? "scale(1.1)"
                                  : "scale(1)",
                              }}
                              title={color} // Show color name on hover
                            />
                          );
                        })}
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
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Stock Status</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {["In Stock", "Out of Stock", "On Backorder"].map(
                        (status) => (
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
                            <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                              {stockStatusCounts[status] || 0}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="featured">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Featured Products</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      <label className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg">
                        <div className="!flex !items-center !gap-[12px]">
                          <input
                            type="checkbox"
                            checked={filters.featuredProducts}
                            onChange={handleFeaturedProductsChange}
                            className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                          />
                          <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                            Featured Only
                          </span>
                        </div>
                        <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                          {featuredCount}
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
                      <label className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg">
                        <div className="!flex !items-center !gap-[12px]">
                          <input
                            type="checkbox"
                            checked={filters.saleStatus}
                            onChange={handleSaleStatusChange}
                            className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                          />
                          <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                            On Sale Only
                          </span>
                        </div>
                        <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                          {saleCount}
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
        <aside
          className={`w-80 lg:!w-[312px] !p-[16px] !bg-filter-bg ${shouldShowFilters ? "!hidden lg:!block" : "!hidden"}`}
        >
          <Accordion
            type="multiple"
            defaultValue={[
              "category",
              "price",
              "size",
              "stockStatus",
              "featured",
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
                    {availableColors.map((color) => {
                      // Get hex value from color mappings, fallback to auto-converted color
                      const hexValue = colorMappings[color.toLowerCase()] || convertColorNameToHex(color);
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`!w-[24px] !h-[24px] lg:!w-[32px] lg:!h-[32px] !rounded-full !border-2 ${
                            filters.colors.includes(color)
                              ? "!border-primary !scale-110"
                              : "!border-border"
                          }`}
                          style={{
                            backgroundColor: hexValue,
                            transform: filters.colors.includes(color)
                              ? "scale(1.1)"
                              : "scale(1)",
                          }}
                          title={color} // Show color name on hover
                        />
                      );
                    })}
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
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Stock Status</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  {["In Stock", "Out of Stock", "On Backorder"].map(
                    (status) => (
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
                        <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                          {stockStatusCounts[status] || 0}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="featured">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Featured Products</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  <label className="!flex !items-center !justify-between !cursor-pointer">
                    <div className="!flex !items-center !gap-[10px]">
                      <input
                        type="checkbox"
                        checked={filters.featuredProducts}
                        onChange={handleFeaturedProductsChange}
                        className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                      />
                      <span className="!text-foreground text-[14px] lg:text-[16px]">
                        Featured Only
                      </span>
                    </div>
                    <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                      {featuredCount}
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
                  <label className="!flex !items-center !justify-between !cursor-pointer">
                    <div className="!flex !items-center !gap-[10px]">
                      <input
                        type="checkbox"
                        checked={filters.saleStatus}
                        onChange={handleSaleStatusChange}
                        className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                      />
                      <span className="!text-foreground text-[14px] lg:text-[16px]">
                        On Sale Only
                      </span>
                    </div>
                    <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                      {saleCount}
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
              </div>
            )}

            {showRecommendations ? (
              // Show recommendations and popular searches
              <div className="!w-full">
                {/* Popular Searches */}
                <div className="!mb-8">
                  <h3 className="!text-[18px] lg:!text-[20px] !font-bold !text-foreground !mb-[8px] !mt-[8px]">
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
                <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[8px] sm:!gap-[16px] !w-full">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="!bg-background !border !border-border !rounded-lg !p-[8px] sm:!p-[12px] hover:!shadow-lg !transition-shadow !w-full !flex !flex-col group !cursor-pointer"
                    >
                      <div className="!relative !mb-[8px] overflow-hidden">
                        <img
                          src={product.imageUrl || product.image}
                          alt={product.title}
                          className="!w-full !h-[112px] sm:!h-[144px] !object-cover !rounded-md group-hover:!scale-105 !transition-transform !duration-300"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                        {product.featured && (
                          <div className="!absolute !top-2 !right-2 !bg-primary !text-primary-foreground !px-2 !py-1 !rounded-full !text-xs !font-bold">
                            Featured
                          </div>
                        )}
                        {product.salePrice &&
                          product.salePrice !== "" &&
                          product.salePrice !== "0" &&
                          product.salePrice !== "0.00" &&
                          product.regularPrice &&
                          product.salePrice !== product.regularPrice &&
                          (() => {
                            const discountPercentage =
                              calculateDiscountPercentage(
                                product.regularPrice,
                                product.salePrice,
                              );
                            return discountPercentage ? (
                              <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                                -{discountPercentage}%
                              </div>
                            ) : (
                              <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                                Sale
                              </div>
                            );
                          })()}
                      </div>
                      <h3 className="!text-[14px] sm:!text-[16px] !font-bold !text-foreground !mb-[4px] sm:!mb-[8px] h-[40px] sm:h-[48px] overflow-hidden">
                        {product.title}
                      </h3>
                      <div className="!flex !items-center !justify-between mt-auto">
                        <div className="!flex !items-center !gap-[8px]">
                          {product.salePrice &&
                          product.salePrice !== "" &&
                          product.salePrice !== "0" &&
                          product.salePrice !== "0.00" &&
                          product.regularPrice &&
                          product.salePrice !== product.regularPrice ? (
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={addingToCart === product.id}
                          className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-[6px] sm:!p-[8px] !rounded-md !transition-colors group-hover:!scale-110 !transform !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed"
                        >
                          {addingToCart === product.id ? (
                            <div className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px] !border-2 !border-primary-foreground !border-t-transparent !rounded-full !animate-spin"></div>
                          ) : (
                            <ShoppingCart className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px]" />
                          )}
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
                            <div
                              className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="!w-2 !h-2 !bg-primary !rounded-full !animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                          <span className="!text-sm !text-muted-foreground">
                            Loading{" "}
                            {Math.min(12, totalProducts - displayedProducts)}{" "}
                            more products...
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
                      {isLoadingMore
                        ? "Loading..."
                        : `Load More (${Math.min(12, totalProducts - displayedProducts)} more)`}
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading &&
              !isPending &&
              !showRecommendations &&
              sortedProducts.length === 0 && (
                <div className="!text-center !py-[48px] !w-full !animate-in !fade-in !duration-300">
                  <div className="!flex !flex-col !items-center !gap-4">
                    <div className="!w-16 !h-16 !bg-muted !rounded-full !flex !items-center !justify-center !animate-in !zoom-in !duration-500">
                      <Search className="!w-8 !h-8 !text-muted-foreground" />
                    </div>
                    <div className="!animate-in !slide-in-from-bottom-2 !duration-500">
                      <p className="!text-foreground !text-[18px] !lg:text-[20px] !font-semibold !mb-2">
                        Search not found
                      </p>
                      <p className="!text-muted-foreground !text-[14px] !lg:text-[16px]">
                        No products found matching your criteria. Try different keywords or browse our categories.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Cart Message Display */}
            {cartMessage && (
              <div className="!fixed !top-4 !right-4 !z-[999999] !bg-primary !text-primary-foreground !px-4 !py-2 !rounded-lg !shadow-lg !max-w-sm">
                <div className="!flex !items-center !gap-2">
                  <div className="!w-4 !h-4 !border-2 !border-primary-foreground !border-t-transparent !rounded-full !animate-spin"></div>
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
