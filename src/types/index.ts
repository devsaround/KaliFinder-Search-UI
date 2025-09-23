// Core interfaces for Kalifind Search

export interface InitialData {
  totalProducts: number;
  maxPrice: number;
  availableCategories: string[];
  availableBrands: string[];
  categoryCounts: { [key: string]: number };
  brandCounts: { [key: string]: number };
  availableColors?: string[];
  availableSizes?: string[];
  availableTags?: string[];
  colorCounts?: { [key: string]: number };
  sizeCounts?: { [key: string]: number };
  tagCounts?: { [key: string]: number };
}

export interface Product {
  id: string;
  name?: string;
  title: string;
  image?: string;
  imageUrl?: string; // Backend sends imageUrl
  originalPrice?: number;
  currentPrice?: number;
  price: string;
  categories?: string[];
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  url?: string;
  productUrl?: string; // Backend sends productUrl
  description?: string;
  inStock?: boolean;
  storeVendorId?: string;
  storeId?: string;
  storeType?: string;
  vendor?: string;
  slug?: string;
  regularPrice?: string;
  salePrice?: string;
  sku?: string;
  status?: string;
  featured?: boolean;
  storeUrl?: string;
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  colors: string[];
  sizes: string[];
  brands: string[];
  genders?: string[];
  tags: string[];
  // Mandatory facets
  stockStatus: string[];      // In Stock, Out of Stock, On Backorder
  featuredProducts: boolean; // Featured vs Regular products
  saleStatus: boolean;       // On Sale vs Regular Price
}

// Facet configuration for mandatory and optional facets
export interface FacetConfig {
  field: string;        // Facet field name
  label: string;        // Display label
  visible: boolean;     // Show/hide facet
  terms: number;        // Number of terms to show
  mandatory: boolean;   // Whether this is a mandatory facet
}

// Mandatory facets (Always Visible)
export interface MandatoryFacets {
  categories: boolean;
  priceRange: boolean;
  stockStatus: boolean;
  featuredProducts: boolean;
  saleStatus: boolean;
}

// Optional facets (Configurable via Backend)
export interface OptionalFacets {
  brands?: boolean;
  sizes?: boolean;
  colors?: boolean;
  tags?: boolean;
}

export interface SearchConfig {
  storeUrl?: string;
}

export interface IsOpenState {
  isOpen: boolean;
  toggleIsOpen: () => void;
}

// Extended window interface for global variables
export interface KalifindWindow extends Window {
  kalifindInitialData?: InitialData;
  kalifindInitialized?: boolean;
}

// API Response types
export interface SearchResponse {
  products: Product[];
  total: number;
  facets?: {
    categories: { [key: string]: number };
    brands: { [key: string]: number };
    colors: { [key: string]: number };
    sizes: { [key: string]: number };
    tags: { [key: string]: number };
  };
}

export interface AutocompleteResponse {
  suggestions: string[];
}

// Component Props types
export interface KalifindSearchProps {
  storeUrl?: string;
  initialSearchQuery?: string;
  onClose?: () => void;
}

export interface SearchIconProps {
  storeUrl?: string;
}

export interface ShadowDOMSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  storeUrl?: string;
}

// Sort options
export type SortOption = 'relevance' | 'a-z' | 'z-a' | 'price-asc' | 'price-desc';

// Filter counts
export interface FilterCounts {
  categoryCounts: { [key: string]: number };
  brandCounts: { [key: string]: number };
  colorCounts: { [key: string]: number };
  sizeCounts: { [key: string]: number };
  tagCounts: { [key: string]: number };
}
