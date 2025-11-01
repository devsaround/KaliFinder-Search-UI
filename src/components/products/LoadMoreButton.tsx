/**
 * LoadMoreButton Component
 * Desktop load more button with remaining count
 */

import React from 'react';

export interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  remainingCount: number;
  disabled?: boolean;
  className?: string;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  isLoading = false,
  remainingCount,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`mt-8 flex justify-center ${className}`}>
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg px-8 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : `Load More (${remainingCount} more)`}
      </button>
    </div>
  );
};
