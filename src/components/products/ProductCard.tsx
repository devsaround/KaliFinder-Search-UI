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
      className="kf:bg-background kf:border-border kf:group kf:flex kf:w-full kf:cursor-pointer kf:flex-col kf:rounded-lg kf:border kf:p-[8px] kf:transition-shadow kf:hover:shadow-lg kf:sm:p-[12px]"
    >
      {/* Product Image */}
      <div className="kf:relative kf:mb-[8px] kf:overflow-hidden">
        <img
          src={product.imageUrl || product.image}
          alt={product.title}
          className="kf:h-[112px] kf:w-full kf:rounded-md kf:object-cover kf:transition-transform kf:duration-300 kf:group-hover:scale-105 kf:sm:h-[144px]"
          loading="lazy"
        />

        {/* Featured Badge */}
        {product.featured && (
          <div className="kf:bg-primary kf:text-primary-foreground kf:absolute kf:top-2 kf:right-2 kf:rounded-full kf:px-2 kf:py-1 kf:text-xs kf:font-bold">
            Featured
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="kf:absolute kf:top-2 kf:left-2 kf:rounded-full kf:bg-red-500 kf:px-2 kf:py-1 kf:text-xs kf:font-bold kf:text-white">
            {discountPercentage ? `-${discountPercentage}%` : 'Sale'}
          </div>
        )}
      </div>

      {/* Product Title */}
      <h3 className="kf:text-foreground kf:mb-[4px] kf:h-[40px] kf:overflow-hidden kf:text-[14px] kf:font-bold kf:sm:mb-[8px] kf:sm:h-[48px] kf:sm:text-[16px]">
        {product.title}
      </h3>

      {/* Price and Add to Cart */}
      <div className="kf:mt-auto kf:flex kf:items-center kf:justify-between">
        {/* Price */}
        <div className="kf:flex kf:items-center kf:gap-[8px]">
          {hasDiscount ? (
            <div className="kf:flex kf:items-center kf:gap-2">
              <span className="kf:text-primary kf:text-[14px] kf:font-bold kf:sm:text-[16px]">
                {product.salePrice}
              </span>
              <span className="kf:text-muted-foreground kf:text-[12px] kf:line-through kf:sm:text-[14px]">
                {product.regularPrice}
              </span>
            </div>
          ) : (
            <span className="kf:text-muted-foreground kf:text-[12px] kf:sm:text-[14px]">
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
          className="kf:bg-primary kf:text-primary-foreground kf:hover:bg-primary-hover kf:transform kf:rounded-md kf:p-[6px] kf:transition-colors kf:duration-200 kf:group-hover:scale-110 kf:disabled:cursor-not-allowed kf:disabled:opacity-50 kf:sm:p-[8px]"
          aria-label={`Add ${product.title} to cart`}
          title={`Add ${product.title} to cart`}
        >
          {isAddingToCart ? (
            <div className="kf:border-primary-foreground kf:h-[12px] kf:w-[12px] kf:animate-spin kf:rounded-full kf:border-2 kf:border-t-transparent kf:sm:h-[16px] kf:sm:w-[16px]" />
          ) : (
            <ShoppingCart className="h-[12px] w-[12px] sm:h-[16px] sm:w-[16px]" />
          )}
        </button>
      </div>
    </div>
  );
};
