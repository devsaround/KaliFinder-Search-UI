/**
 * CheckboxFilter Component
 * Reusable checkbox filter with counts
 * Used for: Categories, Brands, Tags, Stock Status, etc.
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export interface CheckboxFilterProps {
  // Identification
  id: string;
  title: string;

  // Data
  items: string[];
  selectedItems: string[];
  itemCounts?: Record<string, number>;

  // Callbacks
  onItemChange: (item: string) => void;

  // State
  isLoading?: boolean;
  disabled?: boolean;

  // Display
  emptyMessage?: string;
  showCounts?: boolean;
}

export const CheckboxFilter: React.FC<CheckboxFilterProps> = ({
  id,
  title,
  items,
  selectedItems,
  itemCounts = {},
  onItemChange,
  isLoading = false,
  disabled = false,
  emptyMessage = 'No items available',
  showCounts = true,
}) => {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="text-foreground text-[14px] lg:text-[15px]">
        <b>{title}</b>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-[4px]">
          {isLoading ? (
            // Loading skeleton
            <>
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-[10px]">
                    <Skeleton className="h-4 w-4 lg:h-5 lg:w-5" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  {showCounts && <Skeleton className="h-3 w-8" />}
                </div>
              ))}
            </>
          ) : items.length > 0 ? (
            // Items list
            items.map((item) => (
              <label key={item} className="flex cursor-pointer items-center justify-between py-0.5">
                <div className="flex items-center gap-[6px]">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item)}
                    onChange={() => onItemChange(item)}
                    disabled={disabled}
                    className="text-primary bg-background border-border h-3.5 w-3.5 rounded disabled:cursor-not-allowed disabled:opacity-50 lg:h-4 lg:w-4"
                  />
                  <span className="text-foreground text-[13px] lg:text-[14px]">{item}</span>
                </div>
                {showCounts && (
                  <span className="text-muted-foreground mr-[4px] text-[11px] lg:text-[12px]">
                    {itemCounts[item] || 0}
                  </span>
                )}
              </label>
            ))
          ) : (
            // Empty state
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
