/**
 * Facet Utilities - Industry Standard
 *
 * Clean, simple utilities for working with facet buckets from the backend.
 * Backend sends facets in OpenSearch aggregation format: { buckets: [...] }
 */

import type { FacetBuckets } from '../stores/facetStore';
import type { FacetBucket, SearchFacets } from '../types/api.types';

/**
 * Extract buckets from a single facet aggregation response
 * Backend format: { buckets: [...] }
 */
export function extractBuckets(facet: unknown): FacetBucket[] {
  if (!facet || typeof facet !== 'object') {
    return [];
  }

  const facetObj = facet as { buckets?: unknown };
  const buckets = facetObj.buckets;

  if (!Array.isArray(buckets)) {
    return [];
  }

  return buckets
    .filter((bucket): bucket is Record<string, unknown> => !!bucket && typeof bucket === 'object')
    .map((bucket) => ({
      key: bucket.key as string | number | boolean,
      key_as_string: bucket.key_as_string as string | undefined,
      doc_count: typeof bucket.doc_count === 'number' ? bucket.doc_count : 0,
      from: bucket.from as number | undefined,
      to: bucket.to as number | undefined,
    }));
}

/**
 * Extract all facets from search response
 * Converts API response to clean FacetBuckets format
 */
export function extractAllFacets(responseFacets?: SearchFacets): FacetBuckets {
  if (!responseFacets) {
    return {};
  }

  return {
    category: extractBuckets(responseFacets.category),
    brand: extractBuckets(responseFacets.brand),
    color: extractBuckets(responseFacets.color),
    size: extractBuckets(responseFacets.size),
    tag: extractBuckets(responseFacets.tag),
    instock: extractBuckets(responseFacets.instock),
    featured: extractBuckets(responseFacets.featured),
    insale: extractBuckets(responseFacets.insale),
    price: extractBuckets(responseFacets.price),
  };
}

/**
 * Get display key from facet bucket
 */
export function getBucketKey(bucket: FacetBucket): string {
  if (typeof bucket.key === 'string') {
    return bucket.key;
  }
  if (bucket.key_as_string) {
    return bucket.key_as_string;
  }
  return String(bucket.key);
}

/**
 * Get boolean value from facet bucket (for featured/insale facets)
 */
export function getBucketBooleanValue(bucket: FacetBucket): boolean | null {
  if (typeof bucket.key === 'boolean') {
    return bucket.key;
  }
  if (typeof bucket.key === 'number') {
    return bucket.key === 1;
  }
  if (bucket.key_as_string) {
    return bucket.key_as_string === 'true';
  }
  return null;
}

/**
 * Get display label for stock status
 */
export function getStockStatusLabel(key: string): string {
  const normalized = key.toLowerCase();
  if (normalized === 'instock') return 'In Stock';
  if (normalized === 'outofstock') return 'Out of Stock';
  if (normalized === 'onbackorder') return 'On Backorder';
  return key;
}

/**
 * Find bucket count for a specific value
 */
export function findBucketCount(
  buckets: FacetBucket[] | undefined,
  searchKey: string | boolean
): number {
  if (!buckets) return 0;

  const bucket = buckets.find((b) => {
    if (typeof searchKey === 'boolean') {
      return getBucketBooleanValue(b) === searchKey;
    }
    return getBucketKey(b) === searchKey;
  });

  return bucket?.doc_count ?? 0;
}
