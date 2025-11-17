/**
 * SizeFilter Component
 * Size selection with button grid
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export interface SizeFilterProps {
  // Data
  sizes: string[];
  selectedSizes: string[];

  // Callbacks
  onSizeChange: (size: string) => void;

  // State
  isLoading?: boolean;
  disabled?: boolean;

  // Display
  emptyMessage?: string;
  columns?: 4 | 5 | 6;
}

export const SizeFilter: React.FC<SizeFilterProps> = ({
  sizes,
  selectedSizes,
  onSizeChange,
  isLoading = false,
  disabled = false,
  emptyMessage = 'No sizes available',
  columns = 4,
}) => {
  const gridClass = columns === 4 ? 'grid-cols-4' : columns === 5 ? 'grid-cols-5' : 'grid-cols-6';

  return (
    <AccordionItem value="size">
      <AccordionTrigger className="text-foreground text-[14px] lg:text-[15px]">
        <b>Size</b>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          // Loading skeleton
          <div className={`grid ${gridClass} gap-2`}>
            {[...Array(columns)].map((_, idx) => (
              <Skeleton key={idx} className="h-8 w-full" />
            ))}
          </div>
        ) : sizes.length > 0 ? (
          // Size grid
          <div className={`grid ${gridClass} gap-2`}>
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  if (!disabled) onSizeChange(size);
                }}
                disabled={disabled}
                className={`my-border rounded py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm ${
                  selectedSizes.includes(size)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        ) : (
          // Empty state
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};
