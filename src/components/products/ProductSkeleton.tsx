import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="!bg-background !border-border !flex !w-full !flex-col !rounded-lg !border !p-[8px] sm:!p-[12px]">
      {/* Image Skeleton */}
      <Skeleton className="!mb-[8px] !h-[112px] !w-full !rounded-md sm:!h-[144px]" />

      {/* Title Skeleton */}
      <Skeleton className="!mb-[4px] !h-[20px] !w-3/4 sm:!mb-[8px]" />
      <Skeleton className="!mb-[8px] !h-[16px] !w-1/2" />

      {/* Price Skeleton */}
      <div className="mt-auto !flex !items-center !justify-between">
        <Skeleton className="!h-[16px] !w-1/3" />
        <Skeleton className="!h-[24px] !w-[24px] !rounded-md sm:!h-[32px] sm:!w-[32px]" />
      </div>
    </div>
  );
};
