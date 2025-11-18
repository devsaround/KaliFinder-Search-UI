/**
 * Header Search Replacement
 * Replaces search elements inside <header> with our search icon
 * Similar to Doofinder's approach
 */

import { log, warn } from './logger';
import { SEARCH_SELECTORS } from './search-selectors';

export type OpenWidgetFn = (query?: string) => void;

/**
 * Check if element is inside a <header> tag
 */
function isInHeader(element: Element): boolean {
  return element.closest('header') !== null;
}

/**
 * Get search icon SVG markup
 */
function getSearchIconSVG(): string {
  return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;pointer-events:none">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  `.trim();
}

/**
 * Create a replacement search icon that opens our widget
 */
function createReplacementIcon(
  openWidget: OpenWidgetFn,
  originalQuery?: string
): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Search products');
  button.setAttribute('data-kalifinder-replacement', 'true');

  // Inline styles to avoid CSS dependencies
  button.style.position = 'relative';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.padding = '8px';
  button.style.border = 'none';
  button.style.background = 'transparent';
  button.style.cursor = 'pointer';
  button.style.color = 'inherit';
  button.style.fontSize = 'inherit';

  // Search icon SVG - Static content, no XSS risk
  button.innerHTML = getSearchIconSVG();

  button.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    log('Replacement search icon clicked, opening widget');
    openWidget(originalQuery);
  };

  return button;
}

/**
 * Replace a single search element with our icon
 */
function replaceElement(element: Element, openWidget: OpenWidgetFn): boolean {
  // Skip if already replaced
  if (element.hasAttribute('data-kalifinder-replaced')) {
    return false;
  }

  // Skip if not in header
  if (!isInHeader(element)) {
    return false;
  }

  const originalText = element instanceof HTMLInputElement ? element.value.trim() : '';

  try {
    // Create replacement icon
    const replacement = createReplacementIcon(openWidget, originalText);

    // Mark original as replaced
    element.setAttribute('data-kalifinder-replaced', 'true');
    element.setAttribute('data-kalifinder-hidden', 'true');
    element.setAttribute('data-kalifinder-original', 'true');

    // Hide original element
    if (element instanceof HTMLElement) {
      element.style.position = 'absolute';
      element.style.opacity = '0';
      element.style.width = '0';
      element.style.height = '0';
      element.style.pointerEvents = 'none';
      element.style.overflow = 'hidden';
    }

    // Insert replacement after original
    element.parentElement?.insertBefore(replacement, element.nextSibling);
    element.parentElement?.setAttribute('data-kalifinder-wrapper', 'true');

    log('Replaced search element in header:', element.tagName, element.className || element.id);
    return true;
  } catch (err) {
    warn('Failed to replace element:', err);
    return false;
  }
}

/**
 * Find all search elements in headers
 */
function findHeaderSearchElements(): Set<Element> {
  const found = new Set<Element>();

  // Find by selectors only (don't search by text for now)
  SEARCH_SELECTORS.forEach((sel) => {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (isInHeader(el)) {
          found.add(el);
        }
      });
    } catch (e) {
      warn(`Invalid selector: ${sel}`, e);
    }
  });

  return found;
}

/**
 * Replace search elements in headers with our icon
 * Returns true if any elements were replaced
 */
export function replaceHeaderSearchElements(openWidget: OpenWidgetFn): boolean {
  const elements = findHeaderSearchElements();
  log(`Found ${elements.size} search elements in headers to replace`);

  if (elements.size === 0) return false;

  let replaced = 0;
  elements.forEach((el) => {
    if (replaceElement(el, openWidget)) {
      replaced++;
    }
  });

  log(`Replaced ${replaced} search elements in headers`);
  return replaced > 0;
}

/**
 * Setup MutationObserver to detect dynamically added search elements in headers
 */
export function setupHeaderReplacementObserver(openWidget: OpenWidgetFn): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    // Check if we should replace
    let shouldReplace = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            // Check if node or children are search elements in header
            if (node.closest('header') && node.matches('form, input, button, a, details')) {
              shouldReplace = true;
              break;
            }
          }
        }
      }
      if (shouldReplace) break;
    }

    if (shouldReplace) {
      log('Detected new DOM changes in header, replacing search elements');
      replaceHeaderSearchElements(openWidget);
    }
  });

  // Start observing
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    log('Header replacement observer started watching for dynamic search elements');
  }, 1000);

  return observer;
}
