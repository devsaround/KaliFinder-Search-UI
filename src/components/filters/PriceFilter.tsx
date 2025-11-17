/**
 * PriceFilter Component
 * Price range slider filter with improved UI
 */

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';

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
    // Handle dual range: [min, max]
    const newMin = value[0] ?? 0;
    const newMax = value[1] ?? maxPrice;
    onPriceChange([newMin, newMax]);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Math.max(0, Math.min(Number(e.target.value), priceRange[1]));
    onPriceChange([value, priceRange[1]]);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = Math.max(priceRange[0], Math.min(Number(e.target.value), maxPrice));
    onPriceChange([priceRange[0], value]);
  };

  return (
    <AccordionItem value="price">
      <AccordionTrigger className="text-foreground text-[14px] font-semibold lg:text-[15px]">
        Price Range
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pt-1">
        {/* Price Input Fields */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label
              htmlFor="min-price"
              className="text-muted-foreground mb-1 block text-xs font-medium"
            >
              Min
            </label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                {currency}
              </span>
              <input
                id="min-price"
                type="number"
                value={priceRange[0]}
                onChange={handleMinPriceChange}
                disabled={disabled}
                min={0}
                max={priceRange[1]}
                title={`Minimum price in ${currency}`}
                placeholder={`Enter minimum price (${currency})`}
                className="border-border text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-white py-1.5 pr-2 pl-7 text-xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="max-price"
              className="text-muted-foreground mb-1 block text-xs font-medium"
            >
              Max
            </label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                {currency}
              </span>
              <input
                id="max-price"
                type="number"
                value={priceRange[1]}
                onChange={handleMaxPriceChange}
                disabled={disabled}
                min={priceRange[0]}
                max={maxPrice}
                title={`Maximum price in ${currency}`}
                placeholder={`Enter maximum price (${currency})`}
                className="border-border text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-md border bg-white py-1.5 pr-2 pl-7 text-xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="px-1 py-1">
          <Slider
            value={[priceRange[0], priceRange[1]]}
            onValueChange={handleSliderChange}
            max={maxPrice}
            min={0}
            step={1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Price Range Display */}
        <div className="bg-muted/30 rounded-md p-2">
          <div className="text-muted-foreground mb-0.5 text-[10px] font-medium">Selected Range</div>
          <div className="text-foreground text-xs font-semibold">
            {priceRange[0]} {currency} — {priceRange[1]} {currency}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
