import React from 'react';
import { ShoppingCart } from '@/components/icons';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAddingToCart: boolean;
  calculateDiscountPercentage?: (regularPrice: string, salePrice: string) => number | null;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onAddToCart,
  isAddingToCart,
  calculateDiscountPercentage,
}) => {
  const hasDiscount =
    product.salePrice &&
    product.salePrice !== '' &&
    product.salePrice !== '0' &&
    product.salePrice !== '0.00' &&
    product.regularPrice &&
    parseFloat(product.salePrice) < parseFloat(product.regularPrice);

  const discountPercentage =
    hasDiscount && calculateDiscountPercentage && product.regularPrice && product.salePrice
      ? calculateDiscountPercentage(product.regularPrice, product.salePrice)
      : null;

  return (
    <div
      onClick={() => onProductClick(product)}
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-purple-300 hover:shadow-xl"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-2 right-2 rounded-lg border border-white/30 bg-gradient-to-br from-blue-500/95 to-purple-600/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_16px_rgba(0,0,0,0.3)] backdrop-blur-md sm:px-3 sm:text-xs">
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">⭐ Featured</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 rounded-lg border border-white/30 bg-gradient-to-br from-red-500/95 to-pink-600/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_8px_16px_rgba(0,0,0,0.3)] backdrop-blur-md sm:px-3 sm:text-xs">
            <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{discountPercentage ? `-${discountPercentage}%` : 'Sale'}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        {/* Product Title */}
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-gray-900 sm:text-base">
          {product.title}
        </h3>

        {/* Price and Add to Cart */}
        <div className="mt-auto flex items-center justify-between">
          {/* Price */}
          <div className="flex flex-col gap-0.5">
            {hasDiscount ? (
              <>
                <span className="text-base font-bold text-purple-600 sm:text-lg">
                  {product.salePrice}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {product.regularPrice}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-gray-900 sm:text-lg">{product.price}</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isAddingToCart}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Add ${product.title} to cart`}
            title={`Add ${product.title} to cart`}
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
