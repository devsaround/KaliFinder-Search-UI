/**
 * Bootstrap
 * Main entry point for widget initialization
 * Orchestrates DOM setup, CSS injection, and search element binding
 */

// Import CSS to ensure it's processed by Vite/Tailwind
// The shadowCssPlugin will capture the emitted CSS and inline it
import '../index.css';
// shadowCssPlugin will inject: var __INLINED_WIDGET_CSS__ = "..."

import { setDebugMode, log } from './utils/logger';
import { createStyles } from './utils/css-injection';
import { setupDOM, renderWidget } from './utils/dom-setup';
import { bindSearchTriggers, setupSearchObserver } from './utils/search-binding';
import { createFallbackTrigger, removeFallbackTrigger } from './utils/fallback-trigger';
import {
  replaceHeaderSearchElements,
  setupHeaderReplacementObserver,
} from './utils/header-replacement';

export type InitOptions = {
  storeUrl: string;
  debug?: boolean;
};

export type Controller = {
  open: (query?: string) => void;
  destroy: () => void;
};

/**
 * Open widget with optional search query
 */
function openWidget(query?: string): void {
  const evt = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
  window.dispatchEvent(evt);
}

/**
 * Initialize KaliFinder Search Widget
 * Creates shadow DOM, injects styles, binds to search elements
 */
export function init(options: InitOptions): Controller {
  // Configure debug mode
  setDebugMode(options.debug ?? false);
  log('Initializing widget with options:', options);

  // Setup DOM structure
  const { container, shadowRoot, portalContainer, root } = setupDOM();

  // Track fallback trigger
  let fallbackTrigger: HTMLButtonElement | null = null;
  let headerReplacementObserver: MutationObserver | null = null;

  // Inject styles then render React (CSS is inlined by shadowCssPlugin during build)
  createStyles(shadowRoot)
    .then(() => {
      // Styles injected - render widget
      renderWidget(root, portalContainer, options.storeUrl);
    })
    .catch((err) => {
      console.error('[Kalifinder] Failed to inject styles, rendering anyway', err);
      // Render anyway - might have partial styling
      renderWidget(root, portalContainer, options.storeUrl);
    });

  // Replace search elements in headers with our icon
  replaceHeaderSearchElements(openWidget);

  // Setup observer for dynamic header search elements
  headerReplacementObserver = setupHeaderReplacementObserver(openWidget);

  // Bind to native search elements (for non-header elements)
  const bound = bindSearchTriggers(openWidget);

  // Handle newly found search elements
  const onSearchElementsBound = () => {
    if (fallbackTrigger) {
      removeFallbackTrigger(fallbackTrigger);
      fallbackTrigger = null;
      log('Native search elements found, removed fallback trigger');
    }
  };

  // Setup observer for dynamic search elements
  const observer = setupSearchObserver(openWidget, onSearchElementsBound);

  // Create fallback trigger if no native search found
  if (!bound) {
    fallbackTrigger = createFallbackTrigger(openWidget);
  } else {
    log('Successfully bound to native search elements');
  }

  return {
    open: openWidget,
    destroy: () => {
      // Cleanup
      observer.disconnect();
      log('MutationObserver disconnected');

      if (headerReplacementObserver) {
        headerReplacementObserver.disconnect();
        log('Header replacement observer disconnected');
      }

      try {
        root.unmount();
      } catch {
        // Root may already be unmounted
      }

      container.remove();
      removeFallbackTrigger(fallbackTrigger);
      fallbackTrigger = null;
    },
  };
}

// Global types
declare global {
  interface Window {
    Kalifinder?: { init: (opts: InitOptions) => Controller };
    KalifinderController?: Controller;
  }
}

// UMD global and auto-init from script query
(() => {
  try {
    (window as unknown as Window).Kalifinder = { init };

    // Auto-initialize from script query parameters
    const scripts = document.getElementsByTagName('script');
    let widgetScript: HTMLScriptElement | null = null;

    // Find the script that loads kalifind-search.js (not just the last script)
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script && script.src && script.src.includes('kalifind-search')) {
        widgetScript = script;
        break;
      }
    }

    if (widgetScript && widgetScript.src) {
      const url = new URL(widgetScript.src);
      const storeUrl = url.searchParams.get('storeUrl');
      const debug = url.searchParams.get('debug') === 'true';

      if (storeUrl) {
        const controller = init({ storeUrl, debug });
        (window as unknown as Window).KalifinderController = controller;
      }
    }
  } catch {
    // no-op
  }
})();
