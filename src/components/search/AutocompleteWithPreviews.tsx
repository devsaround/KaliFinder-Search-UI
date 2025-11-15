/**
 * AutocompleteWithPreviews Component
 * Enhanced autocomplete with product image previews
 */

import { Search } from '@/components/icons';
import type { Product } from '@/types';
import React from 'react';

interface AutocompleteWithPreviewsProps {
  suggestions: string[];
  products: Product[];
  highlightedIndex: number;
  onSuggestionClick: (suggestion: string) => void;
  onProductClick: (product: Product) => void;
  isLoading?: boolean;
  formatPrice?: (value?: string | null) => string;
}

export const AutocompleteWithPreviews: React.FC<AutocompleteWithPreviewsProps> = ({
  suggestions,
  products,
  highlightedIndex,
  onSuggestionClick,
  onProductClick,
  isLoading = false,
  formatPrice,
}) => {
  const hasContent = suggestions.length > 0 || products.length > 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-3">
          <div className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
          <span className="text-sm">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
          <Search className="text-muted-foreground h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-foreground mb-1 text-sm font-medium">No suggestions found</p>
          <p className="text-muted-foreground text-xs">Try different keywords</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="border-border border-b p-4">
          <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Suggestions
          </h3>
          <div role="listbox" aria-label="Search suggestions" className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                data-suggestion-item="true"
                className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                  index === highlightedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSuggestionClick(suggestion);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                role="option"
                aria-selected={index === highlightedIndex ? 'true' : 'false'}
              >
                <Search
                  className="text-muted-foreground h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="text-foreground pointer-events-none text-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Preview Section */}
      {products.length > 0 && (
        <div className="p-4">
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Top Products
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors"
                onClick={() => onProductClick(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProductClick(product);
                  }
                }}
                aria-label={`View ${product.title}`}
              >
                {/* Product Image */}
                <div className="bg-muted relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                  <img
                    src={product.imageUrl || product.image}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-foreground line-clamp-1 text-sm font-medium">
                    {product.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    {formatPrice && (
                      <span className="text-primary text-sm font-semibold">
                        {formatPrice(product.salePrice || product.price)}
                      </span>
                    )}
                    {product.regularPrice &&
                      product.salePrice &&
                      product.salePrice !== product.regularPrice && (
                        <span className="text-muted-foreground text-xs line-through">
                          {formatPrice?.(product.regularPrice)}
                        </span>
                      )}
                  </div>
                </div>

                {/* Arrow Icon */}
                <svg
                  className="text-muted-foreground h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}
          </div>

          {products.length > 4 && (
            <div className="text-muted-foreground mt-3 text-center text-xs">
              +{products.length - 4} more products
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteWithPreviews;
