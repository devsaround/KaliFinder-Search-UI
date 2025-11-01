/**
 * PriceFilter Component
 * Price range slider filter
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export interface PriceFilterProps {
  // Range
  priceRange: [number, number];
  maxPrice: number;

  // Callbacks
  onPriceChange: (range: [number, number]) => void;

  // State
  disabled?: boolean;

  // Display
  currency?: string;
}

export const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  maxPrice,
  onPriceChange,
  disabled = false,
  currency = '€',
}) => {
  const handleSliderChange = (value: number[]) => {
    if (disabled) return;
    onPriceChange([priceRange[0], value[0] ?? maxPrice]);
  };

  return (
    <AccordionItem value="price">
      <AccordionTrigger className="text-foreground text-[16px] lg:text-[18px]">
        <b>Price</b>
      </AccordionTrigger>
      <AccordionContent>
        <Slider
          value={[priceRange[1]]}
          onValueChange={handleSliderChange}
          max={maxPrice}
          step={1}
          disabled={disabled}
          className="mt-2 mb-4 w-full"
          style={{ opacity: disabled ? 0.6 : 1 }}
        />
        <div className="text-muted-foreground flex justify-between text-[12px] lg:text-[14px]">
          <span>
            {priceRange[0]} {currency}
          </span>
          <span>
            {priceRange[1]} {currency}
          </span>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
