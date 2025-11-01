/**
 * Search Element Binding
 * Detects and binds to native search elements on host page
 */

import { log, warn } from './logger';
import { SEARCH_SELECTORS, INPUT_SELECTORS } from './search-selectors';

export type OpenWidgetFn = (query?: string) => void;

/**
 * Find a nearby search input element
 */
function findSearchInput(
  element: Element | Document
): HTMLInputElement | HTMLTextAreaElement | null {
  const root = element instanceof Element ? element.closest('form') || element : element;
  return root.querySelector(INPUT_SELECTORS.join(', ')) as HTMLInputElement | null;
}

/**
 * Seed widget with input value and open
 */
function seedAndOpenFromInput(
  input: HTMLInputElement | HTMLTextAreaElement | null,
  openWidget: OpenWidgetFn
): void {
  const query = (input?.value || '').trim();
  openWidget(query);
}

/**
 * Find all search elements on page using selectors and text content
 */
function findSearchElements(): Set<Element> {
  const found = new Set<Element>();

  // Find by selectors
  SEARCH_SELECTORS.forEach((sel) => {
    try {
      document.querySelectorAll(sel).forEach((el) => found.add(el));
    } catch (e) {
      warn(`Invalid selector: ${sel}`, e);
    }
  });

  // Find by text content
  const allButtons = document.querySelectorAll('button, a');
  allButtons.forEach((el) => {
    const text = el.textContent?.toLowerCase().trim() || '';
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    const title = el.getAttribute('title')?.toLowerCase() || '';

    if (
      text.includes('search') ||
      text.includes('🔍') ||
      ariaLabel.includes('search') ||
      title.includes('search')
    ) {
      found.add(el);
    }
  });

  return found;
}

/**
 * Bind click handler to button/link
 */
function bindButton(element: Element, openWidget: OpenWidgetFn): void {
  if (!(element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement)) return;

  element.addEventListener(
    'click',
    (e) => {
      log('Search element clicked, opening widget:', element);
      const input = findSearchInput(element) || findSearchInput(document);
      e.preventDefault();
      e.stopPropagation();
      seedAndOpenFromInput(input, openWidget);
    },
    { capture: true }
  );
  log('Bound click handler to:', element.tagName, element.className || element.id);
}

/**
 * Bind submit handler to form
 */
function bindForm(element: Element, openWidget: OpenWidgetFn): void {
  if (!(element instanceof HTMLFormElement)) return;

  element.addEventListener(
    'submit',
    (e) => {
      log('Search form submitted, opening widget:', element);
      const input = findSearchInput(element);
      e.preventDefault();
      e.stopPropagation();
      seedAndOpenFromInput(input, openWidget);
    },
    { capture: true }
  );
  log('Bound submit handler to form:', element.className || element.id);
}

/**
 * Bind focus handler to input
 */
function bindInput(element: Element, openWidget: OpenWidgetFn): void {
  if (!(element instanceof HTMLInputElement)) return;

  element.addEventListener(
    'focus',
    (e) => {
      log('Search input focused, opening widget:', element);
      e.preventDefault();
      seedAndOpenFromInput(element, openWidget);
    },
    { capture: true, once: false }
  );
  log('Bound focus handler to input:', element.name || element.id);
}

/**
 * Bind click handler to details/summary (Shopify pattern)
 */
function bindDetailsElement(element: Element, openWidget: OpenWidgetFn): void {
  if (!(element instanceof HTMLDetailsElement || element.tagName.toLowerCase() === 'summary')) {
    return;
  }

  element.addEventListener(
    'click',
    (e) => {
      log('Details/summary clicked, opening widget:', element);
      const input = findSearchInput(element) || findSearchInput(document);
      e.preventDefault();
      e.stopPropagation();
      seedAndOpenFromInput(input, openWidget);
    },
    { capture: true }
  );
  log('Bound click handler to details/summary:', element.className || element.id);
}

/**
 * Bind event handlers to a search element
 */
function bindElement(element: Element, openWidget: OpenWidgetFn): void {
  // Skip if already bound
  if (element.hasAttribute('data-kalifinder-bound')) {
    return;
  }
  element.setAttribute('data-kalifinder-bound', 'true');

  // Bind based on element type
  bindButton(element, openWidget);
  bindForm(element, openWidget);
  bindInput(element, openWidget);
  bindDetailsElement(element, openWidget);
}

/**
 * Bind to all search triggers on page
 * Returns true if any elements were bound
 */
export function bindSearchTriggers(openWidget: OpenWidgetFn): boolean {
  const elements = findSearchElements();
  log(`Found ${elements.size} search elements to bind`);

  if (elements.size === 0) return false;

  elements.forEach((el) => bindElement(el, openWidget));
  return true;
}

/**
 * Check if element or its children contain search-related classes/ids
 */
function hasSearchKeywords(element: Element): boolean {
  return (
    element.matches('[class*="search" i], [id*="search" i]') ||
    element.querySelector('[class*="search" i], [id*="search" i]') !== null
  );
}

/**
 * Setup MutationObserver to detect dynamically added search elements
 */
export function setupSearchObserver(
  openWidget: OpenWidgetFn,
  onBound: () => void
): MutationObserver {
  let bindingAttempts = 0;
  const MAX_BINDING_ATTEMPTS = 10;
  let bound = false;

  const observer = new MutationObserver((mutations) => {
    // Check if we should rebind
    let shouldRebind = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && hasSearchKeywords(node)) {
            shouldRebind = true;
            break;
          }
        }
      }
      if (shouldRebind) break;
    }

    if (shouldRebind && bindingAttempts < MAX_BINDING_ATTEMPTS) {
      bindingAttempts++;
      log(`Detected new DOM changes, rebinding search triggers (attempt ${bindingAttempts})`);

      const newlyBound = bindSearchTriggers(openWidget);
      if (newlyBound && !bound) {
        bound = true;
        onBound();
      }
    }
  });

  // Start observing after a short delay
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    log('MutationObserver started watching for dynamic search elements');
  }, 1000);

  return observer;
}
