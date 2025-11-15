/**
 * ColorFilter Component
 * Color selection with color circles
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

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
      <AccordionTrigger className="text-foreground text-[16px] lg:text-[18px]">
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
          <div className="flex flex-wrap gap-[8px]">
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => {
                  if (!disabled) onColorChange(color);
                }}
                disabled={disabled}
                className={`h-8 min-h-[44px] w-8 min-w-[44px] rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10 ${
                  selectedColors.includes(color)
                    ? 'border-primary scale-110'
                    : 'border-border hover:scale-105'
                }`}
                data-color={color.toLowerCase()}
                title={`Filter by color`}
                aria-label={`Filter by color`}
                // This is the updated line
                aria-pressed={selectedColors.includes(color)}
                style={{
                  backgroundColor: color.toLowerCase(),
                }}
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
