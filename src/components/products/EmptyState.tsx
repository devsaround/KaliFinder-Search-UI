import { Search } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  query?: string;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  query,
  title = 'Search not found',
  description = 'No products found matching your criteria. Try different keywords or browse our categories.',
}) => {
  return (
    <div className="!animate-in !fade-in !w-full !py-[48px] !text-center !duration-300">
      <div className="!flex !flex-col !items-center !gap-4">
        {/* Icon */}
        <div className="!bg-muted !animate-in !zoom-in !flex !h-16 !w-16 !items-center !justify-center !rounded-full !duration-500">
          <Search className="!text-muted-foreground !h-8 !w-8" />
        </div>

        {/* Text Content */}
        <div className="!animate-in !slide-in-from-bottom-2 !duration-500">
          <p className="!text-foreground !mb-2 !text-[18px] !font-semibold lg:!text-[20px]">
            {title}
          </p>
          <p className="!text-muted-foreground !text-[14px] lg:!text-[16px]">
            {query ? `No results for "${query}". ${description}` : description}
          </p>
        </div>
      </div>
    </div>
  );
};
