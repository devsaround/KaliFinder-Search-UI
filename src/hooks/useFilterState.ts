/**
 * useFilterState Hook
 * Manages all filter-related state
 * Replaces 15+ individual useState calls for filters
 */

import { useState, useCallback } from 'react';

export interface FilterVisibility {
  // Optional filters
  brands: boolean;
  colors: boolean;
  sizes: boolean;
  tags: boolean;
  // Mandatory filters
  categories: boolean;
  price: boolean;
  stockStatus: boolean;
  featured: boolean;
  sale: boolean;
}

export interface FilterCounts {
  [key: string]: number;
}

export interface FilterState {
  // Available filter options
  maxPrice: number;
  availableCategories: string[];
  availableBrands: string[];
  availableColors: string[];
  availableSizes: string[];
  availableTags: string[];

  // Filter counts
  categoryCounts: FilterCounts;
  brandCounts: FilterCounts;
  tagCounts: FilterCounts;
  stockStatusCounts: FilterCounts;
  featuredCount: number;
  notFeaturedCount: number;
  saleCount: number;
  notSaleCount: number;

  // Filter visibility
  showOptionalFilters: FilterVisibility;
  showMandatoryFilters: FilterVisibility;

  // Global state
  globalFacetsFetched: boolean;
}

export interface FilterActions {
  setMaxPrice: (price: number) => void;
  setAvailableCategories: (categories: string[]) => void;
  setAvailableBrands: (brands: string[]) => void;
  setAvailableColors: (colors: string[]) => void;
  setAvailableSizes: (sizes: string[]) => void;
  setAvailableTags: (tags: string[]) => void;
  setCategoryCounts: (counts: FilterCounts) => void;
  setBrandCounts: (counts: FilterCounts) => void;
  setTagCounts: (counts: FilterCounts) => void;
  setStockStatusCounts: (counts: FilterCounts) => void;
  setFeaturedCount: (count: number) => void;
  setNotFeaturedCount: (count: number) => void;
  setSaleCount: (count: number) => void;
  setNotSaleCount: (count: number) => void;
  setShowOptionalFilters: (filters: Partial<FilterVisibility>) => void;
  setShowMandatoryFilters: (filters: Partial<FilterVisibility>) => void;
  setGlobalFacetsFetched: (fetched: boolean) => void;
  updateFilterVisibility: (config: {
    optional?: Partial<FilterVisibility>;
    mandatory?: Partial<FilterVisibility>;
  }) => void;
  resetFilterCounts: () => void;
}

export function useFilterState(initialMaxPrice: number = 10000) {
  // Available filter options
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Filter counts
  const [categoryCounts, setCategoryCounts] = useState<FilterCounts>({});
  const [brandCounts, setBrandCounts] = useState<FilterCounts>({});
  const [tagCounts, setTagCounts] = useState<FilterCounts>({});
  const [stockStatusCounts, setStockStatusCounts] = useState<FilterCounts>({});
  const [featuredCount, setFeaturedCount] = useState(0);
  const [notFeaturedCount, setNotFeaturedCount] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [notSaleCount, setNotSaleCount] = useState(0);

  // Filter visibility
  const [showOptionalFilters, setShowOptionalFiltersState] = useState<FilterVisibility>({
    brands: true,
    colors: true,
    sizes: true,
    tags: true,
    categories: true,
    price: true,
    stockStatus: true,
    featured: true,
    sale: true,
  });

  const [showMandatoryFilters, setShowMandatoryFiltersState] = useState<FilterVisibility>({
    categories: true,
    price: true,
    stockStatus: true,
    featured: true,
    sale: true,
    brands: true,
    colors: true,
    sizes: true,
    tags: true,
  });

  // Global facets state
  const [globalFacetsFetched, setGlobalFacetsFetched] = useState(false);

  // Update filter visibility (merge with existing)
  const setShowOptionalFilters = useCallback((filters: Partial<FilterVisibility>) => {
    setShowOptionalFiltersState((prev) => ({ ...prev, ...filters }));
  }, []);

  const setShowMandatoryFilters = useCallback((filters: Partial<FilterVisibility>) => {
    setShowMandatoryFiltersState((prev) => ({ ...prev, ...filters }));
  }, []);

  // Update both optional and mandatory filters at once
  const updateFilterVisibility = useCallback(
    (config: { optional?: Partial<FilterVisibility>; mandatory?: Partial<FilterVisibility> }) => {
      if (config.optional) {
        setShowOptionalFiltersState((prev) => ({ ...prev, ...config.optional }));
      }
      if (config.mandatory) {
        setShowMandatoryFiltersState((prev) => ({ ...prev, ...config.mandatory }));
      }
    },
    []
  );

  // Reset all filter counts
  const resetFilterCounts = useCallback(() => {
    setCategoryCounts({});
    setBrandCounts({});
    setTagCounts({});
    setStockStatusCounts({});
    setFeaturedCount(0);
    setNotFeaturedCount(0);
    setSaleCount(0);
    setNotSaleCount(0);
  }, []);

  const state: FilterState = {
    maxPrice,
    availableCategories,
    availableBrands,
    availableColors,
    availableSizes,
    availableTags,
    categoryCounts,
    brandCounts,
    tagCounts,
    stockStatusCounts,
    featuredCount,
    notFeaturedCount,
    saleCount,
    notSaleCount,
    showOptionalFilters,
    showMandatoryFilters,
    globalFacetsFetched,
  };

  const actions: FilterActions = {
    setMaxPrice,
    setAvailableCategories,
    setAvailableBrands,
    setAvailableColors,
    setAvailableSizes,
    setAvailableTags,
    setCategoryCounts,
    setBrandCounts,
    setTagCounts,
    setStockStatusCounts,
    setFeaturedCount,
    setNotFeaturedCount,
    setSaleCount,
    setNotSaleCount,
    setShowOptionalFilters,
    setShowMandatoryFilters,
    setGlobalFacetsFetched,
    updateFilterVisibility,
    resetFilterCounts,
  };

  return { ...state, ...actions };
}
