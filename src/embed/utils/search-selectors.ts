/**
 * Search Element Selectors
 * CSS selectors for common search patterns in Shopify, WooCommerce, and WordPress
 */

export const SEARCH_SELECTORS = [
  // Generic search buttons/links
  'button[type="submit"][aria-label*="search" i]',
  'button[aria-label*="Search" i]',
  'a[aria-label*="search" i]',
  'button[class*="search" i]',
  'a[class*="search" i]',
  'button[id*="search" i]',
  'a[id*="search" i]',

  // Inputs/forms
  'form[action*="search" i]',
  'input[type="search"]',
  'input[name="q"]',
  'input[name="s"]',
  'input[placeholder*="search" i]',

  // Shopify common
  '.site-header__search',
  '.site-header__search-toggle',
  '.search-modal__toggle',
  '.header__search',
  '.header-search',
  'form.search',
  '.search-form',
  '#search',
  '.search',
  'details[class*="search" i]',
  'summary[class*="search" i]',

  // WooCommerce common
  '.woocommerce-product-search',
  'form[role="search"]',
  '.wp-block-search',
  '.search-submit',

  // WordPress common
  '.search-toggle',
  '.menu-item-search',
  'button.search-button',
  'a.search-icon',

  // Additional patterns
  '[data-search]',
  '[data-toggle*="search" i]',
  '[data-action*="search" i]',
];

export const INPUT_SELECTORS = [
  'input[type="search"]',
  'input[name="q"]',
  'input[name="s"]',
  'input[placeholder*="search" i]',
];
