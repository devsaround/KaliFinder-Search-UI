import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="kf:bg-background kf:border-border kf:flex kf:w-full kf:flex-col kf:rounded-lg kf:border kf:p-[8px] kf:sm:p-[12px]">
      {/* Image Skeleton */}
      <Skeleton className="kf:mb-[8px] kf:h-[112px] kf:w-full kf:rounded-md kf:sm:h-[144px]" />

      {/* Title Skeleton */}
      <Skeleton className="kf:mb-[4px] kf:h-[20px] kf:w-3/4 kf:sm:mb-[8px]" />
      <Skeleton className="kf:mb-[8px] kf:h-[16px] kf:w-1/2" />

      {/* Price Skeleton */}
      <div className="kf:mt-auto kf:flex kf:items-center kf:justify-between">
        <Skeleton className="kf:h-[16px] kf:w-1/3" />
        <Skeleton className="kf:h-[24px] kf:w-[24px] kf:rounded-md kf:sm:h-[32px] kf:sm:w-[32px]" />
      </div>
    </div>
  );
};
