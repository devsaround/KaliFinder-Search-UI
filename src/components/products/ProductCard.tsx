import { ShoppingCart } from 'lucide-react';
import React from 'react';
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
      className="bg-background border-border group flex w-full cursor-pointer flex-col rounded-lg border p-[8px] transition-shadow hover:shadow-lg sm:p-[12px]"
    >
      {/* Product Image */}
      <div className="relative mb-[8px] overflow-hidden">
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="h-[112px] w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-105 sm:h-[144px]"
          loading="lazy"
        />

        {/* Featured Badge */}
        {product.featured && (
          <div className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-bold">
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
      <h3 className="text-foreground mb-[4px] h-[40px] overflow-hidden text-[14px] font-bold sm:mb-[8px] sm:h-[48px] sm:text-[16px]">
        {product.title}
      </h3>

      {/* Price and Add to Cart */}
      <div className="mt-auto flex items-center justify-between">
        {/* Price */}
        <div className="flex items-center gap-[8px]">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-primary text-[14px] font-bold sm:text-[16px]">
                {product.salePrice}
              </span>
              <span className="text-muted-foreground text-[12px] line-through sm:text-[14px]">
                {product.regularPrice}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-[12px] sm:text-[14px]">
              {product.price}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          disabled={isAddingToCart}
          className="bg-primary text-primary-foreground hover:bg-primary-hover transform rounded-md p-[6px] transition-colors duration-200 group-hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 sm:p-[8px]"
          aria-label={`Add ${product.title} to cart`}
          title={`Add ${product.title} to cart`}
        >
          {isAddingToCart ? (
            <div className="border-primary-foreground h-[12px] w-[12px] animate-spin rounded-full border-2 border-t-transparent sm:h-[16px] sm:w-[16px]" />
          ) : (
            <ShoppingCart className="h-[12px] w-[12px] sm:h-[16px] sm:w-[16px]" />
          )}
        </button>
      </div>
    </div>
  );
};
