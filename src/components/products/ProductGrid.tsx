/**
 * ProductGrid Component
 * Main product grid with pagination/infinite scroll
 */

import React from 'react';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import { LoadMoreButton } from './LoadMoreButton';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';
import type { Product } from '@/types';

export interface ProductGridProps {
  // Products
  products: Product[];

  // Loading states
  isLoading?: boolean;
  isPending?: boolean;
  isLoadingMore?: boolean;

  // Pagination
  hasMoreProducts?: boolean;
  displayedProducts: number;
  totalProducts: number;
  onLoadMore?: () => void;

  // Mobile detection
  isMobile?: boolean;
  loadMoreTriggerRef?: React.RefObject<HTMLDivElement>;

  // Callbacks
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  calculateDiscountPercentage?: (regularPrice: string, salePrice: string) => number | null;

  // State
  addingToCart: string | null;

  // Display
  emptyMessage?: React.ReactNode;
  skeletonCount?: number;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  isPending = false,
  isLoadingMore = false,
  hasMoreProducts = false,
  displayedProducts,
  totalProducts,
  onLoadMore,
  isMobile = false,
  loadMoreTriggerRef,
  onProductClick,
  onAddToCart,
  calculateDiscountPercentage,
  addingToCart,
  emptyMessage,
  skeletonCount = 8,
  className = '',
}) => {
  const remainingCount = Math.min(12, totalProducts - displayedProducts);

  // Show loading skeleton
  if (isLoading || isPending) {
    return <ProductSkeleton count={skeletonCount} />;
  }

  // Show empty state
  if (products.length === 0) {
    if (emptyMessage) {
      return <>{emptyMessage}</>;
    }
    return null;
  }

  return (
    <div className={className}>
      {/* Product Grid */}
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            isAddingToCart={addingToCart === product.id}
            calculateDiscountPercentage={calculateDiscountPercentage}
          />
        ))}
      </div>

      {/* Mobile: Infinite Scroll Trigger */}
      {isMobile && hasMoreProducts && displayedProducts > 0 && !isLoading && (
        <InfiniteScrollTrigger
          isLoading={isLoadingMore}
          remainingCount={remainingCount}
          triggerRef={loadMoreTriggerRef}
        />
      )}

      {/* Desktop: Load More Button */}
      {!isMobile && hasMoreProducts && displayedProducts > 0 && !isLoading && onLoadMore && (
        <LoadMoreButton
          onClick={onLoadMore}
          isLoading={isLoadingMore}
          remainingCount={remainingCount}
        />
      )}
    </div>
  );
};
