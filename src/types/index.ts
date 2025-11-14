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
  products?: Product[]; // Store products with cart fields for cart operations
  storeUrl?: string;
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
  currency?: string;
  currencyCode?: string;
  currencySymbol?: string;
  currency_symbol?: string;
  priceCurrency?: string;
  price_currency?: string;
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
  featured?: boolean | number | string;
  onSale?: boolean | number | string;
  stockStatus?: string;
  storeUrl?: string;
  // Cart-specific fields
  productType?: string; // "simple", "variable", or "external"
  shopifyVariantId?: string; // Shopify variant ID
  wooProductId?: string; // WooCommerce product ID
  wooVariationId?: string; // WooCommerce variation ID (for variable products)
  shopifyProductId?: string;
  attributes?: Record<string, string | number | boolean>; // Product attributes for variations
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
  stockStatus: string[]; // In Stock, Out of Stock, On Backorder
  featuredProducts: string[]; // Featured, Not Featured
  saleStatus: string[]; // On Sale, Not On Sale
}

// Facet configuration for mandatory and optional facets
export interface FacetConfig {
  field: string; // Facet field name
  label: string; // Display label
  visible: boolean; // Show/hide facet
  terms: number; // Number of terms to show
  mandatory: boolean; // Whether this is a mandatory facet
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

// Cart functionality types
export interface CartProduct extends Product {
  // Required for cart operations
  storeUrl: string;
  storeType: 'shopify' | 'woocommerce';
}

export interface CartResponse {
  success: boolean;
  message?: string;
  cart?: {
    item_count: number;
    total_price: string;
    items: Product[];
  };
}

export interface CartError {
  error: string;
  message: string;
  fallbackUrl?: string;
}
