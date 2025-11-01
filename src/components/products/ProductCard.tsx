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
      className="group flex w-full cursor-pointer flex-col rounded-lg border border-gray-200 bg-white p-2 transition-shadow hover:shadow-lg sm:p-3"
    >
      {/* Product Image */}
      <div className="relative mb-2 overflow-hidden">
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-28 w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-105 sm:h-36"
          loading="lazy"
        />

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-2 right-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">
            Featured
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            {discountPercentage ? `-${discountPercentage}%` : 'Sale'}
          </div>
        )}
      </div>

      {/* Product Title */}
      <h3 className="mb-1 h-10 overflow-hidden text-sm font-bold text-gray-900 sm:mb-2 sm:h-12 sm:text-base">
        {product.title}
      </h3>

      {/* Price and Add to Cart */}
      <div className="mt-auto flex items-center justify-between">
        {/* Price */}
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-600 sm:text-base">
                {product.salePrice}
              </span>
              <span className="text-xs text-gray-500 line-through sm:text-sm">
                {product.regularPrice}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-600 sm:text-sm">{product.price}</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          disabled={isAddingToCart}
          className="transform rounded-md bg-blue-500 p-1.5 text-white transition-colors duration-200 group-hover:scale-110 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2"
          aria-label={`Add ${product.title} to cart`}
          title={`Add ${product.title} to cart`}
        >
          {isAddingToCart ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4" />
          ) : (
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </button>
      </div>
    </div>
  );
};
