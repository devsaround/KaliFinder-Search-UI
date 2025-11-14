import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './products/ProductCard';

interface RecommendationsProps {
  recommendations: Product[];
  handleProductClick: (product: Product) => void;
  calculateDiscountPercentage: (regularPrice: string, salePrice: string) => number | null;
  addingToCart: string | null;
  handleAddToCart: (product: Product) => void;
  formatPrice: (value?: string | null) => string;
}

const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  handleProductClick,
  calculateDiscountPercentage,
  addingToCart,
  handleAddToCart,
  formatPrice,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="mb-12">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 sm:p-4">
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="mb-4 h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <h3 className="text-left text-2xl font-bold text-gray-900">Recommended for You</h3>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            isAddingToCart={addingToCart === product.id}
            calculateDiscountPercentage={calculateDiscountPercentage}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
