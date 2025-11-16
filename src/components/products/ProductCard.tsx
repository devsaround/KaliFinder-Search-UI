import { ShoppingCart } from '@/components/icons';
import {
  calculateDiscountPercentage as calcDiscount,
  getPrimaryPrice,
  getSecondaryPrice,
  hasValidDiscount,
} from '@/utils/price';
import React, { memo, useCallback, useMemo } from 'react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAddingToCart: boolean;
  calculateDiscountPercentage?: (regularPrice: string, salePrice: string) => number | null;
  formatPrice: (value?: string | null) => string;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onAddToCart,
  isAddingToCart,
  calculateDiscountPercentage,
  formatPrice,
}) => {
  // Memoize expensive calculations
  const hasDiscount = useMemo(
    () => hasValidDiscount(product.regularPrice ?? product.price, product.salePrice),
    [product.regularPrice, product.price, product.salePrice]
  );

  const discountPercentage = useMemo(() => {
    if (!hasDiscount || !product.regularPrice || !product.salePrice) return null;

    return calculateDiscountPercentage
      ? calculateDiscountPercentage(product.regularPrice, product.salePrice)
      : calcDiscount(product.regularPrice, product.salePrice);
  }, [hasDiscount, product.regularPrice, product.salePrice, calculateDiscountPercentage]);

  const prices = useMemo(() => {
    const primary = getPrimaryPrice(product);
    const secondary = getSecondaryPrice(product);

    return {
      primary: formatPrice(primary) || primary || '—',
      secondary: secondary ? formatPrice(secondary) || secondary : null,
    };
  }, [product, formatPrice]);

  // Stock status
  const stockStatus = useMemo(() => {
    const status = product.stockStatus?.toLowerCase();
    return {
      isOutOfStock: status === 'outofstock',
      isOnBackorder: status === 'onbackorder',
    };
  }, [product.stockStatus]);

  // Memoize event handlers to prevent recreating on every render
  const handleProductClick = useCallback(() => {
    onProductClick(product);
  }, [onProductClick, product]);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      onAddToCart(product);
    },
    [onAddToCart, product]
  );

  return (
    <div
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-purple-300 hover:shadow-xl"
      role="article"
      aria-label={`Product: ${product.title}`}
    >
      {/* Product Image */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden"
        style={{ backgroundColor: 'oklch(82.7% 0.119 306.383)' }}
        onClick={handleProductClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick();
          }
        }}
        aria-label={`View ${product.title} details`}
      >
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* Badges Container - Top with flex-wrap */}
        <div className="absolute top-2 right-2 left-2 flex flex-wrap gap-1" aria-live="polite">
          {/* Featured Badge */}
          {product.featured && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm sm:text-sm"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.95)' }}
            >
              ⭐ Featured
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && discountPercentage && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm sm:text-sm"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.95)' }}
              aria-label={`${discountPercentage}% discount`}
            >
              -{discountPercentage}%
            </div>
          )}

          {/* Out of Stock Badge */}
          {stockStatus.isOutOfStock && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm sm:text-sm"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.95)' }}
              aria-label="Out of stock"
            >
              Out of Stock
            </div>
          )}

          {/* On Backorder Badge */}
          {stockStatus.isOnBackorder && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm sm:text-sm"
              style={{ backgroundColor: 'rgba(251, 146, 60, 0.95)' }}
              aria-label="On backorder"
            >
              On Backorder
            </div>
          )}
        </div>

        {/* View Product Button - Shown on hover, accessible via keyboard */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={handleProductClick}
            aria-label={`View details for ${product.title}`}
            className="min-h-[44px] cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-purple-600 shadow-lg transition-all duration-200 hover:bg-purple-600 hover:text-white focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none active:scale-95 sm:px-6 sm:py-2.5 sm:text-base"
          >
            View Product
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        {/* Product Title - Now a clickable link */}
        <button
          onClick={handleProductClick}
          className="mb-1 line-clamp-2 text-left text-sm font-semibold text-gray-900 transition-colors duration-200 hover:text-purple-600 focus:underline focus:outline-none sm:text-base"
          aria-label={`View ${product.title}`}
        >
          {product.title}
        </button>

        {/* Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            {hasDiscount && prices.primary ? (
              <>
                {prices.secondary && (
                  <span
                    className="text-xs text-gray-400 line-through"
                    aria-label={`Original price ${prices.secondary}`}
                  >
                    {prices.secondary}
                  </span>
                )}
                <span
                  className="text-base font-bold text-purple-600 sm:text-lg"
                  aria-label={`Sale price ${prices.primary}`}
                >
                  {prices.primary}
                </span>
              </>
            ) : (
              <span
                className="text-base font-bold text-gray-900 sm:text-lg"
                aria-label={`Price ${prices.primary}`}
              >
                {prices.primary}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || stockStatus.isOutOfStock}
            className="relative z-10 flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-purple-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.5)] transition-all duration-300 hover:scale-110 hover:bg-purple-700 hover:shadow-[0_8px_20px_rgba(124,58,237,0.6)] focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            aria-label={`Add ${product.title} to cart`}
            title={stockStatus.isOutOfStock ? 'Out of stock' : `Add ${product.title} to cart`}
          >
            {isAddingToCart ? (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-label="Adding to cart"
              />
            ) : (
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isAddingToCart === nextProps.isAddingToCart &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.salePrice === nextProps.product.salePrice &&
    prevProps.product.stockStatus === nextProps.product.stockStatus
  );
});

ProductCard.displayName = 'ProductCard';
