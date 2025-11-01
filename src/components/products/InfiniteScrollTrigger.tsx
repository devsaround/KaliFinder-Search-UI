/**
 * InfiniteScrollTrigger Component
 * Mobile infinite scroll trigger with loading animation
 */

import React from 'react';

export interface InfiniteScrollTriggerProps {
  isLoading?: boolean;
  remainingCount: number;
  triggerRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

export const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  isLoading = false,
  remainingCount,
  triggerRef,
  className = '',
}) => {
  return (
    <div ref={triggerRef} id="load-more-trigger" className={`my-4 h-16 w-full ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2">
            <div className="flex space-x-2">
              <div className="animate-bounce-delay-0 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
              <div className="animate-bounce-delay-150 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
              <div className="animate-bounce-delay-300 bg-primary h-2 w-2 animate-bounce rounded-full"></div>
            </div>
            <span className="text-muted-foreground text-sm">
              Loading {remainingCount} more products...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
