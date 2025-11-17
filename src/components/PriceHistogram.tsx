/**
 * PriceHistogram Component
 * Visual representation of price distribution
 */

import { useMemo } from 'react';
import type { Product } from '../types';

interface PriceHistogramProps {
  products: Product[];
  priceRange: [number, number];
  maxPrice: number;
  bins?: number;
}

export const PriceHistogram: React.FC<PriceHistogramProps> = ({
  products,
  priceRange,
  maxPrice,
  bins = 10,
}) => {
  const histogram = useMemo(() => {
    if (products.length === 0) return [];

    const binSize = maxPrice / bins;
    const counts = new Array(bins).fill(0);

    products.forEach((product) => {
      const price = parseFloat(
        String(product.salePrice || product.price || '0').replace(/[^0-9.]/g, '')
      );
      if (price > 0 && price <= maxPrice) {
        const binIndex = Math.min(Math.floor(price / binSize), bins - 1);
        counts[binIndex]++;
      }
    });

    const maxCount = Math.max(...counts, 1);

    return counts.map((count, index) => ({
      count,
      percentage: (count / maxCount) * 100,
      rangeStart: Math.round(index * binSize),
      rangeEnd: Math.round((index + 1) * binSize),
      isInSelectedRange: (index + 1) * binSize >= priceRange[0] && index * binSize <= priceRange[1],
    }));
  }, [products, maxPrice, bins, priceRange]);

  if (histogram.length === 0 || histogram.every((bin) => bin.count === 0)) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Price Distribution</span>
        <span className="text-xs text-gray-500">{products.length} products</span>
      </div>

      {/* Histogram Bars */}
      <div className="flex h-16 items-end gap-0.5" role="img" aria-label="Price distribution chart">
        {histogram.map((bin, index) => (
          <div key={index} className="group relative flex-1" role="presentation">
            {/* Bar */}
            <div
              className={`w-full rounded-t transition-all ${
                bin.isInSelectedRange
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              style={{ height: `${bin.percentage}%` }}
              aria-label={`${bin.count} products between $${bin.rangeStart} and $${bin.rangeEnd}`}
            />

            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-lg bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg">
                <div className="font-semibold">{bin.count} products</div>
                <div className="text-gray-300">
                  ${bin.rangeStart} - ${bin.rangeEnd}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Labels */}
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>$0</span>
        <span>${Math.round(maxPrice / 2)}</span>
        <span>${maxPrice}</span>
      </div>
    </div>
  );
};

export default PriceHistogram;
