/**
 * Price Utilities - Centralized price parsing and formatting
 * Follows DRY principle, tested and optimized
 */

/**
 * Parse price string to number
 * Handles various formats: $1,234.56, 1.234,56, etc.
 */
export function parsePriceToNumber(value?: string | null): number | undefined {
  if (value === undefined || value === null) return undefined;

  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  // Remove currency symbols and other non-numeric characters except .,-
  const sanitized = trimmed.replace(/[^0-9.,-]/g, '');
  if (!sanitized) return undefined;

  const commaCount = (sanitized.match(/,/g) || []).length;
  const dotCount = (sanitized.match(/\./g) || []).length;

  let normalized = sanitized;

  // Handle European format (1.234,56)
  if (commaCount > 0 && dotCount === 0) {
    normalized = sanitized.replace(/,/g, '.');
  }
  // Handle mixed separators
  else if (commaCount > 0 && dotCount > 0) {
    // Last separator is decimal point
    if (sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')) {
      normalized = sanitized.replace(/\./g, '').replace(/,/g, '.');
    } else {
      normalized = sanitized.replace(/,/g, '');
    }
  }
  // US format or no separators
  else {
    normalized = sanitized.replace(/,/g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  regularPrice: string | number,
  salePrice: string | number
): number | null {
  const regular =
    typeof regularPrice === 'number' ? regularPrice : parsePriceToNumber(regularPrice);
  const sale = typeof salePrice === 'number' ? salePrice : parsePriceToNumber(salePrice);

  if (!regular || !sale || regular <= sale) return null;

  const discount = ((regular - sale) / regular) * 100;
  return Math.round(Math.abs(discount)); // Ensure always positive
}

/**
 * Check if product has valid discount
 */
export function hasValidDiscount(regularPrice?: string | null, salePrice?: string | null): boolean {
  const regular = parsePriceToNumber(regularPrice);
  const sale = parsePriceToNumber(salePrice);

  return !!(regular !== undefined && sale !== undefined && sale < regular && sale > 0);
}

/**
 * Check if a price is valid and purchasable
 */
export function isValidPrice(price?: string | number | null): boolean {
  if (price === null || price === undefined) return false;

  // Handle number type
  if (typeof price === 'number') {
    return Number.isFinite(price) && price > 0;
  }

  // Handle string type
  if (typeof price !== 'string' || price.trim() === '') return false;

  const parsed = parsePriceToNumber(price);
  return parsed !== undefined && parsed > 0;
}

/**
 * Get primary display price (sale price if available and valid, otherwise regular)
 */
export function getPrimaryPrice(product: {
  price?: string | null;
  salePrice?: string | null;
  regularPrice?: string | null;
}): string {
  const hasDiscount = hasValidDiscount(product.regularPrice ?? product.price, product.salePrice);

  if (hasDiscount && product.salePrice) {
    return product.salePrice;
  }

  // Use ?? instead of || to handle "0" correctly
  return product.price ?? product.regularPrice ?? product.salePrice ?? '';
}

/**
 * Get secondary price (crossed out regular price if on sale)
 */
export function getSecondaryPrice(product: {
  price?: string | null;
  salePrice?: string | null;
  regularPrice?: string | null;
}): string | null {
  const hasDiscount = hasValidDiscount(product.regularPrice ?? product.price, product.salePrice);

  if (hasDiscount && product.regularPrice) {
    return product.regularPrice;
  }

  return null;
}
