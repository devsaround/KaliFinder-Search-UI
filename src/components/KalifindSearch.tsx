import { ChevronDown, Filter, Search, X } from '@/components/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { getUBIClient } from '@/analytics/ubiClient';
import { normalizeStoreUrl } from '@/lib/normalize';
import { searchService, type SearchParams } from '@/services/search.service';
import { uiDebugger } from '@/utils/ui-debug';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/use-debounce';
import { useCart } from '@/hooks/useCart';
import { useFilters } from '@/hooks/useFilters';

import type { Product } from '../types';
import { isSearchResponse, type FacetBucket } from '../types/api.types';
import { ProductCard } from './products/ProductCard';
import Recommendations from './Recommendations';
import ScrollToTop from './ScrollToTop';

const CURRENCY_SYMBOL_REGEX = /[\p{Sc}]/u;
const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

type CurrencyInfo = {
  code?: string;
  symbol?: string;
};

function isIsoCurrencyCode(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim().toUpperCase();
  return ISO_CURRENCY_CODE_REGEX.test(trimmed) ? trimmed : undefined;
}

function extractCurrencyInfoFromPriceString(value?: string | null): CurrencyInfo {
  if (!value || typeof value !== 'string') return {};
  const trimmed = value.trim();
  if (!trimmed) return {};

  const symbolMatch = trimmed.match(CURRENCY_SYMBOL_REGEX);
  const codeAtStart = trimmed.match(/^[A-Z]{3}\b/);
  const codeAtEnd = trimmed.match(/\b[A-Z]{3}$/);

  return {
    symbol: symbolMatch ? symbolMatch[0] : undefined,
    code: isIsoCurrencyCode(codeAtStart?.[0] || codeAtEnd?.[0]),
  };
}

function extractCurrencyInfoFromProduct(product: Product): CurrencyInfo {
  const candidateCodes = [
    product.currency,
    (product as unknown as { currencyCode?: string }).currencyCode,
    (product as unknown as { currency_code?: string }).currency_code,
    product.priceCurrency,
    (product as unknown as { price_currency?: string }).price_currency,
  ]
    .map(isIsoCurrencyCode)
    .filter((value): value is string => Boolean(value));

  const candidateSymbols = [
    product.currencySymbol,
    (product as unknown as { currency_symbol?: string }).currency_symbol,
  ].filter((value): value is string => Boolean(value));

  const info: CurrencyInfo = {};
  if (candidateCodes.length > 0) {
    info.code = candidateCodes[0];
  }
  if (candidateSymbols.length > 0) {
    info.symbol = candidateSymbols[0];
  }

  if (!info.code || !info.symbol) {
    const priceStrings = [product.price, product.salePrice, product.regularPrice];
    for (const priceString of priceStrings) {
      const extracted = extractCurrencyInfoFromPriceString(priceString);
      if (extracted.code && !info.code) {
        info.code = extracted.code;
      }
      if (extracted.symbol && !info.symbol) {
        info.symbol = extracted.symbol;
      }
      if (info.code && info.symbol) {
        break;
      }
    }
  }

  return info;
}

function parsePriceToNumber(value?: string | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  const sanitized = trimmed.replace(/[^0-9.,-]/g, '');
  if (!sanitized) return undefined;

  const commaCount = (sanitized.match(/,/g) || []).length;
  const dotCount = (sanitized.match(/\./g) || []).length;
  let normalized = sanitized;

  if (commaCount > 0 && dotCount === 0) {
    normalized = sanitized.replace(/,/g, '.');
  } else if (commaCount > 0 && dotCount > 0) {
    if (sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')) {
      normalized = sanitized.replace(/\./g, '').replace(/,/g, '.');
    } else {
      normalized = sanitized.replace(/,/g, '');
    }
  } else {
    normalized = sanitized.replace(/,/g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const extractFacetBuckets = (facet: unknown): FacetBucket[] => {
  if (!facet || typeof facet !== 'object') {
    return [];
  }

  // Handle disjunctive faceting structure: facet.values.buckets
  // Backend wraps each facet in a filter aggregation with nested "values"
  let actualFacet = facet;
  const maybeValues = (facet as { values?: unknown }).values;
  if (maybeValues && typeof maybeValues === 'object') {
    actualFacet = maybeValues;
    // Disjunctive faceting detected - this means reactive facets are working!
  }

  const maybeBuckets = (actualFacet as { buckets?: unknown }).buckets;
  if (!Array.isArray(maybeBuckets)) {
    return [];
  }

  const buckets: FacetBucket[] = [];

  maybeBuckets.forEach((bucket) => {
    if (!bucket || typeof bucket !== 'object') {
      return;
    }

    const typed = bucket as Partial<FacetBucket> & { doc_count?: unknown };
    const rawDocCount = typed.doc_count ?? (bucket as { doc_count?: unknown }).doc_count ?? 0;
    const docCount = typeof rawDocCount === 'number' ? rawDocCount : Number(rawDocCount);

    buckets.push({
      key:
        typed.key !== undefined ? typed.key : ((typed.key_as_string ?? '') as FacetBucket['key']),
      key_as_string: typed.key_as_string,
      doc_count: Number.isFinite(docCount) ? docCount : 0,
      from: typed.from,
      to: typed.to,
    });
  });

  return buckets;
};

const getFacetBucketKey = (bucket: FacetBucket): string => {
  if (typeof bucket.key === 'string') {
    return bucket.key;
  }
  if (typeof bucket.key === 'number' || typeof bucket.key === 'boolean') {
    if (bucket.key_as_string) {
      return bucket.key_as_string;
    }
    return String(bucket.key);
  }
  return bucket.key_as_string ?? '';
};

const resolveBooleanFacetValue = (bucket: FacetBucket): boolean | null => {
  if (typeof bucket.key === 'boolean') {
    return bucket.key;
  }

  if (typeof bucket.key === 'number') {
    if (bucket.key === 1) return true;
    if (bucket.key === 0) return false;
  }

  if (typeof bucket.key === 'string') {
    const normalized = bucket.key.toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
  }

  if (bucket.key_as_string) {
    const normalized = bucket.key_as_string.toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
  }

  return null;
};

// Category tree structure
interface CategoryNode {
  name: string;
  fullPath: string;
  count: number;
  children: Map<string, CategoryNode>;
  level: number;
}

// Build category tree from flat paths
const buildCategoryTree = (
  categories: string[],
  categoryCounts: { [key: string]: number }
): CategoryNode => {
  const root: CategoryNode = {
    name: '',
    fullPath: '',
    count: 0,
    children: new Map(),
    level: -1,
  };

  categories.forEach((categoryPath) => {
    const parts = categoryPath.split('>').map((p) => p.trim());
    let currentNode = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath} > ${part}` : part;

      if (!currentNode.children.has(part)) {
        currentNode.children.set(part, {
          name: part,
          fullPath: currentPath,
          count: categoryCounts[currentPath] || 0,
          children: new Map(),
          level: index,
        });
      }

      currentNode = currentNode.children.get(part)!;
    });
  });

  return root;
};

// Recursive component to render category tree nodes
const CategoryTreeNode: React.FC<{
  node: CategoryNode;
  selectedCategories: string[];
  expandedCategories: Set<string>;
  onToggle: (fullPath: string) => void;
  onExpand: (name: string) => void;
  level: number;
  getFacetCount?: (facetType: 'category', key: string) => number;
}> = ({
  node,
  selectedCategories,
  expandedCategories,
  onToggle,
  onExpand,
  level,
  getFacetCount,
}) => {
  const hasChildren = node.children.size > 0;
  const isExpanded = expandedCategories.has(node.name);
  const isSelected = selectedCategories.includes(node.fullPath);

  return (
    <div>
      <label
        className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
          isSelected ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset' : 'hover:bg-gray-50'
        }`}
        style={{ paddingLeft: hasChildren || level > 0 ? `${level * 1 + 0.5}rem` : undefined }}
      >
        <div className="flex flex-1 items-center gap-2">
          {hasChildren && (
            <button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                onExpand(node.name);
              }}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name} category`}
              aria-expanded={isExpanded ? 'true' : 'false'}
              className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded p-1.5 transition-colors hover:bg-gray-200"
            >
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform ${
                  isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
                aria-hidden="true"
              />
            </button>
          )}

          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(node.fullPath)}
                aria-label={`Filter by ${node.name} category`}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <svg
                className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span
              className={`text-sm font-medium select-none ${
                isSelected ? 'text-purple-900' : 'text-gray-900'
              }`}
            >
              {node.name
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}
            </span>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isSelected ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {getFacetCount ? getFacetCount('category', node.fullPath) : node.count}
        </span>
      </label>

      {hasChildren && isExpanded && (
        <div>
          {Array.from(node.children.values()).map((childNode) => (
            <CategoryTreeNode
              key={childNode.fullPath}
              node={childNode}
              selectedCategories={selectedCategories}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onExpand={onExpand}
              level={level + 1}
              getFacetCount={getFacetCount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const KalifindSearch: React.FC<{
  storeUrl?: string | undefined;
  onClose?: () => void;
  searchQuery?: string;
  setSearchQuery: (query: string) => void;
  hasSearched: boolean;
  setHasSearched: (hasSearched: boolean) => void;
  hideHeader?: boolean;
}> = ({
  searchQuery,
  setSearchQuery,
  hasSearched,
  setHasSearched,
  hideHeader = false,
  storeUrl, // Now required to be passed by parent - no hardcoded default
  onClose,
}) => {
  const [storeType, setStoreType] = useState<'shopify' | 'woocommerce' | null>(null);
  const [storeCurrencyCode, setStoreCurrencyCode] = useState<string | undefined>();
  const [storeCurrencySymbol, setStoreCurrencySymbol] = useState<string | undefined>();

  // Log component mount
  useEffect(() => {
    console.log('🎨 KalifindSearch component mounted');
    console.log('📦 Store URL:', storeUrl);
    console.log('🔍 Initial search query:', searchQuery);
    console.log('📊 Has searched:', hasSearched);

    // Log UI measurements after a short delay to ensure rendering
    setTimeout(() => {
      const widgetRoot = document.querySelector('.kalifinder-widget-root') as HTMLElement;
      if (widgetRoot) {
        uiDebugger.logWidgetMount(widgetRoot);
      }

      const sidebar = document.querySelector('aside') as HTMLElement;
      if (sidebar) {
        uiDebugger.logFilterSidebar(sidebar);
      }

      const productCard = document.querySelector('[class*="ProductCard"]') as HTMLElement;
      if (productCard) {
        uiDebugger.logProductCard(productCard);
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine if this is a Shopify store
  const isShopifyStore =
    storeType === 'shopify' || storeUrl?.includes('myshopify.com') || storeUrl?.includes('shopify');

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true); // Toggle for autocomplete suggestions
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
  const [isInitialState, setIsInitialState] = useState(true);
  const [searchMessage, setSearchMessage] = useState<string | undefined>(undefined);
  const [isShowingRecommended, setIsShowingRecommended] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000); // Default max price (global)
  const [filteredMaxPrice, setFilteredMaxPrice] = useState<number>(10000); // Max price from filtered results
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial data loading

  // Helper function to get sort option label
  const getSortLabel = (option: string) => {
    switch (option) {
      case 'a-z':
        return 'Name: A-Z';
      case 'z-a':
        return 'Name: Z-A';
      case 'price-asc':
        return 'Price: Low to High';
      case 'price-desc':
        return 'Price: High to Low';
      default:
        return 'Relevance';
    }
  }; // State for optional filters - show all during loading, then update based on vendor config
  const [showOptionalFilters, setShowOptionalFilters] = useState({
    brands: false, // Hide by default for optional filters, shown only if configured
    colors: false,
    sizes: false,
    tags: false,
  });

  // State for mandatory filters - show all during loading, then update based on vendor config
  const [showMandatoryFilters, setShowMandatoryFilters] = useState({
    categories: true, // Show by default, will be updated based on vendor config
    price: true,
    stockStatus: true,
    featured: true,
    sale: true,
  });

  // Use custom hooks for filters and cart
  const {
    filters,
    updateFilter,
    toggleFilterItem,
    clearFilters,
    isAnyFilterActive: isFilterActive,
    resetPriceRange,
  } = useFilters({
    initialMaxPrice: maxPrice,
  });

  const { addingToCart, cartMessage, addToCart: addToCartHandler } = useCart();

  // Helper function to get the appropriate facet count
  // Always uses backend facet counts from search API
  // The backend provides reactive facet counts with disjunctive faceting
  const getFacetCount = useCallback(
    (
      facetType:
        | 'category'
        | 'brand'
        | 'stockStatus'
        | 'tag'
        | 'featured'
        | 'notFeatured'
        | 'sale'
        | 'notSale',
      key?: string
    ) => {
      // Always use backend facet counts from search API
      // The backend provides reactive facet counts with disjunctive faceting
      // This ensures counts update correctly when filters are applied
      if (facetType === 'category' && key) return categoryCounts[key] || 0;
      if (facetType === 'brand' && key) return brandCounts[key] || 0;
      if (facetType === 'stockStatus' && key) return stockStatusCounts[key] || 0;
      if (facetType === 'tag' && key) return tagCounts[key] || 0;
      if (facetType === 'featured') return featuredCount;
      if (facetType === 'notFeatured') return notFeaturedCount;
      if (facetType === 'sale') return saleCount;
      if (facetType === 'notSale') return notSaleCount;
      return 0;
    },
    [
      categoryCounts,
      brandCounts,
      stockStatusCounts,
      tagCounts,
      featuredCount,
      notFeaturedCount,
      saleCount,
      notSaleCount,
    ]
  );
  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Update the filters hook when maxPrice changes
  useEffect(() => {
    resetPriceRange(maxPrice);
  }, [maxPrice, resetPriceRange]);

  // Reset price range when filtered max price changes (reactive facets)
  useEffect(() => {
    // Check if we have active non-price filters
    const hasActiveNonPriceFilters =
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.colors.length > 0 ||
      filters.sizes.length > 0 ||
      filters.tags.length > 0 ||
      filters.stockStatus.length > 0 ||
      filters.featuredProducts.length > 0 ||
      filters.saleStatus.length > 0;

    // Only update if filters are active
    if (hasActiveNonPriceFilters) {
      // Always reset to full filtered range when filteredMaxPrice changes
      updateFilter('priceRange', [0, filteredMaxPrice]);
      console.log('🔧 Price range reset to filtered range: 0 -', filteredMaxPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMaxPrice]); // Only trigger when filteredMaxPrice changes // Load recent searches from localStorage on mount
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
  const debouncedPriceRange = useDebounce<[number, number]>(filters.priceRange, 500);
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
  const mainContentRef = useRef<HTMLDivElement>(null); // For ScrollToTop container

  // Check if any filter is active (including search query)
  const isAnyFilterActive = isFilterActive(debouncedSearchQuery || '', maxPrice);

  // Show filters ALWAYS (even on initial state) for better UX
  // Users can see available filters immediately
  const shouldShowFilters = true; // Fetch vendor facet configuration
  const fetchFacetConfiguration = useCallback(async () => {
    if (!storeUrl) return;

    try {
      const result = await searchService.getFacetConfiguration(storeUrl);
      console.log('🔧 Fetched facet configuration:', result);

      // If no configuration is returned, keep all filters visible (default true)
      // Only hide filters that are explicitly set to visible: false in the config
      if (result && result.length > 0) {
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
            (facet: { field: string; visible: boolean }) =>
              facet.field === 'instock' && facet.visible
          ),
          featured: result.some(
            (facet: { field: string; visible: boolean }) =>
              facet.field === 'featured' && facet.visible
          ),
          sale: result.some(
            (facet: { field: string; visible: boolean }) =>
              facet.field === 'insale' && facet.visible
          ),
        };
        setShowMandatoryFilters(mandatoryFilters);
        console.log('🎛️ Mandatory filters visibility:', mandatoryFilters);
      } else {
        // No config returned - keep all filters visible (use defaults)
        console.log('🎛️ No facet configuration found, keeping all filters visible');
      }
    } catch (error) {
      console.error('Failed to fetch facet configuration:', error);
      // On error, keep all filters visible (don't change from default true)
      console.log('🎛️ Error fetching facet config, keeping all filters visible');
    }
  }, [storeUrl]);

  const updateCurrencyFromProducts = useCallback((products: Product[]) => {
    if (!products || products.length === 0) return;

    for (const product of products) {
      const info = extractCurrencyInfoFromProduct(product);
      if (!info.code && !info.symbol) {
        continue;
      }
      if (info.code) {
        setStoreCurrencyCode((previous) => (previous === info.code ? previous : info.code));
      }
      if (info.symbol) {
        setStoreCurrencySymbol((previous) => (previous === info.symbol ? previous : info.symbol));
      }
      break;
    }
  }, []);

  // Fetch global facets once on mount (static counts that don't change with search query)
  const fetchGlobalFacets = useCallback(async () => {
    if (!storeUrl || globalFacetsFetched) return;

    try {
      // Use the search service to fetch facets with minimal product data
      const result = await searchService.searchProducts({
        q: '',
        storeUrl,
        page: 1,
        limit: 1, // Minimal products, we mainly need facets
      });

      setGlobalFacetsFetched(true);

      // Process facet data from API response
      if (result && result.facets) {
        const facets = result.facets as Record<string, unknown>;

        const stockBuckets = extractFacetBuckets(facets.instock);
        if (stockBuckets.length > 0) {
          const stockStatusCounts: { [key: string]: number } = {};
          stockBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            const normalized = key.toLowerCase();
            const displayName =
              normalized === 'instock'
                ? 'In Stock'
                : normalized === 'outofstock'
                  ? 'Out of Stock'
                  : normalized === 'onbackorder'
                    ? 'On Backorder'
                    : key;
            stockStatusCounts[displayName] = bucket.doc_count;
          });
          setStockStatusCounts(stockStatusCounts);
        }

        const featuredBuckets = extractFacetBuckets(facets.featured);
        if (featuredBuckets.length > 0) {
          let featuredCountLocal = 0;
          let notFeaturedCountLocal = 0;
          featuredBuckets.forEach((bucket) => {
            const value = resolveBooleanFacetValue(bucket);
            if (value === true) {
              featuredCountLocal = bucket.doc_count;
            } else if (value === false) {
              notFeaturedCountLocal = bucket.doc_count;
            }
          });
          setFeaturedCount(featuredCountLocal);
          setNotFeaturedCount(notFeaturedCountLocal);
        }

        const saleBuckets = extractFacetBuckets(facets.insale);
        if (saleBuckets.length > 0) {
          let saleCountLocal = 0;
          let notSaleCountLocal = 0;
          saleBuckets.forEach((bucket) => {
            const value = resolveBooleanFacetValue(bucket);
            if (value === true) {
              saleCountLocal = bucket.doc_count;
            } else if (value === false) {
              notSaleCountLocal = bucket.doc_count;
            }
          });
          setSaleCount(saleCountLocal);
          setNotSaleCount(notSaleCountLocal);
        }

        const categoryBuckets = extractFacetBuckets(facets.category);
        if (categoryBuckets.length > 0) {
          const categoryCounts: { [key: string]: number } = {};
          categoryBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            if (!key) return;
            categoryCounts[key] = bucket.doc_count;
          });
          setCategoryCounts(categoryCounts);
          setAvailableCategories(Object.keys(categoryCounts));
        }

        const brandBuckets = extractFacetBuckets(facets.brand);
        if (brandBuckets.length > 0) {
          const brandCounts: { [key: string]: number } = {};
          brandBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            if (!key) return;
            brandCounts[key] = bucket.doc_count;
          });
          setBrandCounts(brandCounts);
          setAvailableBrands(Object.keys(brandCounts));
        }

        const colorBuckets = extractFacetBuckets(facets.color);
        if (colorBuckets.length > 0) {
          const colors: string[] = [];
          colorBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            if (!key) return;
            colors.push(key);
          });
          setAvailableColors(colors);
        }

        const sizeBuckets = extractFacetBuckets(facets.size);
        if (sizeBuckets.length > 0) {
          const sizes: string[] = [];
          sizeBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            if (!key) return;
            sizes.push(key);
          });
          setAvailableSizes(sizes);
        }

        const tagBuckets = extractFacetBuckets(facets.tag);
        if (tagBuckets.length > 0) {
          const tagCounts: { [key: string]: number } = {};
          tagBuckets.forEach((bucket) => {
            const key = getFacetBucketKey(bucket);
            if (!key) return;
            tagCounts[key] = bucket.doc_count;
          });
          setTagCounts(tagCounts);
          setAvailableTags(Object.keys(tagCounts));
        }
      }

      // Note: We no longer track global total separately
      // totalProducts will reflect the current filtered count

      // Extract max price from products in global facets
      if (result.products && Array.isArray(result.products) && result.products.length > 0) {
        updateCurrencyFromProducts(result.products as Product[]);
        const prices = result.products
          .map(
            (p: Product) =>
              parsePriceToNumber(p.price) ??
              parsePriceToNumber(p.regularPrice) ??
              parsePriceToNumber(p.salePrice)
          )
          .filter((price): price is number => price !== undefined && price > 0);

        if (prices.length > 0) {
          const calculatedMaxPrice = Math.ceil(Math.max(...prices));
          const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 50) * 50;
          setMaxPrice(roundedMaxPrice);
          setFilteredMaxPrice(roundedMaxPrice); // Initially, filtered max = global max
        }
      }

      setGlobalFacetsFetched(true);
      console.log('✅ Global facets fetched and will remain static');
    } catch (error) {
      console.error('Failed to fetch global facets:', error);
    }
  }, [storeUrl, globalFacetsFetched, updateCurrencyFromProducts]);

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
      const normalizedStoreUrl = normalizeStoreUrl(storeUrl as string)!;
      const configResponse = await fetch(
        `${backendUrl}/api/v1/search/recommendations-config?storeUrl=${encodeURIComponent(normalizedStoreUrl)}`,
        {}
      );

      let shouldFetchAllProducts = false;

      if (!configResponse.ok) {
        // If no config exists, fetch all products instead
        shouldFetchAllProducts = true;
      } else {
        const configWrapped = await configResponse.json();
        const config = (
          configWrapped && configWrapped.success ? configWrapped.data : configWrapped
        ) as { enabled?: boolean };

        // If recommendations not enabled, fetch all products instead
        if (!config.enabled) {
          shouldFetchAllProducts = true;
        }
      }

      let result: unknown;

      if (shouldFetchAllProducts) {
        // Fetch all products when recommendations are not configured
        const allProductsResponse = await fetch(
          `${backendUrl}/api/v1/search/search?storeUrl=${encodeURIComponent(normalizedStoreUrl)}&limit=20`,
          {}
        );

        if (!allProductsResponse.ok) {
          setRecommendations([]);
          return;
        }

        const allProductsWrapped = await allProductsResponse.json();
        result =
          allProductsWrapped && allProductsWrapped.success
            ? allProductsWrapped.data
            : allProductsWrapped;
      } else {
        // Fetch vendor-configured recommendations
        const response = await fetch(
          `${backendUrl}/api/v1/search/recommended?storeUrl=${encodeURIComponent(normalizedStoreUrl)}`,
          {}
        );

        if (!response.ok) {
          // If vendor-configured recommendations fail, fallback to all products
          const fallbackResponse = await fetch(
            `${backendUrl}/api/v1/search/search?storeUrl=${encodeURIComponent(normalizedStoreUrl)}&limit=20`,
            {}
          );

          if (!fallbackResponse.ok) {
            setRecommendations([]);
            return;
          }

          const fallbackWrapped = await fallbackResponse.json();
          result =
            fallbackWrapped && fallbackWrapped.success ? fallbackWrapped.data : fallbackWrapped;
        } else {
          const wrapped = await response.json();
          result = wrapped && wrapped.success ? wrapped.data : wrapped;
        }
      }

      // Handle response format with type safety
      let products: Product[];
      if (Array.isArray(result)) {
        products = result as Product[];
      } else if (isSearchResponse(result)) {
        const { products: responseProducts } = result;
        products = responseProducts;
      } else if (
        result &&
        typeof result === 'object' &&
        'products' in result &&
        Array.isArray(result.products)
      ) {
        // Handle recommendations response format
        products = result.products as Product[];
      } else {
        products = [];
      }

      // Ensure all recommendations have storeUrl for cart operations
      const productsWithStoreUrl = products.map((product) => ({
        ...product,
        storeUrl: product.storeUrl || storeUrl, // Fallback to component storeUrl
      }));

      setRecommendations(productsWithStoreUrl); // Show all recommendations
      updateCurrencyFromProducts(productsWithStoreUrl);
      setRecommendationsFetched(true);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    }
  }, [storeUrl, recommendationsFetched, updateCurrencyFromProducts]);

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
      setIsInitialState(true);
    } else if (!searchQuery && hasSearched) {
      // User Clears Search (after typing at least once)
      // - Fetch all products and display in results
      // - Keep filter sidebar visible
      // - Filter data is fetched/derived only once (from the first all-products fetch) and reused afterward
      setShowRecommendations(false);
      setIsInitialState(false);
    } else if (searchQuery) {
      // User Starts Typing / Searching
      // - Show filter sidebar (remains visible for subsequent searches)
      // - Show skeleton loaders until results load
      // - Show suggestions/autocomplete based on typed input
      // - Clicking a suggestion: Sets the clicked value into the search input, automatically triggers a search for that value, saves the clicked value into recent searches
      setShowRecommendations(false);
      setIsInitialState(false);
      setHasSearched(true);
    }
  }, [searchQuery, storeUrl, setHasSearched, hasSearched]);

  // ✅ FIX: Transition out of initial state when filters are applied
  // This ensures filters work even without a search query
  useEffect(() => {
    // Check if any filter is actually applied
    const hasActiveFilters =
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.colors.length > 0 ||
      filters.sizes.length > 0 ||
      filters.tags.length > 0 ||
      filters.stockStatus.length > 0 ||
      filters.featuredProducts.length > 0 ||
      filters.saleStatus.length > 0 ||
      (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice));

    // If filters are applied while in initial state, transition out
    if (hasActiveFilters && isInitialState && !searchQuery) {
      console.log('🔧 Filters applied without search query - transitioning out of initial state');
      setShowRecommendations(false);
      setIsInitialState(false);
      setHasSearched(true); // Mark as searched so filters apply
    }
  }, [filters, isInitialState, searchQuery, maxPrice, setHasSearched]);

  // Consolidated initial data loading with Promise.all for better performance
  useEffect(() => {
    if (!storeUrl) return;

    // Reset store type when store changes
    setStoreType(null);

    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        // Load recommendations, facet configuration, and global facets in parallel
        await Promise.all([fetchRecommendations(), fetchFacetConfiguration(), fetchGlobalFacets()]);
      } catch (error) {
        console.error('❌ Failed to load initial data:', error);
      } finally {
        setIsInitialLoading(false);
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
    // Only fetch if suggestions are enabled
    if (
      suggestionsEnabled &&
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
            // Use searchService.getAutocomplete which handles API response format properly
            const result = await searchService.getAutocomplete(
              debouncedSearchQuery.trim(),
              storeUrl
            );

            // Check if component is still mounted and not cancelled
            if (isCancelled) return;

            // Backend returns AutocompleteResponse which is AutocompleteSuggestion[]
            // Extract titles from the suggestion objects
            const rawSuggestions: string[] = result.map((item) => item.title).filter(Boolean);

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
  }, [
    debouncedSearchQuery,
    storeUrl,
    scoreSuggestion,
    isFromSuggestionSelection,
    userTypingRef,
    suggestionsEnabled,
  ]);

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

        // Debug: Log pagination reset
        console.log('🔄 [Pagination] Reset to page 1 - New search with filters:', {
          categories: debouncedFilters.categories.length,
          priceRange: debouncedPriceRange,
          stockStatus: debouncedFilters.stockStatus.length,
          saleStatus: debouncedFilters.saleStatus.length,
        });

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
            // Determine featured filter value
            let featured: string | undefined;
            if (debouncedFilters.featuredProducts.length > 0) {
              if (
                debouncedFilters.featuredProducts.includes('Featured') &&
                !debouncedFilters.featuredProducts.includes('Not Featured')
              ) {
                featured = 'true';
              } else if (
                debouncedFilters.featuredProducts.includes('Not Featured') &&
                !debouncedFilters.featuredProducts.includes('Featured')
              ) {
                featured = 'false';
              }
            }

            // Determine sale status filter value
            let inSale: string | undefined;
            if (debouncedFilters.saleStatus.length > 0) {
              if (
                debouncedFilters.saleStatus.includes('On Sale') &&
                !debouncedFilters.saleStatus.includes('Not On Sale')
              ) {
                inSale = 'true';
              } else if (
                debouncedFilters.saleStatus.includes('Not On Sale') &&
                !debouncedFilters.saleStatus.includes('On Sale')
              ) {
                inSale = 'false';
              }
            }

            // Use the new search service with structured parameters
            const searchParams = {
              q: query || '',
              storeUrl,
              page: 1,
              limit: 12, // Match backend default: 12 products per page
              categories:
                debouncedFilters.categories.length > 0 ? debouncedFilters.categories : undefined,
              colors: debouncedFilters.colors.length > 0 ? debouncedFilters.colors : undefined,
              sizes: debouncedFilters.sizes.length > 0 ? debouncedFilters.sizes : undefined,
              brands: debouncedFilters.brands.length > 0 ? debouncedFilters.brands : undefined,
              tags: debouncedFilters.tags.length > 0 ? debouncedFilters.tags : undefined,
              stockStatus:
                debouncedFilters.stockStatus.length > 0 ? debouncedFilters.stockStatus : undefined,
              priceRange: debouncedPriceRange,
              insale: inSale, // ✅ Pass sale status filter to API
              featured: featured, // ✅ Pass featured filter to API
            };

            const result = await searchService.searchProducts(searchParams);

            // If the request was superseded by a newer one, discard the results
            if (currentRequestId !== searchRequestIdRef.current) {
              console.log('Discarding outdated search results');
              return;
            }

            // Handle paginated response format
            let products: Product[];
            let total = 0;
            let hasMore = false;
            let message: string | undefined;
            let showingRecommended = false;

            if (isSearchResponse(result)) {
              products = result.products;
              total = result.total || 0;
              hasMore = result.hasMore || false;
              message = result.message;
              showingRecommended = result.showingRecommended || false;

              // Debug: Log the total to verify API response
              console.log(
                'KaliFinder Search: API returned total =',
                total,
                'products.length =',
                products.length
              );

              // Process facets from search results to update counts based on active filters
              if (result.facets) {
                const facets = result.facets as Record<string, unknown>;

                // Debug: Log facets received from API with full structure
                console.log('🔍 Facets received from API:');
                console.log('  - Stock Status:', JSON.stringify(facets.instock, null, 2));
                console.log('  - Featured:', JSON.stringify(facets.featured, null, 2));
                console.log('  - On Sale:', JSON.stringify(facets.insale, null, 2));
                console.log('  - Categories:', JSON.stringify(facets.category, null, 2));
                console.log('  - Active Filters:', {
                  categories: debouncedFilters.categories,
                  stockStatus: debouncedFilters.stockStatus,
                  featuredProducts: debouncedFilters.featuredProducts,
                  saleStatus: debouncedFilters.saleStatus,
                });

                // Update stock status counts
                const stockBuckets = extractFacetBuckets(facets.instock);
                if (stockBuckets.length > 0) {
                  const stockStatusCountsLocal: { [key: string]: number } = {};
                  stockBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    const normalized = String(key).toLowerCase();
                    const displayName =
                      normalized === 'instock' || normalized === 'true'
                        ? 'In Stock'
                        : normalized === 'outofstock' || normalized === 'false'
                          ? 'Out of Stock'
                          : normalized === 'onbackorder'
                            ? 'On Backorder'
                            : String(key);
                    stockStatusCountsLocal[displayName] = bucket.doc_count;
                  });
                  setStockStatusCounts(stockStatusCountsLocal);
                }

                // Update featured status counts
                const featuredBuckets = extractFacetBuckets(facets.featured);
                if (featuredBuckets.length > 0) {
                  let featuredCountLocal = 0;
                  let notFeaturedCountLocal = 0;
                  featuredBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (key === null || key === undefined) return;
                    // Check if key represents true value (could be string, boolean, or number)
                    const keyStr = String(key).toLowerCase();
                    const isOne = typeof key === 'number' && key === 1;
                    const value = keyStr === 'true' || isOne;
                    if (value === true) {
                      featuredCountLocal = bucket.doc_count;
                    } else if (value === false) {
                      notFeaturedCountLocal = bucket.doc_count;
                    }
                  });
                  setFeaturedCount(featuredCountLocal);
                  setNotFeaturedCount(notFeaturedCountLocal);
                }

                // Update sale status counts
                const saleBuckets = extractFacetBuckets(facets.insale);
                if (saleBuckets.length > 0) {
                  let saleCountLocal = 0;
                  let notSaleCountLocal = 0;
                  saleBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (key === null || key === undefined) return;
                    // Check if key represents true value (could be string, boolean, or number)
                    const keyStr = String(key).toLowerCase();
                    const isOne = typeof key === 'number' && key === 1;
                    const value = keyStr === 'true' || isOne;
                    if (value === true) {
                      saleCountLocal = bucket.doc_count;
                    } else if (value === false) {
                      notSaleCountLocal = bucket.doc_count;
                    }
                  });
                  setSaleCount(saleCountLocal);
                  setNotSaleCount(notSaleCountLocal);
                }

                // Update category counts
                const categoryBuckets = extractFacetBuckets(facets.category);
                if (categoryBuckets.length > 0) {
                  const categoryCounts: { [key: string]: number } = {};
                  categoryBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (!key) return;
                    categoryCounts[key] = bucket.doc_count;
                  });
                  setCategoryCounts(categoryCounts);
                  setAvailableCategories(Object.keys(categoryCounts));
                }

                // Update brand counts
                const brandBuckets = extractFacetBuckets(facets.brand);
                if (brandBuckets.length > 0) {
                  const brandCounts: { [key: string]: number } = {};
                  brandBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (!key) return;
                    brandCounts[key] = bucket.doc_count;
                  });
                  setBrandCounts(brandCounts);
                  setAvailableBrands(Object.keys(brandCounts));
                }

                // Update color options
                const colorBuckets = extractFacetBuckets(facets.color);
                if (colorBuckets.length > 0) {
                  const colors: string[] = [];
                  colorBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (!key) return;
                    colors.push(key);
                  });
                  setAvailableColors(colors);
                }

                // Update size options
                const sizeBuckets = extractFacetBuckets(facets.size);
                if (sizeBuckets.length > 0) {
                  const sizes: string[] = [];
                  sizeBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (!key) return;
                    sizes.push(key);
                  });
                  setAvailableSizes(sizes);
                }

                // Update tag counts
                const tagBuckets = extractFacetBuckets(facets.tag);
                if (tagBuckets.length > 0) {
                  const tagCounts: { [key: string]: number } = {};
                  tagBuckets.forEach((bucket) => {
                    const key = getFacetBucketKey(bucket);
                    if (!key) return;
                    tagCounts[key] = bucket.doc_count;
                  });
                  setTagCounts(tagCounts);
                  setAvailableTags(Object.keys(tagCounts));
                }
              }

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

                // Calculate filtered max price from current filtered products
                const prices = products
                  .map(
                    (p) =>
                      parsePriceToNumber(p.price) ??
                      parsePriceToNumber(p.regularPrice) ??
                      parsePriceToNumber(p.salePrice)
                  )
                  .filter((price): price is number => price !== undefined && price > 0);

                if (prices.length > 0) {
                  const calculatedMaxPrice = Math.ceil(Math.max(...prices));
                  // Round up to nearest 50 for cleaner UI
                  const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 50) * 50;
                  // Update filtered max price (this is reactive to current filters)
                  setFilteredMaxPrice(roundedMaxPrice);
                  console.log('📊 Filtered max price updated to:', roundedMaxPrice);
                }
              } else {
                // No products in filtered results, keep global max price as fallback
                setFilteredMaxPrice(maxPrice);
                console.log('⚠️ No products in results, using global max price:', maxPrice);
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

            updateCurrencyFromProducts(products);

            // Ensure all products have storeUrl for cart operations
            const productsWithStoreUrl = products.map((product) => ({
              ...product,
              storeUrl: product.storeUrl || storeUrl, // Fallback to component storeUrl
            }));

            setFilteredProducts(productsWithStoreUrl);
            setTotalProducts(total);
            setDisplayedProducts(productsWithStoreUrl.length);
            setHasMoreProducts(hasMore);
            setSearchMessage(message);
            setIsShowingRecommended(showingRecommended);

            // Backend now provides reactive facets, no need for frontend calculation
            console.log('✨ Using reactive facets from backend');

            // Debug: Log the state updates
            console.log(
              'KaliFinder Search: Setting totalProducts =',
              total,
              'displayedProducts =',
              products.length
            );
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
    [
      storeUrl,
      debouncedPriceRange,
      debouncedFilters,
      searchAbortController,
      storeType,
      updateCurrencyFromProducts,
      maxPrice,
    ]
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

    const getSortablePrice = (product: Product): number | undefined => {
      return (
        parsePriceToNumber(product.price) ??
        parsePriceToNumber(product.salePrice) ??
        parsePriceToNumber(product.regularPrice)
      );
    };

    switch (sortOption) {
      case 'a-z':
        return productsToSort.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return productsToSort.sort((a, b) => b.title.localeCompare(a.title));
      case 'price-asc':
        return productsToSort.sort((a, b) => {
          const priceA = getSortablePrice(a);
          const priceB = getSortablePrice(b);

          if (priceA === undefined && priceB === undefined) return 0;
          if (priceA === undefined) return 1;
          if (priceB === undefined) return -1;

          return priceA - priceB;
        });
      case 'price-desc':
        return productsToSort.sort((a, b) => {
          const priceA = getSortablePrice(a);
          const priceB = getSortablePrice(b);

          if (priceA === undefined && priceB === undefined) return 0;
          if (priceA === undefined) return 1;
          if (priceB === undefined) return -1;

          return priceB - priceA;
        });
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

  const handleClearAll = () => {
    // Clear search query
    setSearchQuery('');
    // Clear all filters
    clearFilters();
    // Reset filtered max price to global max price
    setFilteredMaxPrice(maxPrice);
    // Reset to initial state
    setShowRecommendations(true);
    setHasSearched(false);
  };

  const handleCategoryChange = (category: string) => {
    toggleFilterItem('categories', category);

    // Track filter click with UBI
    const ubiClient = getUBIClient();
    if (ubiClient) {
      ubiClient.trackFilterClick('category', category);
    }
  };

  const handleCategoryExpand = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleBrandChange = (brand: string) => {
    toggleFilterItem('brands', brand);

    // Track filter click with UBI
    const ubiClient = getUBIClient();
    if (ubiClient) {
      ubiClient.trackFilterClick('brand', brand);
    }
  };

  const handleSizeChange = (size: string) => {
    toggleFilterItem('sizes', size);

    // Track filter click with UBI
    const ubiClient = getUBIClient();
    if (ubiClient) {
      ubiClient.trackFilterClick('size', size);
    }
  };

  const handleColorChange = (color: string) => {
    toggleFilterItem('colors', color);

    // Track filter click with UBI
    const ubiClient = getUBIClient();
    if (ubiClient) {
      ubiClient.trackFilterClick('color', color);
    }
  };

  const handleTagChange = (tag: string) => {
    toggleFilterItem('tags', tag);

    // Track filter click with UBI
    const ubiClient = getUBIClient();
    if (ubiClient) {
      ubiClient.trackFilterClick('tag', tag);
    }
  };

  // Mandatory facet handlers
  const handleStockStatusChange = (status: string) => {
    console.log('📊 Stock status filter toggled:', status);
    toggleFilterItem('stockStatus', status);
  };

  const handleFeaturedProductsChange = (status: string) => {
    toggleFilterItem('featuredProducts', status);
  };

  const handleSaleStatusChange = (status: string) => {
    toggleFilterItem('saleStatus', status);
  };

  // Load more products function (uses centralized searchService to keep normalization and pagination consistent)
  const loadMoreProducts = useCallback(async () => {
    if (isLoadingMore || !hasMoreProducts || !storeUrl) return;

    console.log('📄 [Load More] Fetching page', currentPage + 1, 'with current filters:', {
      categories: debouncedFilters.categories.length,
      priceRange: debouncedPriceRange,
      stockStatus: debouncedFilters.stockStatus.length,
      saleStatus: debouncedFilters.saleStatus.length,
    });

    setIsLoadingMore(true);
    try {
      let featured: string | undefined;
      if (debouncedFilters.featuredProducts.length > 0) {
        if (
          debouncedFilters.featuredProducts.includes('Featured') &&
          !debouncedFilters.featuredProducts.includes('Not Featured')
        ) {
          featured = 'true';
        } else if (
          debouncedFilters.featuredProducts.includes('Not Featured') &&
          !debouncedFilters.featuredProducts.includes('Featured')
        ) {
          featured = 'false';
        }
      }

      let inSale: string | undefined;
      if (debouncedFilters.saleStatus.length > 0) {
        if (
          debouncedFilters.saleStatus.includes('On Sale') &&
          !debouncedFilters.saleStatus.includes('Not On Sale')
        ) {
          inSale = 'true';
        } else if (
          debouncedFilters.saleStatus.includes('Not On Sale') &&
          !debouncedFilters.saleStatus.includes('On Sale')
        ) {
          inSale = 'false';
        }
      }

      // Build structured params for the search service (it normalizes storeUrl internally)
      const searchParams: SearchParams = {
        q: debouncedSearchQuery || '',
        storeUrl,
        page: currentPage + 1,
        limit: 12, // Match backend default: 12 products per page
        ...(debouncedFilters.categories.length > 0 && { categories: debouncedFilters.categories }),
        ...(debouncedFilters.colors.length > 0 && { colors: debouncedFilters.colors }),
        ...(debouncedFilters.sizes.length > 0 && { sizes: debouncedFilters.sizes }),
        ...(debouncedFilters.brands.length > 0 && { brands: debouncedFilters.brands }),
        ...(debouncedFilters.tags.length > 0 && { tags: debouncedFilters.tags }),
        ...(debouncedFilters.stockStatus.length > 0 && {
          stockStatus: debouncedFilters.stockStatus,
        }),
        ...(debouncedPriceRange && { priceRange: debouncedPriceRange }),
        ...(typeof inSale !== 'undefined' && { insale: inSale }),
        ...(typeof featured !== 'undefined' && { featured }),
      };

      const result = await searchService.searchProducts(searchParams);

      let products: Product[] = [];
      let hasMore = false;

      if (isSearchResponse(result)) {
        products = result.products || [];
        hasMore = result.hasMore || false;
      } else if (Array.isArray(result)) {
        products = result as Product[];
        hasMore = false;
      }

      if (products.length === 0) {
        setHasMoreProducts(false);
      } else {
        updateCurrencyFromProducts(products);

        // Ensure all products have storeUrl for cart operations
        const productsWithStoreUrl = products.map((product) => ({
          ...product,
          storeUrl: product.storeUrl || storeUrl, // Fallback to component storeUrl
        }));

        setFilteredProducts((prev) => [...prev, ...productsWithStoreUrl]);
        setDisplayedProducts((prev) => prev + productsWithStoreUrl.length);
        setCurrentPage((prev) => prev + 1);
        setHasMoreProducts(hasMore);

        console.log('✅ [Load More] Page loaded successfully:', {
          newProductsCount: productsWithStoreUrl.length,
          totalDisplayed: displayedProducts + productsWithStoreUrl.length,
          nextPage: currentPage + 1,
          hasMore,
        });
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
    displayedProducts,
    debouncedFilters,
    debouncedPriceRange,
    updateCurrencyFromProducts,
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
    const regular = parsePriceToNumber(regularPrice);
    const sale = parsePriceToNumber(salePrice);

    if (
      regular === undefined ||
      sale === undefined ||
      regular <= 0 ||
      sale <= 0 ||
      sale >= regular
    ) {
      return null;
    }

    const discount = ((regular - sale) / regular) * 100;
    return Math.round(discount);
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
      window.open(product.productUrl, '_self');
    } else if (product.url) {
      window.open(product.url, '_self');
    } else {
      console.warn('No product URL available for:', product.title);
    }
  };

  // Cart functionality - now using useCart hook
  const handleAddToCart = async (product: Product) => {
    if (!storeUrl) {
      console.error('Store URL is required for cart operations');
      return;
    }

    await addToCartHandler(product, storeUrl);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse-slow bg-loading rounded-lg p-2 md:p-4">
          <div className="bg-loading-shimmer relative mb-3 h-32 overflow-hidden rounded-md md:mb-4 md:h-48">
            <div className="animate-shimmer via-loading-shimmer absolute inset-0 bg-gradient-to-r from-transparent to-transparent"></div>
          </div>
          <div className="bg-loading-shimmer mb-2 h-4 rounded"></div>
          <div className="bg-loading-shimmer h-6 w-20 rounded"></div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    setStoreCurrencyCode(undefined);
    setStoreCurrencySymbol(undefined);
  }, [storeUrl]);

  const formatPrice = useCallback(
    (value?: string | null) => {
      if (value === undefined || value === null) return '';
      const trimmed = String(value).trim();
      if (!trimmed) return '';

      if (CURRENCY_SYMBOL_REGEX.test(trimmed)) {
        return trimmed;
      }

      let workingString = trimmed;
      let detectedCode: string | undefined;
      const isoMatch = trimmed.match(/\b[A-Z]{3}\b/);
      if (isoMatch) {
        const code = isIsoCurrencyCode(isoMatch[0]);
        if (code) {
          detectedCode = code;
          workingString = trimmed.replace(isoMatch[0], '').trim();
        }
      }

      const amount = parsePriceToNumber(workingString);
      if (amount === undefined) {
        return trimmed;
      }

      const formatNumber = (code?: string) => {
        if (!code) return undefined;
        try {
          return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: code,
          }).format(amount);
        } catch {
          return undefined;
        }
      };

      const formattedWithDetectedCode = formatNumber(detectedCode);
      if (formattedWithDetectedCode) {
        return formattedWithDetectedCode;
      }

      const formattedWithStoreCode = formatNumber(storeCurrencyCode);
      if (formattedWithStoreCode) {
        return formattedWithStoreCode;
      }

      if (storeCurrencySymbol) {
        const localizedAmount = amount.toLocaleString(undefined, {
          minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });
        return `${storeCurrencySymbol}${localizedAmount}`;
      }

      // Default to Euro symbol if no currency is detected
      const localizedAmount = amount.toLocaleString(undefined, {
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      });
      return `€${localizedAmount}`;
    },
    [storeCurrencyCode, storeCurrencySymbol]
  );

  return (
    <div className="bg-background box-border w-full overflow-y-auto font-sans antialiased">
      {!hideHeader && (
        <div className="bg-background border-border/40 sticky top-0 z-50 border-b py-3 shadow-sm backdrop-blur-sm lg:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 lg:gap-6 lg:px-6">
            <div className="hidden items-center lg:flex lg:w-auto">
              <a href="/" className="w-70">
                <img
                  src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                  alt="Kalifind"
                  className="h-auto w-48 object-contain object-left"
                />
              </a>
            </div>

            <div className="relative flex flex-1 items-center gap-2">
              {/* Autocomplete Toggle Button */}
              <button
                onClick={() => {
                  setSuggestionsEnabled(!suggestionsEnabled);
                  if (!suggestionsEnabled) {
                    // Clear suggestions when disabling
                    setAutocompleteSuggestions([]);
                    setShowAutocomplete(false);
                  }
                }}
                className={`hidden items-center gap-1.5 rounded-lg px-2.5 py-3 text-xs font-medium transition-all sm:flex sm:gap-2 sm:px-3 ${
                  suggestionsEnabled
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={
                  suggestionsEnabled
                    ? 'Disable autocomplete suggestions'
                    : 'Enable autocomplete suggestions'
                }
                aria-label={
                  suggestionsEnabled
                    ? 'Disable autocomplete suggestions'
                    : 'Enable autocomplete suggestions'
                }
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                  {suggestionsEnabled && <path d="M11 8v6"></path>}
                  {suggestionsEnabled && <path d="M8 11h6"></path>}
                </svg>
                <span className="hidden md:inline">
                  {suggestionsEnabled ? 'Suggestions ON' : 'Suggestions OFF'}
                </span>
              </button>

              <div className="relative flex-1" ref={searchRef}>
                <div
                  role="search"
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 shadow-sm transition-all focus-within:border-purple-500 focus-within:bg-white focus-within:shadow-md hover:border-gray-300 hover:bg-gray-50 sm:gap-3 sm:px-4"
                >
                  <Search className="h-4 w-4 flex-shrink-0 text-gray-400 sm:h-5 sm:w-5" />
                  <input
                    id="search-input"
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                      // Input focused
                      if (
                        suggestionsEnabled &&
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
                    role="combobox"
                    aria-expanded={showAutocomplete ? 'true' : 'false'}
                    aria-controls="search-autocomplete"
                    aria-autocomplete="list"
                    placeholder="Search products..."
                    className="w-full border-none bg-transparent py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-0 sm:py-3.5"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        inputRef.current?.focus();
                      }}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                      aria-label="Clear search"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {suggestionsEnabled &&
                  showAutocomplete &&
                  searchQuery &&
                  searchQuery.length > 0 &&
                  (isAutocompleteLoading || autocompleteSuggestions.length > 0) && (
                    <div
                      data-autocomplete-dropdown="true"
                      id="search-autocomplete"
                      className="border-border bg-background absolute top-full right-0 left-0 z-[var(--z-dropdown)] mt-2 max-h-[60vh] overflow-y-auto rounded-lg border shadow-lg"
                      aria-labelledby="search-input"
                      onMouseEnter={() => setIsInteractingWithDropdown(true)}
                      onMouseLeave={() => setIsInteractingWithDropdown(false)}
                    >
                      <div className="p-3 sm:p-4">
                        {isAutocompleteLoading ? (
                          <div className="text-muted-foreground flex items-center justify-center gap-2 py-3">
                            <div className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                            <span className="text-sm">Loading suggestions...</span>
                          </div>
                        ) : autocompleteSuggestions.length > 0 ? (
                          <>
                            <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                              Suggestions
                            </h3>
                            <div className="space-y-1">
                              {autocompleteSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  data-suggestion-item="true"
                                  className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                                    index === highlightedSuggestionIndex
                                      ? 'bg-muted'
                                      : 'hover:bg-muted/50'
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    setIsInteractingWithDropdown(false);
                                    handleSuggestionClick(suggestion);
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                  }}
                                >
                                  <Search className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                                  <span className="text-foreground pointer-events-none text-sm">
                                    {suggestion}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                              <Search className="text-muted-foreground h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-foreground mb-1 text-sm font-medium">
                                No suggestions found
                              </p>
                              <p className="text-muted-foreground text-xs">
                                No suggestions for "{searchQuery}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Close button - aligned with search bar */}
              <button
                onClick={() => {
                  if (onClose) {
                    onClose();
                  }
                  // Also send message if in iframe
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'kalifinder:close' }, '*');
                  }
                  // Dispatch event for other listeners
                  window.dispatchEvent(new CustomEvent('kalifinder:close'));
                }}
                className="group flex h-[44px] w-[44px] flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none sm:h-[50px] sm:w-[50px] sm:rounded-xl"
                aria-label="Close search"
                title="Close search"
              >
                <X className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed bottom-20 left-4 z-50 sm:bottom-6 ${shouldShowFilters ? 'block lg:hidden' : 'hidden'}`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <button className="bg-primary text-primary-foreground hover:bg-primary-hover flex min-h-[48px] transform items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 sm:min-h-0 sm:px-3 sm:py-2">
              <Filter className="h-3.5 w-3.5" />
              Filters
              <span className="bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
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
          <DrawerContent className="z-[100000] flex max-h-[93vh] flex-col">
            <div className="flex-1 overflow-y-auto px-4 sm:p-4">
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
              >
                <AccordionItem value="category">
                  <AccordionTrigger className="text-base font-extrabold">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {availableCategories.length > 0 ? (
                        (() => {
                          const categoryTree = buildCategoryTree(
                            availableCategories,
                            categoryCounts
                          );
                          return Array.from(categoryTree.children.values()).map((rootNode) => (
                            <CategoryTreeNode
                              key={rootNode.fullPath}
                              node={rootNode}
                              selectedCategories={filters.categories}
                              expandedCategories={expandedCategories}
                              onToggle={handleCategoryChange}
                              onExpand={handleCategoryExpand}
                              level={0}
                              getFacetCount={getFacetCount}
                            />
                          ));
                        })()
                      ) : (
                        <p className="text-muted-foreground p-2 text-sm">No categories available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {showOptionalFilters.brands && (
                  <AccordionItem value="brand">
                    <AccordionTrigger className="text-base font-extrabold">Brand</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {availableBrands.map((brand) => (
                          <label
                            key={brand}
                            className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-1 sm:p-2"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={filters.brands.includes(brand)}
                                onChange={() => handleBrandChange(brand)}
                                className="text-primary bg-background border-border h-4 w-4 rounded sm:h-5 sm:w-5"
                              />
                              <span className="text-foreground text-sm sm:text-base lg:leading-4">
                                {brand}
                              </span>
                            </div>
                            <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs sm:text-sm">
                              {getFacetCount('brand', brand)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="price">
                  <AccordionTrigger className="text-base font-extrabold">
                    <b className="font-extrabold">Price</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <Slider
                        value={[Math.min(filters.priceRange[1], filteredMaxPrice)]}
                        onValueChange={(value: number[]) =>
                          updateFilter('priceRange', [
                            filters.priceRange[0],
                            value[0] ?? filteredMaxPrice,
                          ])
                        }
                        max={filteredMaxPrice}
                        step={1}
                      />
                      <div className="text-muted-foreground flex justify-between text-sm">
                        <span>{filters.priceRange[0]} €</span>
                        <span>{Math.min(filters.priceRange[1], filteredMaxPrice)} €</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="size">
                  <AccordionTrigger className="text-base font-extrabold">
                    <b className="font-extrabold">Size</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-4 gap-2 pt-4">
                      {availableSizes.map((size) => (
                        <div
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`my-border rounded-lg py-2 text-center text-xs font-medium sm:py-3 sm:text-sm ${
                            filters.sizes.includes(size) ? 'bg-primary text-primary-foreground' : ''
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
                    <AccordionTrigger className="text-base font-extrabold">
                      <b className="font-extrabold">Color</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={`h-8 w-8 rounded-full border-4 transition-all sm:h-10 sm:w-10 ${
                              filters.colors.includes(color)
                                ? 'border-primary scale-110 shadow-lg'
                                : 'border-border hover:border-muted-foreground'
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
                    <AccordionTrigger className="text-base font-extrabold">
                      <b className="font-extrabold">Tags</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {availableTags.map((tag) => (
                          <label
                            key={tag}
                            className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-1 sm:p-2"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={filters.tags.includes(tag)}
                                onChange={() => handleTagChange(tag)}
                                className="text-primary bg-background border-border h-4 w-4 rounded sm:h-5 sm:w-5"
                              />
                              <span className="text-foreground text-sm sm:text-base lg:leading-4">
                                {tag}
                              </span>
                            </div>
                            <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs sm:text-sm">
                              {getFacetCount('tag', tag)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Mandatory Facets for Mobile */}
                <AccordionItem value="stockStatus">
                  <AccordionTrigger className="text-base font-extrabold">
                    <b className="font-extrabold">Stock Status</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {['In Stock', 'Out of Stock', 'On Backorder'].map((status) => (
                        <label
                          key={status}
                          className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-1 sm:p-2"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={filters.stockStatus.includes(status)}
                              onChange={() => handleStockStatusChange(status)}
                              className="border-border bg-background text-primary h-4 w-4 rounded sm:h-5 sm:w-5"
                            />
                            <span className="text-foreground text-sm sm:text-base lg:leading-4">
                              {status}
                            </span>
                          </div>
                          <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs sm:text-sm">
                            {stockStatusCounts[status] ?? 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {!isShopifyStore && (
                  <AccordionItem value="featured">
                    <AccordionTrigger className="text-base font-extrabold">
                      <b className="font-extrabold">Featured Products</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {['Featured', 'Not Featured'].map((status) => (
                          <label
                            key={status}
                            className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-1 sm:p-2"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={filters.featuredProducts.includes(status)}
                                onChange={() => handleFeaturedProductsChange(status)}
                                className="border-border bg-background text-primary h-4 w-4 rounded sm:h-5 sm:w-5"
                              />
                              <span className="text-foreground text-sm sm:text-base lg:leading-4">
                                {status}
                              </span>
                            </div>
                            <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs sm:text-sm">
                              {status === 'Featured' ? featuredCount : notFeaturedCount}
                            </span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="sale">
                  <AccordionTrigger className="text-base font-extrabold">
                    <b className="font-extrabold">Sale Status</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {['On Sale', 'Not On Sale'].map((status) => (
                        <label
                          key={status}
                          className="hover:bg-muted flex cursor-pointer items-center justify-between rounded-lg p-1 sm:p-2"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={filters.saleStatus.includes(status)}
                              onChange={() => handleSaleStatusChange(status)}
                              className="border-border bg-background text-primary h-4 w-4 rounded sm:h-5 sm:w-5"
                            />
                            <span className="text-foreground text-sm sm:text-base lg:leading-4">
                              {status}
                            </span>
                          </div>
                          <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs sm:text-sm">
                            {status === 'On Sale' ? saleCount : notSaleCount}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="bg-background mt-auto">
              <div className="flex items-center justify-between bg-gray-50 p-3">
                <div className="text-foreground pl-2 text-sm">
                  <b>{totalProducts}</b> products found
                </div>
                <DrawerClose asChild>
                  <button
                    className="hover:bg-muted rounded-full pr-1 transition-colors"
                    aria-label="Close filters"
                    title="Close filters"
                  >
                    <X className="h-5 w-5 rounded-full border bg-[#823BED] text-white" />
                  </button>
                </DrawerClose>
              </div>
              <div className="border-border flex gap-2 border-t p-4">
                {isAnyFilterActive && (
                  <button
                    onClick={handleClearAll}
                    aria-label="Clear all active filters"
                    className="border-border text-foreground hover:bg-muted min-h-[44px] flex-1 rounded-lg border py-3 text-sm font-medium transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <DrawerClose asChild>
                  <button
                    aria-label={
                      isAnyFilterActive ? 'Apply selected filters' : 'Close filter drawer'
                    }
                    className={`bg-primary text-primary-foreground hover:bg-primary-hover min-h-[44px] rounded-lg py-3 text-sm font-medium transition-colors ${
                      isAnyFilterActive ? 'flex-1' : 'w-full'
                    }`}
                  >
                    {isAnyFilterActive ? 'Apply Filters' : 'Close'}
                  </button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="mx-auto w-full max-w-[95%]">
        <div className="flex w-full gap-6 px-2 py-6 lg:px-4">
          <aside className="sticky top-24 hidden w-72 flex-shrink-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
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
              className="space-y-4"
            >
              {showMandatoryFilters.categories && (
                <AccordionItem value="category" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {isInitialLoading ? (
                        <>
                          {[...Array(3)].map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-4 w-8 rounded-full" />
                            </div>
                          ))}
                        </>
                      ) : availableCategories.length > 0 ? (
                        (() => {
                          const categoryTree = buildCategoryTree(
                            availableCategories,
                            categoryCounts
                          );
                          return Array.from(categoryTree.children.values()).map((rootNode) => (
                            <CategoryTreeNode
                              key={rootNode.fullPath}
                              node={rootNode}
                              selectedCategories={filters.categories}
                              expandedCategories={expandedCategories}
                              onToggle={handleCategoryChange}
                              onExpand={handleCategoryExpand}
                              level={0}
                              getFacetCount={getFacetCount}
                            />
                          ));
                        })()
                      ) : (
                        <p className="p-2 text-sm text-gray-500">No categories available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {showOptionalFilters.brands && (
                <AccordionItem value="brand" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Brand
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {isInitialLoading ? (
                        <>
                          {[...Array(3)].map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-4 w-8 rounded-full" />
                            </div>
                          ))}
                        </>
                      ) : availableBrands.length > 0 ? (
                        availableBrands.map((brand) => {
                          const isActive = filters.brands.includes(brand);
                          return (
                            <label
                              key={brand}
                              className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
                                isActive
                                  ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleBrandChange(brand)}
                                    aria-label={`Filter by ${brand} brand`}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                  />
                                  <svg
                                    className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                                <span
                                  className={`text-sm font-medium select-none ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                                >
                                  {brand}
                                </span>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  isActive
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {brandCounts[brand] || 0}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <p className="p-2 text-sm text-gray-500">No brands available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {showMandatoryFilters.price && (
                <AccordionItem value="price" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Price
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="px-4">
                      <Slider
                        value={[
                          filters.priceRange[0],
                          Math.min(filters.priceRange[1], filteredMaxPrice),
                        ]}
                        onValueChange={(value) => {
                          updateFilter('priceRange', [value[0] ?? 0, value[1] ?? filteredMaxPrice]);
                        }}
                        max={filteredMaxPrice}
                        min={0}
                        step={1}
                        disabled={false}
                        className="mb-6 w-full"
                      />
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                        <span>{filters.priceRange[0]} €</span>
                        <span>{Math.min(filters.priceRange[1], filteredMaxPrice)} €</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {showOptionalFilters.sizes && (
                <AccordionItem value="size">
                  <AccordionTrigger className="text-foreground text-[16px] font-[700] lg:text-[18px]">
                    <b className="font-extrabold">Size</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isInitialLoading ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(4)].map((_, idx) => (
                          <Skeleton key={idx} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : availableSizes.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSizes.map((size) => {
                          const isActive = filters.sizes.includes(size);
                          return (
                            <button
                              key={size}
                              onClick={() => handleSizeChange(size)}
                              className={`my-border rounded py-2 text-xs font-medium transition-all lg:text-sm ${
                                isActive
                                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600 ring-offset-2'
                                  : 'bg-white text-gray-700 hover:border-purple-400 hover:bg-gray-50'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No sizes available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
              {showOptionalFilters.colors && (
                <AccordionItem value="color">
                  <AccordionTrigger className="text-foreground text-[16px] font-[700] lg:text-[18px]">
                    <b className="font-extrabold">Color</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isInitialLoading ? (
                      <div className="flex gap-[8px]">
                        {[...Array(5)].map((_, idx) => (
                          <Skeleton key={idx} className="h-6 w-6 rounded-full lg:h-8 lg:w-8" />
                        ))}
                      </div>
                    ) : availableColors.length > 0 ? (
                      <div className="flex gap-[8px]">
                        {availableColors.map((color) => {
                          const isActive = filters.colors.includes(color);
                          return (
                            <button
                              key={color}
                              onClick={() => handleColorChange(color)}
                              className={`h-6 w-6 rounded-full border-2 transition-all lg:h-8 lg:w-8 ${
                                isActive
                                  ? 'scale-110 border-purple-600 shadow-lg ring-2 ring-purple-600 ring-offset-2'
                                  : 'border-gray-300 hover:scale-105 hover:border-purple-400'
                              }`}
                              data-color={color.toLowerCase()}
                              title={`Filter by ${color} color`}
                              aria-label={`Filter by ${color} color${isActive ? ' (selected)' : ''}`}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No colors available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
              {showOptionalFilters.tags && (
                <AccordionItem value="tags" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Tags
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {isInitialLoading ? (
                        <>
                          {[...Array(3)].map((_, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-4 w-8 rounded-full" />
                            </div>
                          ))}
                        </>
                      ) : availableTags.length > 0 ? (
                        availableTags.map((tag) => {
                          const isActive = filters.tags.includes(tag);
                          return (
                            <label
                              key={tag}
                              className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
                                isActive
                                  ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleTagChange(tag)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:outline-none"
                                  />
                                  <svg
                                    className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                                <span
                                  className={`text-sm font-medium select-none ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                                >
                                  {tag}
                                </span>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  isActive
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {tagCounts[tag] || 0}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <p className="p-2 text-sm text-gray-500">No tags available</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {showMandatoryFilters.stockStatus && (
                <AccordionItem value="stockStatus" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Stock Status
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {['In Stock', 'Out of Stock', 'On Backorder'].map((status) => {
                        const isActive = filters.stockStatus.includes(status);
                        return (
                          <label
                            key={status}
                            className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
                              isActive
                                ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleStockStatusChange(status)}
                                  aria-label={`Filter by ${status}`}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <svg
                                  className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span
                                className={`text-sm font-medium select-none ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                              >
                                {status}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isActive
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {stockStatusCounts[status] ?? 0}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {!isShopifyStore && showMandatoryFilters.featured && (
                <AccordionItem value="featured" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Featured Products
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {['Featured', 'Not Featured'].map((status) => {
                        const isActive = filters.featuredProducts.includes(status);
                        return (
                          <label
                            key={status}
                            className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
                              isActive
                                ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleFeaturedProductsChange(status)}
                                  aria-label={`Show ${status.toLowerCase()} products`}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <svg
                                  className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span
                                className={`text-sm font-medium select-none ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                              >
                                {status}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isActive
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {status === 'Featured' ? featuredCount : notFeaturedCount}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {showMandatoryFilters.sale && (
                <AccordionItem value="sale" className="border-b border-gray-200 pb-4">
                  <AccordionTrigger className="text-base font-bold text-gray-900 hover:no-underline">
                    Sale Status
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-1">
                      {['On Sale', 'Not On Sale'].map((status) => {
                        const isActive = filters.saleStatus.includes(status);
                        return (
                          <label
                            key={status}
                            className={`flex cursor-pointer items-center justify-between rounded-lg p-2 transition-all ${
                              isActive
                                ? 'bg-purple-50 ring-2 ring-purple-600 ring-inset'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleSaleStatusChange(status)}
                                  aria-label={`Show ${status.toLowerCase()} products`}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <svg
                                  className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span
                                className={`text-sm font-medium select-none ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                              >
                                {status}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isActive
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {status === 'On Sale' ? saleCount : notSaleCount}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
            {isAnyFilterActive && (
              <button
                onClick={handleClearAll}
                aria-label="Clear all active filters"
                className="mt-6 min-h-[44px] w-full rounded-lg border-2 border-purple-600 bg-white px-4 py-3 text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50"
              >
                Clear All Filters
              </button>
            )}
          </aside>

          <main ref={mainContentRef} className="kalifinder-results flex-1 px-1.5 lg:px-0">
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-foreground text-base font-semibold">Recent Searches</h3>
                  <button
                    onClick={handleClearRecentSearches}
                    aria-label="Clear all recent searches"
                    className="text-muted-foreground hover:text-foreground min-h-[44px] px-2 text-sm transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center gap-1 rounded-full px-3 py-1.5"
                    >
                      <span
                        className="text-foreground cursor-pointer text-sm"
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
                        className="hover:bg-background rounded-full p-0.5"
                      >
                        <X className="text-muted-foreground h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!showRecommendations && (
              <div className="text-foreground border-border mb-3 hidden border-b pb-3 text-lg font-semibold lg:block">
                Search Results
              </div>
            )}
            {!showRecommendations && (
              <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-medium lg:text-base">
                    {isLoading || isPending ? (
                      <>
                        <b className="text-foreground font-bold">Loading...</b>
                      </>
                    ) : isShowingRecommended ? (
                      <>
                        <b className="text-foreground font-bold">{displayedProducts}</b> recommended
                        products
                      </>
                    ) : totalProducts > 0 ? (
                      <>
                        <b className="text-foreground font-bold">{displayedProducts}</b> of{' '}
                        <b className="text-foreground font-bold">{totalProducts}</b> results
                      </>
                    ) : (
                      <>
                        <b className="text-foreground font-bold">{displayedProducts}</b> products
                      </>
                    )}
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        data-sort-button
                        className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-purple-400 hover:bg-purple-50 hover:shadow-md focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 transition-colors group-hover:text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                          />
                        </svg>
                        <span className="font-semibold">{getSortLabel(sortOption)}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-all group-hover:text-purple-600 group-data-[state=open]:rotate-180" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="z-[2147483647] min-w-[240px] rounded-xl border border-gray-200 bg-white p-2 shadow-2xl"
                      style={{
                        boxShadow:
                          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                        Sort by
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1 bg-gray-100" />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('default');
                        }}
                        className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sortOption === 'default'
                            ? 'bg-purple-100 font-semibold text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 ${sortOption === 'default' ? 'text-purple-600' : 'text-muted-foreground'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>Relevance</span>
                          </div>
                          {sortOption === 'default' && (
                            <svg
                              className="h-4 w-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('a-z');
                        }}
                        className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sortOption === 'a-z'
                            ? 'bg-purple-100 font-semibold text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 ${sortOption === 'a-z' ? 'text-purple-600' : 'text-muted-foreground'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                              />
                            </svg>
                            <span>Name: A-Z</span>
                          </div>
                          {sortOption === 'a-z' && (
                            <svg
                              className="h-4 w-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('z-a');
                        }}
                        className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sortOption === 'z-a'
                            ? 'bg-purple-100 font-semibold text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 ${sortOption === 'z-a' ? 'text-purple-600' : 'text-muted-foreground'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V8"
                              />
                            </svg>
                            <span>Name: Z-A</span>
                          </div>
                          {sortOption === 'z-a' && (
                            <svg
                              className="h-4 w-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('price-asc');
                        }}
                        className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sortOption === 'price-asc'
                            ? 'bg-purple-100 font-semibold text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 ${sortOption === 'price-asc' ? 'text-purple-600' : 'text-muted-foreground'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Price: Low to High</span>
                          </div>
                          {sortOption === 'price-asc' && (
                            <svg
                              className="h-4 w-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSortOption('price-desc');
                        }}
                        className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all ${
                          sortOption === 'price-desc'
                            ? 'bg-purple-100 font-semibold text-purple-700 shadow-sm'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 ${sortOption === 'price-desc' ? 'text-purple-600' : 'text-muted-foreground'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Price: High to Low</span>
                          </div>
                          {sortOption === 'price-desc' && (
                            <svg
                              className="h-4 w-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}{' '}
            {showRecommendations ? (
              // Show recommendations and popular searches, or skeletons while loading
              <div className="w-full">
                {/* Smart Recommendations */}
                {(() => {
                  return null;
                })()}
                {isInitialLoading || recommendations.length > 0 ? (
                  recommendations.length > 0 ? (
                    <Recommendations
                      recommendations={recommendations}
                      handleProductClick={handleProductClick}
                      calculateDiscountPercentage={calculateDiscountPercentage}
                      addingToCart={addingToCart}
                      handleAddToCart={handleAddToCart}
                      formatPrice={formatPrice}
                    />
                  ) : (
                    // Show skeleton loaders while recommendations are loading
                    <LoadingSkeleton />
                  )
                ) : (
                  // Show empty state when initial loading is complete and no recommendations
                  <div className="animate-in fade-in w-full py-12 text-center duration-300">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-muted animate-in zoom-in flex h-16 w-16 items-center justify-center rounded-full duration-500">
                        <Search className="text-muted-foreground h-8 w-8" />
                      </div>
                      <div className="animate-in slide-in-from-bottom-2 duration-500">
                        <p className="text-foreground mb-2 text-lg font-semibold lg:text-xl">
                          No products available
                        </p>
                        <p className="text-muted-foreground text-sm lg:text-base">
                          Start typing to search for products.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* Show message banner when displaying recommended products */}
                {isShowingRecommended && searchMessage && filteredProducts.length > 0 && (
                  <div className="bg-muted/50 animate-in fade-in mb-4 rounded-lg border border-gray-200 p-4 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium">
                          Showing Recommendations
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs lg:text-sm">
                          {searchMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={handleProductClick}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={addingToCart === product.id}
                      calculateDiscountPercentage={calculateDiscountPercentage}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>

                {/* Infinite scroll trigger for mobile */}
                {isMobile &&
                  hasMoreProducts &&
                  displayedProducts > 0 &&
                  !isLoading &&
                  !isShowingRecommended && (
                    <div
                      ref={loadMoreTriggerRef}
                      id="load-more-trigger"
                      className="my-4 h-16 w-full"
                    >
                      {isLoadingMore && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-2">
                              <div className="animate-bounce-delay-0 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
                              <div className="animate-bounce-delay-150 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
                              <div className="animate-bounce-delay-300 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
                            </div>
                            <span className="text-muted-foreground text-sm">
                              Loading {Math.min(12, Math.max(0, totalProducts - displayedProducts))}{' '}
                              more products...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Load More button for desktop */}
                {!isMobile &&
                  hasMoreProducts &&
                  displayedProducts > 0 &&
                  !isLoading &&
                  !isShowingRecommended && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => void loadMoreProducts()}
                        disabled={isLoadingMore}
                        className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-8 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoadingMore
                          ? 'Loading...'
                          : `Load More (${Math.min(12, Math.max(0, totalProducts - displayedProducts))} more)`}
                      </button>
                    </div>
                  )}
              </>
            )}
            {!isLoading &&
              !isPending &&
              !showRecommendations &&
              filteredProducts.length === 0 &&
              hasSearched && (
                <div className="animate-in fade-in w-full py-12 text-center duration-300">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-muted animate-in zoom-in flex h-16 w-16 items-center justify-center rounded-full duration-500">
                      <Search className="text-muted-foreground h-8 w-8" />
                    </div>
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                      {searchMessage ? (
                        <>
                          <p className="text-foreground mb-2 text-lg font-semibold lg:text-xl">
                            {isShowingRecommended ? 'Showing Recommendations' : 'Search not found'}
                          </p>
                          <p className="text-muted-foreground text-sm lg:text-base">
                            {searchMessage}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-foreground mb-2 text-lg font-semibold lg:text-xl">
                            Search not found
                          </p>
                          <p className="text-muted-foreground text-sm lg:text-base">
                            No products found matching your criteria. Try different keywords or
                            browse our categories.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            {/* Cart Message Display */}
            {cartMessage && (
              <div className="bg-primary text-primary-foreground fixed top-20 right-4 left-4 z-[999999] mx-auto max-w-sm rounded-lg px-4 py-2 shadow-lg sm:top-4 sm:left-auto">
                <div className="flex items-center gap-2">
                  <div className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  <span className="text-sm font-medium">{cartMessage}</span>
                </div>
              </div>
            )}
          </main>

          {/* Framer-style Powered by KaliFinder watermark - Bottom Right */}
          <div className="fixed right-3 bottom-4 z-40 sm:right-4 sm:bottom-6 lg:right-6">
            <a
              href="https://kalifinder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg transition-all hover:border-purple-300 hover:shadow-xl sm:gap-2 sm:px-4 sm:py-2"
              style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <span className="hidden text-xs font-medium text-gray-500 transition-colors group-hover:text-gray-700 sm:inline">
                Powered by
              </span>
              <div className="flex items-center gap-1.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform group-hover:scale-110"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    fill="#7c3aed"
                    className="transition-colors group-hover:fill-purple-600"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors group-hover:stroke-purple-600"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors group-hover:stroke-purple-600"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-purple-600">
                  KaliFinder
                </span>
              </div>
            </a>
          </div>

          {/* Scroll to top button - shows after scrolling down 400px */}
          <ScrollToTop containerRef={mainContentRef} showAfter={400} />
        </div>
      </div>
    </div>
  );
};

export default KalifindSearch;
