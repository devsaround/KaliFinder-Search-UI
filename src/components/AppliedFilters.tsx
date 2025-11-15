/**
 * AppliedFilters Component
 * Shows active filters as removable chips
 */

import { X } from '@/components/icons';
import type { FilterState } from '@/types';
import React from 'react';

interface AppliedFiltersProps {
  filters: FilterState;
  searchQuery: string;
  onRemoveFilter: (filterType: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
  maxPrice: number;
}

export const AppliedFilters: React.FC<AppliedFiltersProps> = ({
  filters,
  searchQuery,
  onRemoveFilter,
  onClearAll,
  maxPrice,
}) => {
  const hasFilters =
    searchQuery ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.tags.length > 0 ||
    filters.stockStatus.length > 0 ||
    filters.featuredProducts.length > 0 ||
    filters.saleStatus.length > 0 ||
    (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice));

  if (!hasFilters) {
    return null;
  }

  const renderFilterChip = (label: string, onRemove: () => void, ariaLabel: string) => (
    <div
      className="bg-primary/10 text-primary border-primary/20 hover:border-primary/40 hover:bg-primary/15 flex min-h-[36px] items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all"
      role="group"
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 focus-visible:ring-primary min-h-[32px] min-w-[32px] touch-manipulation rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
        aria-label={`Remove ${label} filter`}
        type="button"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="border-border mb-6 rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">Active Filters</h3>
        <button
          onClick={onClearAll}
          className="text-primary hover:text-primary-hover focus-visible:ring-primary min-h-[44px] touch-manipulation px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Clear all filters"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search Query */}
        {searchQuery &&
          renderFilterChip(`Search: "${searchQuery}"`, () => {}, 'Active search query')}

        {/* Categories */}
        {filters.categories.map((category) =>
          renderFilterChip(
            `Category: ${category}`,
            () => onRemoveFilter('categories', category),
            `Active category filter: ${category}`
          )
        )}

        {/* Brands */}
        {filters.brands.map((brand) =>
          renderFilterChip(
            `Brand: ${brand}`,
            () => onRemoveFilter('brands', brand),
            `Active brand filter: ${brand}`
          )
        )}

        {/* Colors */}
        {filters.colors.map((color) =>
          renderFilterChip(
            `Color: ${color}`,
            () => onRemoveFilter('colors', color),
            `Active color filter: ${color}`
          )
        )}

        {/* Sizes */}
        {filters.sizes.map((size) =>
          renderFilterChip(
            `Size: ${size}`,
            () => onRemoveFilter('sizes', size),
            `Active size filter: ${size}`
          )
        )}

        {/* Tags */}
        {filters.tags.map((tag) =>
          renderFilterChip(
            `Tag: ${tag}`,
            () => onRemoveFilter('tags', tag),
            `Active tag filter: ${tag}`
          )
        )}

        {/* Stock Status */}
        {filters.stockStatus.map((status) =>
          renderFilterChip(
            status,
            () => onRemoveFilter('stockStatus', status),
            `Active stock filter: ${status}`
          )
        )}

        {/* Featured */}
        {filters.featuredProducts.map((status) =>
          renderFilterChip(
            status,
            () => onRemoveFilter('featuredProducts', status),
            `Active featured filter: ${status}`
          )
        )}

        {/* Sale Status */}
        {filters.saleStatus.map((status) =>
          renderFilterChip(
            status,
            () => onRemoveFilter('saleStatus', status),
            `Active sale filter: ${status}`
          )
        )}

        {/* Price Range */}
        {filters.priceRange &&
          (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) &&
          renderFilterChip(
            `Price: $${filters.priceRange[0]} - $${filters.priceRange[1]}`,
            () => onRemoveFilter('priceRange'),
            `Active price filter: $${filters.priceRange[0]} to $${filters.priceRange[1]}`
          )}
      </div>
    </div>
  );
};

export default AppliedFilters;
