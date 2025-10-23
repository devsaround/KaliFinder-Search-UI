/**
 * KaliFinder Embeddable Search Widget
 * Entry point for CDN embedding with complete Shadow DOM isolation
 *
 * Usage:
 * <script src="https://cdn.kalifinder.com/kalifind-search.umd.js?storeUrl=https://test.myshopify.com" defer></script>
 *
 * ISOLATION FEATURES:
 * ✅ Shadow DOM - Complete CSS/JS isolation
 * ✅ Host CSS cannot affect widget styles
 * ✅ Widget CSS cannot leak to host page
 * ✅ All styles injected inside Shadow DOM
 * ✅ React components render inside Shadow DOM
 * ✅ Events captured/stopped from bubbling to host
 * ✅ No global namespace pollution
 *
 * DETECTION STRATEGY:
 * ✅ Universal attribute-based detection (not theme-specific)
 * ✅ Only scans <header> element for search functionality
 * ✅ Works with any framework (WordPress, Shopify, custom, etc.)
 * ✅ Detects: inputs, forms, buttons with "search" in attributes
 * ✅ Falls back to injecting search icon if no header search found
 * ✅ MutationObserver for dynamic content (SPAs)
 *
 * HOST COMPATIBILITY:
 * ✅ Non-invasive event listeners (no preventDefault on buttons)
 * ✅ Host theme toggles/modals continue to work
 * ✅ Single UMD bundle - works everywhere
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from './components/WidgetEmbed';
import styles from './index.css?inline';

/**
 * Dispatch a window event to open the Kalifinder widget with an optional query
 */
function openKalifinderWithQuery(query?: string) {
  try {
    const event = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
    window.dispatchEvent(event);
  } catch (_error) {
    // Fallback for very old browsers (unlikely)
    (window as any).dispatchEvent &&
      (window as any).dispatchEvent({ type: 'kalifinder:open', detail: { query: query ?? '' } });
  }
}

/**
 * Attach listeners to common host search elements and forward queries to the widget
 * Strategy: Only focus on <header> element with universal attribute-based detection
 */
function attachHostSearchListeners(): void {
  const header = document.querySelector('header');
  if (!header) {
    console.log('[KaliFinder] No <header> element found on page');
    return;
  }

  console.log('[KaliFinder] Found <header> element, scanning for search functionality...');

  // Universal selectors - detect ANY element within header that contains "search" in:
  // - type attribute
  // - name attribute
  // - id attribute
  // - class attribute
  // - placeholder attribute
  // - aria-label attribute
  // - title attribute
  // - role attribute
  const inputSelectors = [
    'input[type="search"]',
    'input[type="text"][name*="search" i]',
    'input[type="text"][name="q"]',
    'input[type="text"][name="s"]',
    'input[type="text"][id*="search" i]',
    'input[type="text"][class*="search" i]',
    'input[type="text"][placeholder*="search" i]',
    'input[type="text"][aria-label*="search" i]',
    'input[role="searchbox"]',
    '[role="search"] input',
  ];

  const formSelectors = [
    'form[role="search"]',
    'form[action*="search" i]',
    'form[id*="search" i]',
    'form[class*="search" i]',
  ];

  const buttonSelectors = [
    'button[type="submit"]', // Any submit button in a search form
    'button[aria-label*="search" i]',
    'button[title*="search" i]',
    'button[class*="search" i]',
    'button[id*="search" i]',
    'a[aria-label*="search" i]',
    'a[title*="search" i]',
    'a[class*="search" i]',
    'a[id*="search" i]',
    '[role="button"][aria-label*="search" i]',
    '[role="button"][class*="search" i]',
    '[data-toggle-target*="search" i]',
    '[data-toggle-body-class*="search" i]',
    '[data-set-focus*="search" i]',
  ];

  const markBound = (el: Element) => el.setAttribute('data-kalifinder-bound', 'true');
  const isBound = (el: Element) => el.getAttribute('data-kalifinder-bound') === 'true';

  // Binding function - only scan within <header>
  const bindAll = () => {
    // Find all inputs within header that match search patterns
    const inputs = new Set<Element>();
    inputSelectors.forEach((sel) => {
      header.querySelectorAll(sel).forEach((el) => inputs.add(el));
    });

    // Find all forms within header that match search patterns
    const forms = new Set<Element>();
    formSelectors.forEach((sel) => {
      header.querySelectorAll(sel).forEach((el) => forms.add(el));
    });

    // Find all buttons/links within header that match search patterns
    const buttons = new Set<Element>();
    buttonSelectors.forEach((sel) => {
      header.querySelectorAll(sel).forEach((el) => buttons.add(el));
    });

    console.log(
      `[KaliFinder] Header scan complete: ${inputs.size} input(s), ${forms.size} form(s), ${buttons.size} button(s)/link(s)`
    );

    // Bind inputs: trigger on Enter key
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

    // Bind forms: intercept submit
    forms.forEach((el) => {
      if (isBound(el)) return;
      el.addEventListener(
        'submit',
        (e: Event) => {
          const form = e.currentTarget as HTMLFormElement;
          // Find any input in the form
          const input = form.querySelector<HTMLInputElement>(
            'input[type="search"], input[type="text"]'
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

    // Bind buttons: trigger on click
    buttons.forEach((el) => {
      if (isBound(el)) return;
      (el as HTMLElement).addEventListener(
        'click',
        (e: Event) => {
          // Try to find input in closest form or in header
          const closestForm = (e.currentTarget as Element).closest('form');
          const searchRoot = closestForm || header;
          const input = searchRoot.querySelector<HTMLInputElement>(
            'input[type="search"], input[type="text"]'
          );
          const q = input?.value?.trim() ?? '';
          openKalifinderWithQuery(q);
          // Do not prevent default or stop propagation so host behaviors still work
        },
        { capture: true }
      );
      markBound(el);
    });
  };

  // Initial bind
  bindAll();

  // Observe header for dynamically added search elements (SPAs or lazy-loaded content)
  const observer = new MutationObserver(() => {
    bindAll();
  });
  observer.observe(header, { childList: true, subtree: true });
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
 * Detect if the host website has a search functionality in <header>
 * Returns true if search functionality is already present in header
 */
function detectExistingSearch(): boolean {
  const header = document.querySelector('header');
  if (!header) {
    console.log('[KaliFinder] No <header> element found');
    return false;
  }

  // Universal detection: look for any element with "search" in attributes
  const hasSearchInput = header.querySelector(
    'input[type="search"], input[name*="search" i], input[placeholder*="search" i], input[class*="search" i], input[id*="search" i], [role="searchbox"]'
  );

  const hasSearchButton = header.querySelector(
    'button[aria-label*="search" i], button[title*="search" i], button[class*="search" i], a[aria-label*="search" i], a[class*="search" i], [role="button"][class*="search" i]'
  );

  const hasSearchForm = header.querySelector(
    'form[role="search"], form[action*="search" i], form[class*="search" i], form[id*="search" i]'
  );

  if (hasSearchInput || hasSearchButton || hasSearchForm) {
    console.log('[KaliFinder] Search functionality detected in <header>');
    return true;
  }

  console.log('[KaliFinder] No search functionality found in <header>, will inject search icon');
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
 * Initialize the embedded widget with Shadow DOM isolation
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
    container.style.cssText =
      'position: fixed; z-index: 2147483647; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';

    // Append to body
    document.body.appendChild(container);

    // Create Shadow DOM for complete isolation
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Inject all widget styles into Shadow DOM (isolated from host)
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* CSS Reset to prevent host CSS interference */
      :host {
        all: initial;
        display: block;
      }
      
      /* Widget styles (completely isolated) */
      ${styles}
    `;
    shadowRoot.appendChild(styleSheet);

    // Create React mount point inside Shadow DOM
    const reactRoot = document.createElement('div');
    reactRoot.id = 'kalifinder-react-root';
    reactRoot.style.cssText = 'width: 100%; height: 100%; pointer-events: auto;';
    shadowRoot.appendChild(reactRoot);

    // Render React app inside Shadow DOM
    const root = ReactDOM.createRoot(reactRoot);
    root.render(
      <React.StrictMode>
        <WidgetEmbed storeUrl={storeUrl} />
      </React.StrictMode>
    );

    console.log('[KaliFinder] Widget embedded with Shadow DOM isolation for store:', storeUrl);
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
