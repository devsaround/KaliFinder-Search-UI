import React from 'react';
import { Product } from '../types';
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
      <div className="!text-center !py-[48px] !w-full">
        <p className="!text-muted-foreground text-[16px] lg:text-[18px]">
          Loading recommendations...
        </p>
      </div>
    );
  }

  return (
    <div className="!mb-8">
      <h3 className="!text-[18px] lg:!text-[20px] !font-bold !text-foreground !mb-4">
        Recommendations
      </h3>
      <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[8px] sm:!gap-[16px] !w-full">
        {recommendations.map((product) => (
          <div
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="!bg-background !border !border-border !rounded-lg !p-[8px] sm:!p-[12px] hover:!shadow-lg !transition-shadow !w-full !flex !flex-col group !cursor-pointer"
          >
            <div className="!relative !mb-[8px] overflow-hidden">
              <img
                src={product.imageUrl || product.image}
                alt={product.title}
                className="!w-full !h-[112px] sm:!h-[144px] !object-cover !rounded-md group-hover:!scale-105 !transition-transform !duration-300"
              />
              {product.featured && (
                <div className="!absolute !top-2 !right-2 !bg-primary !text-primary-foreground !px-2 !py-1 !rounded-full !text-xs !font-bold">
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
                    <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                      -{discountPercentage}%
                    </div>
                  ) : (
                    <div className="!absolute !top-2 !left-2 !bg-red-500 !text-white !px-2 !py-1 !rounded-full !text-xs !font-bold">
                      Sale
                    </div>
                  );
                })()}
            </div>
            <h3 className="!text-[14px] sm:!text-[16px] !font-bold !text-foreground !mb-[4px] sm:!mb-[8px] h-[40px] sm:h-[48px] overflow-hidden">
              {product.title}
            </h3>
            <div className="!flex !items-center !justify-between mt-auto">
              <div className="!flex !items-center !gap-[8px]">
                {product.salePrice &&
                product.salePrice !== '' &&
                product.salePrice !== '0' &&
                product.salePrice !== '0.00' &&
                product.regularPrice &&
                product.salePrice !== product.regularPrice ? (
                  <div className="!flex !items-center !gap-2">
                    <span className="!text-primary !text-[14px] sm:!text-[16px] !font-bold">
                      {product.salePrice}
                    </span>
                    <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !line-through">
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
                className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-[6px] sm:!p-[8px] !rounded-md !transition-colors group-hover:!scale-110 !transform !duration-200 disabled:!opacity-50 disabled:!cursor-not-allowed"
              >
                {addingToCart === product.id ? (
                  <div className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px] !border-2 !border-primary-foreground !border-t-transparent !rounded-full !animate-spin"></div>
                ) : (
                  <ShoppingCart className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px]" />
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
