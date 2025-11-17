/**
 * ColorFilter Component
 * Color selection with color circles
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export interface ColorFilterProps {
  // Data
  colors: string[];
  selectedColors: string[];

  // Callbacks
  onColorChange: (color: string) => void;

  // State
  isLoading?: boolean;
  disabled?: boolean;

  // Display
  emptyMessage?: string;
}

export const ColorFilter: React.FC<ColorFilterProps> = ({
  colors,
  selectedColors,
  onColorChange,
  isLoading = false,
  disabled = false,
  emptyMessage = 'No colors available',
}) => {
  return (
    <AccordionItem value="color">
      <AccordionTrigger className="text-foreground text-[14px] lg:text-[15px]">
        <b>Color</b>
      </AccordionTrigger>
      <AccordionContent>
        {isLoading ? (
          // Loading skeleton
          <div className="flex gap-[8px]">
            {[...Array(5)].map((_, idx) => (
              <Skeleton key={idx} className="h-6 w-6 rounded-full lg:h-8 lg:w-8" />
            ))}
          </div>
        ) : colors.length > 0 ? (
          // Color circles
          <div className="flex flex-wrap gap-[6px]">
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => {
                  if (!disabled) onColorChange(color);
                }}
                disabled={disabled}
                className={`h-8 min-h-[44px] w-8 min-w-[44px] cursor-pointer touch-manipulation rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10 ${
                  selectedColors.includes(color)
                    ? 'border-primary scale-110'
                    : 'border-border hover:scale-105 active:scale-95'
                }`}
                data-color={color.toLowerCase()}
                title={`Filter by ${color} color`}
                aria-label={`Filter by ${color} color`}
                aria-pressed={selectedColors.includes(color) ? 'true' : 'false'}
              />
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
