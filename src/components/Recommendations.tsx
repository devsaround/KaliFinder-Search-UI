import React from 'react';
import type { Product } from '../types';
import { ShoppingCart } from 'lucide-react';

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
      <div className="!w-full !py-[48px] !text-center">
        <p className="!text-muted-foreground text-[16px] lg:text-[18px]">
          Loading recommendations...
        </p>
      </div>
    );
  }

  return (
    <div className="!mb-8">
      <h3 className="!text-foreground !mb-4 !text-[18px] !font-bold lg:!text-[20px]">
        Recommendations
      </h3>
      <div className="!grid !w-full !grid-cols-2 !gap-[8px] sm:!grid-cols-2 sm:!gap-[16px] xl:grid-cols-3 2xl:!grid-cols-4">
        {recommendations.map((product) => (
          <div
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="!bg-background !border-border group !flex !w-full !cursor-pointer !flex-col !rounded-lg !border !p-[8px] !transition-shadow hover:!shadow-lg sm:!p-[12px]"
          >
            <div className="!relative !mb-[8px] overflow-hidden">
              <img
                src={product.imageUrl || product.image}
                alt={product.title}
                className="!h-[112px] !w-full !rounded-md !object-cover !transition-transform !duration-300 group-hover:!scale-105 sm:!h-[144px]"
              />
              {product.featured && (
                <div className="!bg-primary !text-primary-foreground !absolute !top-2 !right-2 !rounded-full !px-2 !py-1 !text-xs !font-bold">
                  Featured
                </div>
              )}
              {product.salePrice &&
                product.salePrice !== '' &&
                product.salePrice !== '0' &&
                product.salePrice !== '0.00' &&
                product.regularPrice &&
                product.salePrice !== product.regularPrice &&
                (() => {
                  const discountPercentage = calculateDiscountPercentage(
                    product.regularPrice,
                    product.salePrice
                  );
                  return discountPercentage ? (
                    <div className="!absolute !top-2 !left-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                      -{discountPercentage}%
                    </div>
                  ) : (
                    <div className="!absolute !top-2 !left-2 !rounded-full !bg-red-500 !px-2 !py-1 !text-xs !font-bold !text-white">
                      Sale
                    </div>
                  );
                })()}
            </div>
            <h3 className="!text-foreground !mb-[4px] h-[40px] overflow-hidden !text-[14px] !font-bold sm:!mb-[8px] sm:h-[48px] sm:!text-[16px]">
              {product.title}
            </h3>
            <div className="mt-auto !flex !items-center !justify-between">
              <div className="!flex !items-center !gap-[8px]">
                {product.salePrice &&
                product.salePrice !== '' &&
                product.salePrice !== '0' &&
                product.salePrice !== '0.00' &&
                product.regularPrice &&
                product.salePrice !== product.regularPrice ? (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-primary !text-[14px] !font-bold sm:!text-[16px]">
                      {product.salePrice}
                    </span>
                    <span className="!text-muted-foreground !text-[12px] !line-through sm:!text-[14px]">
                      {product.regularPrice}
                    </span>
                  </div>
                ) : (
                  <span className="!text-muted-foreground !text-[12px] sm:!text-[14px]">
                    {product.price}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                disabled={addingToCart === product.id}
                className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !transform !rounded-md !p-[6px] !transition-colors !duration-200 group-hover:!scale-110 disabled:!cursor-not-allowed disabled:!opacity-50 sm:!p-[8px]"
              >
                {addingToCart === product.id ? (
                  <div className="!border-primary-foreground !h-[12px] !w-[12px] !animate-spin !rounded-full !border-2 !border-t-transparent sm:!h-[16px] sm:!w-[16px]"></div>
                ) : (
                  <ShoppingCart className="!h-[12px] !w-[12px] sm:!h-[16px] sm:!w-[16px]" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
