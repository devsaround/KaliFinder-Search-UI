/**
 * EmptyState Component
 * Displays user-friendly empty states for search results
 */

import { Search } from '@/components/icons';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No results found',
  description = "Try adjusting your search or filters to find what you're looking for",
  icon,
  action,
  suggestions = [],
  onSuggestionClick,
}) => {
  return (
    <div className="flex min-h-[400px] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
            {icon || <Search className="text-muted-foreground h-10 w-10" aria-hidden="true" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-foreground mb-3 text-xl font-bold md:text-2xl">{title}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 text-base leading-relaxed md:text-lg">
          {description}
        </p>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-foreground mb-3 text-sm font-semibold">Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="bg-muted hover:bg-primary/10 text-foreground hover:ring-primary/20 focus-visible:ring-primary min-h-[44px] cursor-pointer touch-manipulation rounded-full px-4 py-2 text-sm font-medium transition-all hover:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                  aria-label={`Search for ${suggestion}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
            aria-label={action.label}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
