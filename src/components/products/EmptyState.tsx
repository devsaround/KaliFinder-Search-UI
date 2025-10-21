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
    <div className="kf:animate-in kf:fade-in kf:w-full kf:py-[48px] kf:text-center kf:duration-300">
      <div className="kf:flex kf:flex-col kf:items-center kf:gap-4">
        {/* Icon */}
        <div className="kf:bg-muted kf:animate-in kf:zoom-in kf:flex kf:h-16 kf:w-16 kf:items-center kf:justify-center kf:rounded-full kf:duration-500">
          <Search className="kf:text-muted-foreground kf:h-8 kf:w-8" />
        </div>

        {/* Text Content */}
        <div className="kf:animate-in kf:slide-in-from-bottom-2 kf:duration-500">
          <p className="kf:text-foreground kf:mb-2 kf:text-[18px] kf:font-semibold kf:lg:text-[20px]">
            {title}
          </p>
          <p className="kf:text-muted-foreground kf:text-[14px] kf:lg:text-[16px]">
            {query ? `No results for "${query}". ${description}` : description}
          </p>
        </div>
      </div>
    </div>
  );
};
