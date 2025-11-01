import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from '../components/WidgetEmbed';
import { ShadowRootProvider } from '../contexts/ShadowRootContext';
import '../index.css';
// Statically inline compiled Tailwind CSS as text; guaranteed available at build-time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import widgetCssText from '../index.css?raw';

// This will be replaced with actual CSS string during build
declare const __INLINED_WIDGET_CSS__: string | undefined;

export type InitOptions = {
  storeUrl: string;
  debug?: boolean; // Enable console logging for troubleshooting
};

type Controller = {
  open: (query?: string) => void;
  destroy: () => void;
};

// Global debug flag
let DEBUG_MODE = false;

// Helper to conditionally log
function log(...args: unknown[]) {
  if (DEBUG_MODE || import.meta.env.DEV) {
    console.log('[Kalifinder]', ...args);
  }
}

async function createStyles(shadowRoot: ShadowRoot): Promise<void> {
  // Prefer build-time inlined CSS from plugin; otherwise use statically imported CSS text
  let css =
    typeof __INLINED_WIDGET_CSS__ !== 'undefined' && __INLINED_WIDGET_CSS__
      ? __INLINED_WIDGET_CSS__
      : (widgetCssText as unknown as string) || '';

  // Remove placeholder if it wasn't replaced (development fallback)
  if (css && css.includes('__INLINED_WIDGET_CSS_PLACEHOLDER__')) {
    css = '';
  }

  // Diagnostics to ensure we can see what was available at runtime
  try {
    const pluginCssLen =
      typeof __INLINED_WIDGET_CSS__ === 'string' ? __INLINED_WIDGET_CSS__.length : 0;
    const rawCssLen =
      typeof (widgetCssText as unknown as string) === 'string'
        ? (widgetCssText as unknown as string).length
        : 0;
    console.log(
      `🧪 [Kalifinder] CSS availability → plugin: ${pluginCssLen} bytes, raw: ${rawCssLen} bytes`
    );
  } catch {
    // no-op
  }

  const supportsAdopted =
    'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;

  // Fallback: only in development if build-time injection failed
  if (!css && import.meta.env.DEV) {
    try {
      // Build-time guard: avoid Vite trying to parse CSS with PostCSS by using vite-ignore
      const inlinePath = '../index.css?inline';
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mod = await import(/* @vite-ignore */ inlinePath);
      css = (mod?.default as string) || '';
    } catch {
      // In production, don't try to load external CSS - it should be inlined
      console.warn('[Kalifinder] CSS not found in bundle - widget may be unstyled');
    }
  }

  // Robust availability check for raw CSS text
  const MIN_BYTES = 512; // treat tiny strings as unavailable
  const cssLength = (css || '').trim().length;

  if (!css || cssLength <= MIN_BYTES) {
    // Final fallback: attempt to clone Tailwind style from host document if present
    try {
      const styleEl = Array.from(document.querySelectorAll('style')).find((s) =>
        (s.textContent || '').includes('--tw-')
      );
      if (styleEl) {
        shadowRoot.appendChild(styleEl.cloneNode(true));
        console.warn(
          `[Kalifinder] No inlined CSS found (len=${cssLength}); cloned Tailwind <style> from host document into shadow root.`
        );
        return;
      }
    } catch {
      // ignore
    }

    console.error('[Kalifinder] No CSS available for Shadow DOM injection');
    return;
  }

  const cssSize = cssLength;
  const injectionMethod = supportsAdopted ? 'adoptedStyleSheets' : '<style> tag';

  if (supportsAdopted) {
    try {
      const sheet = new CSSStyleSheet();
      await sheet.replace(css);
      (shadowRoot as unknown as { adoptedStyleSheets: CSSStyleSheet[] }).adoptedStyleSheets = [
        sheet,
      ];
      console.log(
        `🔧 [Kalifinder] Tailwind CSS injected into shadow root via ${injectionMethod} (${cssSize} bytes) at`,
        new Date().toISOString()
      );
      return;
    } catch (err) {
      console.warn('[Kalifinder] Failed to use adoptedStyleSheets, falling back to style tag', err);
    }
  }

  // Fallback to style tag
  const style = document.createElement('style');
  style.textContent = css;
  shadowRoot.appendChild(style);
  console.log(
    `🔧 [Kalifinder] Tailwind CSS injected into shadow root via ${injectionMethod} (${cssSize} bytes) at`,
    new Date().toISOString()
  );
}

function openWidget(query?: string) {
  const evt = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
  window.dispatchEvent(evt);
}

export function init(options: InitOptions): Controller {
  // Set debug mode from options
  DEBUG_MODE = options.debug ?? false;

  log('Initializing widget with options:', options);

  const container = document.createElement('div');
  container.style.cssText =
    'position: fixed; z-index: 2147483647; inset: 0; width: 100%; height: 100%; pointer-events: none;';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Create root element first but don't render React yet
  const rootEl = document.createElement('div');
  rootEl.id = 'kalifinder-react-root';
  rootEl.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
  shadowRoot.appendChild(rootEl);

  // Inject styles BEFORE rendering React to avoid FOUC
  const root = ReactDOM.createRoot(rootEl);

  // Create a portal container for Radix UI components inside shadow root
  // This ensures dropdowns, tooltips, and dialogs render with shadow-scoped styles
  // Must be positioned absolutely to overlay the entire shadow root
  const portalContainer = document.createElement('div');
  portalContainer.id = 'kalifinder-portal-container';
  portalContainer.style.cssText =
    'position: absolute; inset: 0; z-index: 2147483647; pointer-events: none;';
  shadowRoot.appendChild(portalContainer);

  // Await style injection before rendering
  createStyles(shadowRoot)
    .then(() => {
      // Styles are now injected - safe to render React components
      root.render(
        <React.StrictMode>
          <ShadowRootProvider container={portalContainer}>
            <WidgetEmbed storeUrl={options.storeUrl} />
          </ShadowRootProvider>
        </React.StrictMode>
      );
    })
    .catch((err) => {
      console.error('[Kalifinder] Failed to inject styles, rendering anyway', err);
      // Render anyway - might have partial styling
      root.render(
        <React.StrictMode>
          <ShadowRootProvider container={portalContainer}>
            <WidgetEmbed storeUrl={options.storeUrl} />
          </ShadowRootProvider>
        </React.StrictMode>
      );
    });

  // Attempt to bind to existing search elements in common themes (Shopify/WooCommerce)
  // If none found, fall back to a floating trigger button.
  let fallbackTrigger: HTMLButtonElement | null = null;

  function seedAndOpenFromInput(input: HTMLInputElement | HTMLTextAreaElement | null) {
    const q = (input?.value || '').trim();
    openWidget(q);
  }

  function bindSearchTriggers(): boolean {
    const selectors = [
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

    const found = new Set<Element>();
    selectors.forEach((sel) => {
      try {
        document.querySelectorAll(sel).forEach((el) => found.add(el));
      } catch (e) {
        // Invalid selector, skip
        console.warn(`[Kalifinder] Invalid selector: ${sel}`, e);
      }
    });

    // Also find elements by text content (search icons/text)
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

    console.log(`[Kalifinder] Found ${found.size} search elements to bind`);

    if (found.size === 0) return false;

    found.forEach((el) => {
      // Mark element as bound to avoid duplicate bindings
      if (el.hasAttribute('data-kalifinder-bound')) {
        return;
      }
      el.setAttribute('data-kalifinder-bound', 'true');

      // Intercept clicks on buttons/links
      if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
        el.addEventListener(
          'click',
          (e) => {
            console.log('[Kalifinder] Search element clicked, opening widget:', el);
            // Try to find a nearby input to seed query
            const root = (el.closest('form') as HTMLFormElement | null) || document;
            const input = root.querySelector(
              'input[type="search"], input[name="q"], input[name="s"], input[placeholder*="search" i]'
            ) as HTMLInputElement | null;
            e.preventDefault();
            e.stopPropagation();
            seedAndOpenFromInput(input);
          },
          { capture: true }
        );
        console.log('[Kalifinder] Bound click handler to:', el.tagName, el.className || el.id);
      }

      // Intercept form submissions
      if (el instanceof HTMLFormElement) {
        el.addEventListener(
          'submit',
          (e) => {
            console.log('[Kalifinder] Search form submitted, opening widget:', el);
            const input = el.querySelector(
              'input[type="search"], input[name="q"], input[name="s"], input[placeholder*="search" i]'
            ) as HTMLInputElement | null;
            e.preventDefault();
            e.stopPropagation();
            seedAndOpenFromInput(input);
          },
          { capture: true }
        );
        console.log('[Kalifinder] Bound submit handler to form:', el.className || el.id);
      }

      // Intercept input focus (for search inputs)
      if (el instanceof HTMLInputElement) {
        el.addEventListener(
          'focus',
          (e) => {
            console.log('[Kalifinder] Search input focused, opening widget:', el);
            e.preventDefault();
            seedAndOpenFromInput(el);
          },
          { capture: true, once: false }
        );
        console.log('[Kalifinder] Bound focus handler to input:', el.name || el.id);
      }

      // Intercept click on details/summary (Shopify often uses these for search)
      if (el instanceof HTMLDetailsElement || el.tagName.toLowerCase() === 'summary') {
        el.addEventListener(
          'click',
          (e) => {
            console.log('[Kalifinder] Details/summary clicked, opening widget:', el);
            const root = (el.closest('form') as HTMLFormElement | null) || el;
            const input = root.querySelector(
              'input[type="search"], input[name="q"], input[name="s"]'
            ) as HTMLInputElement | null;
            e.preventDefault();
            e.stopPropagation();
            seedAndOpenFromInput(input);
          },
          { capture: true }
        );
        console.log('[Kalifinder] Bound click handler to details/summary:', el.className || el.id);
      }
    });

    return true;
  }

  // Initial binding
  let bound = bindSearchTriggers();

  // Watch for dynamically added search elements (for SPAs and lazy-loaded headers)
  let bindingAttempts = 0;
  const MAX_BINDING_ATTEMPTS = 10;

  const observer = new MutationObserver((mutations) => {
    // Debounce: only try to bind again if we see significant changes
    let shouldRebind = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            // Check if the added node or its children contain search elements
            const hasSearch =
              node.matches('[class*="search" i], [id*="search" i]') ||
              node.querySelector('[class*="search" i], [id*="search" i]') !== null;

            if (hasSearch) {
              shouldRebind = true;
              break;
            }
          }
        }
      }
      if (shouldRebind) break;
    }

    if (shouldRebind && bindingAttempts < MAX_BINDING_ATTEMPTS) {
      bindingAttempts++;
      console.log(
        `[Kalifinder] Detected new DOM changes, rebinding search triggers (attempt ${bindingAttempts})`
      );
      const newlyBound = bindSearchTriggers();
      if (newlyBound && !bound) {
        bound = true;
        // Remove fallback trigger if we now found native search elements
        if (fallbackTrigger && document.body.contains(fallbackTrigger)) {
          document.body.removeChild(fallbackTrigger);
          fallbackTrigger = null;
          console.log('[Kalifinder] Native search elements found, removed fallback trigger');
        }
      }
    }
  });

  // Start observing after a short delay to let page finish initial render
  setTimeout(() => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    console.log('[Kalifinder] MutationObserver started watching for dynamic search elements');
  }, 1000);

  if (!bound) {
    // Host-page trigger button (fixed) with inline styles so it doesn't depend on CSS
    console.log('[Kalifinder] No native search elements found, creating fallback trigger button');
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-label', 'Open search');
    trigger.style.position = 'fixed';
    trigger.style.bottom = '24px';
    trigger.style.right = '24px';
    trigger.style.width = '56px';
    trigger.style.height = '56px';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'center';
    trigger.style.borderRadius = '50%';
    trigger.style.border = 'none';
    trigger.style.cursor = 'pointer';
    trigger.style.zIndex = '2147483646';
    trigger.style.pointerEvents = 'auto';
    trigger.style.color = '#fff';
    trigger.style.background = 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)';
    trigger.style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)';
    trigger.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;pointer-events:none"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';
    trigger.onclick = () => openWidget('');
    document.body.appendChild(trigger);
    fallbackTrigger = trigger;
  } else {
    console.log('[Kalifinder] Successfully bound to native search elements');
  }

  return {
    open: openWidget,
    destroy: () => {
      // Disconnect mutation observer
      observer.disconnect();
      console.log('[Kalifinder] MutationObserver disconnected');

      try {
        root.unmount();
      } catch {
        // Root may already be unmounted
      }
      container.remove();
      if (fallbackTrigger) {
        try {
          document.body.removeChild(fallbackTrigger);
        } catch {
          // Trigger may already be removed
        }
        fallbackTrigger = null;
      }
    },
  };
}

declare global {
  interface Window {
    Kalifinder?: { init: (opts: InitOptions) => Controller };
    KalifinderController?: Controller;
  }
}

// UMD global and auto-init from script query (?storeUrl=...)
(() => {
  try {
    (window as unknown as Window).Kalifinder = { init };
    const scripts = document.getElementsByTagName('script');
    const current = scripts[scripts.length - 1];
    if (current && current.src && current.src.includes('kalifind-search')) {
      const url = new URL(current.src);
      const storeUrl = url.searchParams.get('storeUrl');
      const debug = url.searchParams.get('debug') === 'true';
      if (storeUrl) {
        const ctl = init({ storeUrl, debug });
        (window as unknown as Window).KalifinderController = ctl;
      }
    }
  } catch {
    // no-op
  }
})();
