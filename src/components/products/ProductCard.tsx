import { ShoppingCart } from '@/components/icons';
import React from 'react';
import type { Product } from '../../types';

const parsePriceToNumber = (value?: string | null): number | undefined => {
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
};

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAddingToCart: boolean;
  calculateDiscountPercentage?: (regularPrice: string, salePrice: string) => number | null;
  formatPrice: (value?: string | null) => string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onAddToCart,
  isAddingToCart,
  calculateDiscountPercentage,
  formatPrice,
}) => {
  const regularNumeric = parsePriceToNumber(product.regularPrice ?? product.price);
  const saleNumeric = parsePriceToNumber(product.salePrice);
  const hasDiscount =
    saleNumeric !== undefined && regularNumeric !== undefined && saleNumeric < regularNumeric;

  const discountPercentage =
    hasDiscount && calculateDiscountPercentage && product.regularPrice && product.salePrice
      ? calculateDiscountPercentage(product.regularPrice, product.salePrice)
      : null;

  const formattedSalePrice = formatPrice(product.salePrice) || product.salePrice || '';
  const formattedRegularPrice = formatPrice(product.regularPrice) || product.regularPrice || '';
  const formattedBasePrice =
    formatPrice(product.price) ||
    product.price ||
    formattedSalePrice ||
    formattedRegularPrice ||
    '';

  const primaryPrice =
    (hasDiscount && formattedSalePrice ? formattedSalePrice : formattedBasePrice) ||
    formattedSalePrice ||
    formattedRegularPrice ||
    '—';

  const secondaryPrice =
    hasDiscount && formattedRegularPrice && formattedRegularPrice !== primaryPrice
      ? formattedRegularPrice
      : '';

  // Check stock status
  const isOutOfStock = product.stockStatus?.toLowerCase() === 'outofstock';
  const isOnBackorder = product.stockStatus?.toLowerCase() === 'onbackorder';

  return (
    <div className="group flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-purple-300 hover:shadow-xl">
      {/* Product Image */}
      <div
        className="relative aspect-square cursor-pointer overflow-hidden"
        style={{ backgroundColor: 'oklch(82.7% 0.119 306.383)' }}
        onClick={() => onProductClick(product)}
      >
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Badges Container - Top with flex-wrap */}
        <div className="absolute top-2 right-2 left-2 flex flex-wrap gap-1">
          {/* Featured Badge */}
          {product.featured && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.95)' }}
            >
              ⭐ Featured
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.95)' }}
            >
              {discountPercentage ? `-${discountPercentage}%` : 'Sale'}
            </div>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.95)' }}
            >
              Out of Stock
            </div>
          )}

          {/* On Backorder Badge */}
          {isOnBackorder && (
            <div
              className="rounded-full border border-white/30 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase shadow-md backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(251, 146, 60, 0.95)' }}
            >
              On Backorder
            </div>
          )}
        </div>

        {/* View Product Button - Shown on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            aria-label={`View details for ${product.title}`}
            className="min-h-[44px] cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-purple-600 shadow-lg transition-all duration-200 hover:bg-purple-600 hover:text-white sm:px-6 sm:py-2.5 sm:text-base"
          >
            View Product
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        {/* Product Title - Now a clickable link */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onProductClick(product);
          }}
          className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:text-purple-600 sm:text-base"
        >
          {product.title}
        </a>

        {/* Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between">
          {/* Price */}
          <div className="flex items-center gap-2">
            {hasDiscount && primaryPrice ? (
              <>
                {secondaryPrice && (
                  <span className="text-xs text-gray-400 line-through">{secondaryPrice}</span>
                )}
                <span className="text-base font-bold text-purple-600 sm:text-lg">
                  {primaryPrice}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-gray-900 sm:text-lg">{primaryPrice}</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isAddingToCart}
            className="relative z-10 flex h-11 min-h-[44px] w-11 min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-full bg-purple-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.5)] transition-all duration-300 hover:scale-110 hover:bg-purple-700 hover:shadow-[0_8px_20px_rgba(124,58,237,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Add ${product.title} to cart`}
            title={`Add ${product.title} to cart`}
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
