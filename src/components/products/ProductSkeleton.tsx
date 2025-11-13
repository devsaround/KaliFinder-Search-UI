/**
 * ProductSkeleton Component
 * Loading skeleton for product cards
 */

import React from 'react';

export interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse-slow bg-loading rounded-lg p-2 md:p-4">
          <div className="bg-loading-shimmer relative mb-3 h-32 overflow-hidden rounded-md md:mb-4 md:h-48">
            <div className="animate-shimmer via-loading-shimmer absolute inset-0 bg-gradient-to-r from-transparent to-transparent"></div>
          </div>
          <div className="bg-loading-shimmer mb-2 h-4 rounded"></div>
          <div className="bg-loading-shimmer h-6 w-20 rounded"></div>
        </div>
      ))}
    </div>
  );
};
