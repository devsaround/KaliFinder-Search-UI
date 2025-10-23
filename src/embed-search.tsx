/**
 * KaliFinder Embeddable Search Widget
 * Entry point for CDN embedding with Shadow DOM isolation
 *
 * Usage:
 * <script src="https://cdn.kalifinder.com/kalifind-search.js?storeUrl=https://test.myshopify.com" defer></script>
 *
 * Features:
 * - Shadow DOM isolation prevents CSS conflicts
 * - Listens to common host-site search elements (inputs/forms/buttons) non-invasively
 * - Also provides a Kalifinder search icon injection when no search exists
 * - Single JS file embedding
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from './components/WidgetEmbed';
import './index.css';

/**
 * Dispatch a window event to open the Kalifinder widget with an optional query
 */
function openKalifinderWithQuery(query?: string) {
  try {
    const event = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
    window.dispatchEvent(event);
  } catch (e) {
    // Fallback for very old browsers (unlikely)
    (window as any).dispatchEvent &&
      (window as any).dispatchEvent({ type: 'kalifinder:open', detail: { query: query ?? '' } });
  }
}

/**
 * Attach listeners to common host search elements and forward queries to the widget
 */
function attachHostSearchListeners(): void {
  // Selectors: inputs, forms, and common search triggers (case-insensitive)
  const inputSelectors = [
    'header input[type="search"]',
    'header input[placeholder*="search" i]',
    'header input[name*="search" i]',
    'header input[name="q" i]',
    'header input[name="s" i]',
    'header input[id*="search" i]',
    'header [role="search"] input',
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[name*="search" i]',
    'input[name="q" i]',
    'input[name="s" i]',
    'input[id*="search" i]',
    '[role="search"] input',
    '#search',
    '#searchform input',
    '.search input',
    '.search-box input',
    '.search-field',
    'form[id*="search" i] input',
    'form[class*="search" i] input',
    '[class*="search-input" i]',
    '[class*="search" i] input',
  ];

  const formSelectors = [
    'header form[role="search"]',
    'header form[action*="search" i]',
    'header form[id*="search" i]',
    'header form[class*="search" i]',
    'form[role="search"]',
    'form[action*="search" i]',
    'form[id*="search" i]',
    'form[class*="search" i]',
    '#searchform',
  ];

  const buttonSelectors = [
    'header button[aria-label*="search" i]',
    'header button[title*="search" i]',
    'header a[aria-label*="search" i]',
    'header [class*="search" i]',
    'header [id*="search" i]',
    'button[aria-label*="search" i]',
    'button[title*="search" i]',
    'a[aria-label*="search" i]',
    '[class*="search-button" i]',
    '[class*="search-icon" i]',
    '[class*="search-action" i]',
    '[class*="search-modal" i]',
    'button[class*="search" i]',
    'a[class*="search" i]',
    '[class*="search-toggle" i]',
    '[class*="sb-search-button-open" i]',
    '[role="button"][class*="search" i]',
    '[data-toggle-target*="search" i]',
    '[data-set-focus*="search" i]',
    '[on\\:click*="search" i]',
    '[id*="search" i]',
    'svg[class*="search" i]',
    'search-button button',
    'search-button',
    'input[type="submit"][value*="search" i]',
    '[aria-controls*="search" i]',
  ];

  const markBound = (el: Element) => el.setAttribute('data-kalifinder-bound', 'true');
  const isBound = (el: Element) => el.getAttribute('data-kalifinder-bound') === 'true';

  // Binding function (can be called repeatedly; guarded by data-kalifinder-bound)
  const bindAll = () => {
    // Inputs: submit on Enter
    const inputs = new Set<Element>();
    inputSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => inputs.add(el));
    });
    inputs.forEach((el) => {
      if (isBound(el)) return;
      (el as HTMLElement).addEventListener(
        'keydown',
        (e: Event) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter') {
            const target = ke.target as HTMLInputElement | null;
            const q = target?.value?.trim() ?? '';
            openKalifinderWithQuery(q);
            ke.preventDefault();
            ke.stopPropagation();
          }
        },
        { capture: true }
      );
      markBound(el);
    });

    // Forms: intercept submit
    const forms = new Set<Element>();
    formSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => forms.add(el));
    });
    forms.forEach((el) => {
      if (isBound(el)) return;
      el.addEventListener(
        'submit',
        (e: Event) => {
          const form = e.currentTarget as HTMLFormElement;
          const input = form.querySelector<HTMLInputElement>(
            'input[type="search"], input[name="q" i], input[name="s" i], input[name*="search" i], input[id*="search" i], input[placeholder*="search" i], .search-field'
          );
          const q = input?.value?.trim() ?? '';
          openKalifinderWithQuery(q);
          e.preventDefault();
          e.stopPropagation();
        },
        { capture: true }
      );
      markBound(el);
    });

    // Buttons/Icons: open widget (don’t assume query)
    const buttons = new Set<Element>();
    buttonSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => buttons.add(el));
    });
    buttons.forEach((el) => {
      if (isBound(el)) return;
      (el as HTMLElement).addEventListener(
        'click',
        (e: Event) => {
          const root =
            (e.currentTarget as Element).closest('form, header, .search, [role="search"]') ||
            document;
          const input = root.querySelector<HTMLInputElement>(
            'input[type="search"], input[name="q" i], input[name="s" i], input[name*="search" i], input[id*="search" i], input[placeholder*="search" i], .search-field'
          );
          const q = input?.value?.trim() ?? '';
          openKalifinderWithQuery(q);
          // Do not prevent default or stop propagation so host behaviors (e.g., WordPress toggles) still work
        },
        { capture: true }
      );
      markBound(el);
    });
  };

  // Initial bind
  bindAll();

  // Observe for dynamically added search elements (SPAs)
  const observer = new MutationObserver(() => {
    bindAll();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

/**
 * Get store URL from script tag attributes or URL query parameters
 */
function getStoreUrlFromScript(): string {
  // Method 1: Check script tag src for storeUrl parameter
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const src = script.src;
    if (src && src.includes('kalifind-search')) {
      const url = new URL(src);
      const storeUrl = url.searchParams.get('storeUrl');
      if (storeUrl) return storeUrl;
    }
  }

  // Method 2: Check current page URL for storeUrl parameter
  const urlParams = new URLSearchParams(window.location.search);
  const storeUrl = urlParams.get('storeUrl');
  if (storeUrl) return storeUrl;

  // Method 3: Try to get from window variable (for alternative init)
  if ((window as any).__KALIFINDER_STORE_URL__) {
    return (window as any).__KALIFINDER_STORE_URL__;
  }
  throw new Error('storeUrl not found. Pass it as ?storeUrl=https://your-store.com in script src');
}

/**
 * Detect if the host website has a search input or search icon
 * Returns true if search functionality is already present
 */
function detectExistingSearch(): boolean {
  // Common search input selectors
  const searchInputSelectors = [
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="Search" i]',
    'input[name*="search" i]',
    'input[name*="q" i]',
    'input[name="s" i]',
    'input[class*="search" i]',
    '[role="searchbox"]',
    '.search-input',
    '.search-box',
    '#search',
    'form.search',
    '#searchform',
  ];

  // Common search icon/button selectors
  const searchIconSelectors = [
    'button[aria-label*="search" i]',
    'button[title*="search" i]',
    'a[aria-label*="search" i]',
    '.search-icon',
    '.search-btn',
    '[class*="search-icon" i]',
    '[class*="search-button" i]',
    'svg[class*="search" i]',
  ];

  const allSelectors = [...searchInputSelectors, ...searchIconSelectors];

  for (const selector of allSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && (element as HTMLElement).offsetParent !== null) {
        // Element exists and is visible
        console.log('[KaliFinder] Existing search found:', selector);
        return true;
      }
    } catch {
      // Invalid selector, continue
    }
  }

  console.log('[KaliFinder] No existing search found, will inject search icon');
  return false;
}

/**
 * Inject search icon if no search exists on the page
 */
function injectSearchIconIfNeeded(): void {
  const hasExistingSearch = detectExistingSearch();

  if (hasExistingSearch) {
    console.log('[KaliFinder] Host page has search, not injecting icon');
    return;
  }

  console.log('[KaliFinder] Injecting search icon into host page');

  // Create a minimal search icon button styled to match common e-commerce themes
  const injectedButton = document.createElement('button');
  injectedButton.id = 'kalifinder-injected-search-button';
  injectedButton.setAttribute('aria-label', 'Search');
  injectedButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9997;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
    transition: all 0.3s ease;
    font-size: 20px;
  `;

  // SVG Search Icon
  injectedButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  `;

  // Add hover effects
  injectedButton.onmouseenter = () => {
    injectedButton.style.transform = 'scale(1.1)';
    injectedButton.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.6)';
  };

  injectedButton.onmouseleave = () => {
    injectedButton.style.transform = 'scale(1)';
    injectedButton.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
  };

  injectedButton.onmousedown = () => {
    injectedButton.style.transform = 'scale(0.95)';
  };

  injectedButton.onmouseup = () => {
    injectedButton.style.transform = 'scale(1)';
  };

  document.body.appendChild(injectedButton);
  console.log('[KaliFinder] Search icon injected at top-right corner');
}

/**
 * Initialize the embedded widget
 */
function initializeEmbeddedWidget(): void {
  try {
    // Get store URL from script attributes
    const storeUrl = getStoreUrlFromScript();

    // Check if host page has search, inject icon if needed
    injectSearchIconIfNeeded();
    // Regardless of injection, hook into any existing search elements
    attachHostSearchListeners();

    // Create a unique container for this widget instance
    const containerId = `kalifinder-search-${Date.now()}`;
    const container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'display: inline-block; margin: 0; padding: 0;';

    // Append to body or a specific element
    const targetElement = document.body;
    targetElement.appendChild(container);

    // Render widget component
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <WidgetEmbed containerId={containerId} storeUrl={storeUrl} />
      </React.StrictMode>
    );

    console.log('[KaliFinder] Widget embedded successfully for store:', storeUrl);
  } catch (error) {
    console.error('[KaliFinder] Failed to initialize widget:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEmbeddedWidget);
} else {
  initializeEmbeddedWidget();
}

// Export for manual initialization if needed
export { initializeEmbeddedWidget };
