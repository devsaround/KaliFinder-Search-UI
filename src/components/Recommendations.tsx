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
      <div className="kf:mb-8">
        <h3 className="kf:text-foreground kf:mb-4 kf:text-[18px] kf:font-bold kf:lg:text-[20px]">
          Recommendations
        </h3>
        <div className="kf:grid kf:w-full kf:grid-cols-2 kf:gap-[8px] kf:sm:grid-cols-2 kf:sm:gap-[16px] kf:xl:grid-cols-3 kf:2xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="kf:bg-background kf:border-border kf:flex kf:w-full kf:flex-col kf:rounded-lg kf:border kf:p-[8px] kf:sm:p-[12px]"
            >
              <Skeleton className="kf:mb-[8px] kf:h-[112px] kf:w-full kf:rounded-md kf:sm:h-[144px]" />
              <Skeleton className="kf:mb-[4px] kf:h-[20px] kf:w-3/4 kf:sm:mb-[8px]" />
              <Skeleton className="kf:h-[16px] kf:w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="kf:mb-8">
      <h3 className="kf:text-foreground kf:mb-4 kf:text-[18px] kf:font-bold kf:lg:text-[20px]">
        Recommendations
      </h3>
      <div className="kf:grid kf:w-full kf:grid-cols-2 kf:gap-[8px] kf:sm:grid-cols-2 kf:sm:gap-[16px] kf:xl:grid-cols-3 kf:2xl:grid-cols-4">
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
