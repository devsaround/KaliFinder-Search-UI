/**
 * KaliFinder Embeddable Search Widget
 * Entry point for CDN embedding with Shadow DOM isolation
 *
 * Usage:
 * <script src="https://cdn.kalifinder.com/kalifind-search.js?storeUrl=https://test.myshopify.com" defer></script>
 *
 * Features:
 * - Shadow DOM isolation prevents CSS conflicts
 * - Only listens to Kalifinder search icon clicks
 * - Does NOT intercept host website search elements
 * - Single JS file embedding
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from './components/WidgetEmbed';
import './index.css';

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
    'input[name*="q"]',
    'input[class*="search" i]',
    '[role="searchbox"]',
    '.search-input',
    '.search-box',
    '#search',
    'form.search',
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
