/**
 * FilterSidebar Component
 * Main filter sidebar with all filter types
 * Aggregates CheckboxFilter, PriceFilter, SizeFilter, ColorFilter, ToggleFilter
 */

import React from 'react';
import { Accordion } from '@/components/ui/accordion';
import { CheckboxFilter } from './CheckboxFilter';
import { PriceFilter } from './PriceFilter';
import { SizeFilter } from './SizeFilter';
import { ColorFilter } from './ColorFilter';
import { ToggleFilter } from './ToggleFilter';

export interface FilterState {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  stockStatus: string[];
  priceRange: [number, number];
  featured: boolean;
  sale: boolean;
}

export interface FilterCounts {
  categories: Record<string, number>;
  brands: Record<string, number>;
  tags: Record<string, number>;
  stockStatus: Record<string, number>;
}

export interface AvailableFilters {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
}

export interface FilterVisibility {
  categories?: boolean;
  brands?: boolean;
  sizes?: boolean;
  colors?: boolean;
  tags?: boolean;
  price?: boolean;
  stockStatus?: boolean;
  featured?: boolean;
  sale?: boolean;
}

export interface FilterSidebarProps {
  // Filter state
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: unknown) => void;

  // Available options
  availableFilters: AvailableFilters;
  filterCounts: FilterCounts;
  maxPrice: number;

  // Visibility
  showFilters: FilterVisibility;

  // State
  isLoading?: boolean;
  disabled?: boolean;
  isShopifyStore?: boolean;

  // Callbacks
  onClearAll?: () => void;

  // Display
  currency?: string;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  availableFilters,
  filterCounts,
  maxPrice,
  showFilters,
  isLoading = false,
  disabled = false,
  isShopifyStore = false,
  onClearAll,
  currency = '€',
  className = '',
}) => {
  // Individual filter change handlers
  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange('categories', newCategories);
  };

  const handleBrandChange = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFilterChange('brands', newBrands);
  };

  const handleSizeChange = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange('sizes', newSizes);
  };

  const handleColorChange = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange('colors', newColors);
  };

  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFilterChange('tags', newTags);
  };

  const handleStockStatusChange = (status: string) => {
    const newStatuses = filters.stockStatus.includes(status)
      ? filters.stockStatus.filter((s) => s !== status)
      : [...filters.stockStatus, status];
    onFilterChange('stockStatus', newStatuses);
  };

  const handlePriceChange = (range: [number, number]) => {
    onFilterChange('priceRange', range);
  };

  const handleFeaturedToggle = (enabled: boolean) => {
    onFilterChange('featured', enabled);
  };

  const handleSaleToggle = (enabled: boolean) => {
    onFilterChange('sale', enabled);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.tags.length > 0 ||
    filters.stockStatus.length > 0 ||
    filters.priceRange[1] < maxPrice ||
    filters.featured ||
    filters.sale;

  return (
    <aside className={`bg-background border-border rounded-lg border p-4 shadow-sm ${className}`}>
      {/* Clear All Button */}
      {hasActiveFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-primary hover:text-primary/80 mb-4 w-full text-center text-sm font-medium transition-colors"
        >
          Clear All Filters
        </button>
      )}

      {/* Filters Accordion */}
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
        {/* Category Filter */}
        {showFilters.categories && (
          <CheckboxFilter
            id="category"
            title="Category"
            items={availableFilters.categories}
            selectedItems={filters.categories}
            itemCounts={filterCounts.categories}
            onItemChange={handleCategoryChange}
            isLoading={isLoading}
            disabled={disabled}
            emptyMessage="No categories available"
          />
        )}

        {/* Brand Filter */}
        {showFilters.brands && (
          <CheckboxFilter
            id="brand"
            title="Brand"
            items={availableFilters.brands}
            selectedItems={filters.brands}
            itemCounts={filterCounts.brands}
            onItemChange={handleBrandChange}
            isLoading={isLoading}
            disabled={disabled}
            emptyMessage="No brands available"
          />
        )}

        {/* Price Filter */}
        {showFilters.price && (
          <PriceFilter
            priceRange={filters.priceRange}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            disabled={disabled}
            currency={currency}
          />
        )}

        {/* Size Filter */}
        {showFilters.sizes && (
          <SizeFilter
            sizes={availableFilters.sizes}
            selectedSizes={filters.sizes}
            onSizeChange={handleSizeChange}
            isLoading={isLoading}
            disabled={disabled}
            emptyMessage="No sizes available"
          />
        )}

        {/* Color Filter */}
        {showFilters.colors && (
          <ColorFilter
            colors={availableFilters.colors}
            selectedColors={filters.colors}
            onColorChange={handleColorChange}
            isLoading={isLoading}
            disabled={disabled}
            emptyMessage="No colors available"
          />
        )}

        {/* Tags Filter */}
        {showFilters.tags && (
          <CheckboxFilter
            id="tags"
            title="Tags"
            items={availableFilters.tags}
            selectedItems={filters.tags}
            itemCounts={filterCounts.tags}
            onItemChange={handleTagChange}
            isLoading={isLoading}
            disabled={disabled}
            emptyMessage="No tags available"
          />
        )}

        {/* Stock Status Filter */}
        {showFilters.stockStatus && (
          <CheckboxFilter
            id="stockStatus"
            title="Stock Status"
            items={['In Stock', 'Out of Stock', 'On Backorder']}
            selectedItems={filters.stockStatus}
            itemCounts={filterCounts.stockStatus}
            onItemChange={handleStockStatusChange}
            isLoading={isLoading}
            disabled={disabled}
            showCounts={true}
          />
        )}

        {/* Featured Filter (WooCommerce only) */}
        {!isShopifyStore && showFilters.featured && (
          <ToggleFilter
            id="featured"
            title="Featured"
            isEnabled={filters.featured}
            onToggle={handleFeaturedToggle}
            disabled={disabled}
            description="Show only featured products"
          />
        )}

        {/* Sale Filter (WooCommerce only) */}
        {!isShopifyStore && showFilters.sale && (
          <ToggleFilter
            id="sale"
            title="On Sale"
            isEnabled={filters.sale}
            onToggle={handleSaleToggle}
            disabled={disabled}
            description="Show only products on sale"
          />
        )}
      </Accordion>
    </aside>
  );
};
