/**
 * SearchHeader Component
 * Header with product count and sort dropdown
 */

import React from 'react';
import { SortDropdown, type SortOption } from './SortDropdown';

export interface SearchHeaderProps {
  // Product counts
  displayedCount: number;
  totalCount: number;

  // Sort
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;

  // Display
  title?: string;
  showBorder?: boolean;
  className?: string;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  displayedCount,
  totalCount,
  sortOption,
  onSortChange,
  title = 'Search Results',
  showBorder = true,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Title (desktop only) */}
      {title && (
        <div
          className={`text-foreground mb-3 hidden text-lg font-semibold lg:block ${showBorder ? 'border-border border-b pb-3' : ''}`}
        >
          {title}
        </div>
      )}

      {/* Results Count & Sort */}
      <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
        {/* Product Count */}
        <div>
          <b className="text-foreground font-extrabold">{displayedCount}</b> out of{' '}
          <b className="text-foreground font-extrabold">{totalCount}</b> products
        </div>

        {/* Sort Dropdown */}
        <SortDropdown value={sortOption} onChange={onSortChange} />
      </div>
    </div>
  );
};
