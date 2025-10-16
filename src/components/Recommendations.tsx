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
}

const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  handleProductClick,
  calculateDiscountPercentage,
  addingToCart,
  handleAddToCart,
}) => {
  if (recommendations.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-foreground mb-4 text-[18px] font-bold lg:text-[20px]">
          Recommendations
        </h3>
        <div className="grid w-full grid-cols-2 gap-[8px] sm:grid-cols-2 sm:gap-[16px] xl:grid-cols-3 2xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="bg-background border-border flex w-full flex-col rounded-lg border p-[8px] sm:p-[12px]"
            >
              <Skeleton className="mb-[8px] h-[112px] w-full rounded-md sm:h-[144px]" />
              <Skeleton className="mb-[4px] h-[20px] w-3/4 sm:mb-[8px]" />
              <Skeleton className="h-[16px] w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-foreground mb-4 text-[18px] font-bold lg:text-[20px]">Recommendations</h3>
      <div className="grid w-full grid-cols-2 gap-[8px] sm:grid-cols-2 sm:gap-[16px] xl:grid-cols-3 2xl:grid-cols-4">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            isAddingToCart={addingToCart === product.id}
            calculateDiscountPercentage={calculateDiscountPercentage}
          />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
