/**
 * WidgetEmbed Component
 * Handles event management for embedded widget inside Shadow DOM
 *
 * Key features:
 * - Rendered inside Shadow DOM for complete CSS/JS isolation
 * - Host website CSS cannot affect widget styles
 * - Widget CSS cannot leak to host website
 * - Event isolation with capture phase handling
 */

import { useEffect, useRef, useState } from 'react';
import KalifindSearch from './KalifindSearch';

interface WidgetEmbedProps {
  storeUrl: string;
}

// Type definition for custom Kalifinder events
interface KalifinderOpenEvent extends CustomEvent {
  detail: { query?: string };
}

export default function WidgetEmbed({ storeUrl }: WidgetEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Listen for host-page open/search events
   * - 'kalifinder:open' opens the widget and optionally seeds a query
   * detail: { query?: string }
   */
  useEffect(() => {
    async function checkWidgetReady(): Promise<void> {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
        // Resolve storeId and storeType from storeUrl
        const rcUrl = new URL('/api/v1/search/recommendations-config', baseUrl);
        rcUrl.searchParams.append('storeUrl', storeUrl);
        const rcRes = await fetch(rcUrl.toString());
        if (!rcRes.ok) {
          setIsReady(null);
          return;
        }
        const rcWrapped = await rcRes.json();
        const rcJson = rcWrapped && rcWrapped.success ? rcWrapped.data : rcWrapped;
        if (!rcJson?.storeId || !rcJson?.storeType) {
          setIsReady(null);
          return;
        }
        // Call widget-ready
        const wrUrl = new URL('/api/v1/analytics-status/widget-ready', baseUrl);
        wrUrl.searchParams.append('storeId', String(rcJson.storeId));
        wrUrl.searchParams.append('storeType', rcJson.storeType);
        const wrRes = await fetch(wrUrl.toString());
        if (!wrRes.ok) {
          setIsReady(null);
          return;
        }
        const wrWrapped = await wrRes.json();
        const wrJson = wrWrapped && wrWrapped.success ? wrWrapped.data : wrWrapped;
        setIsReady(Boolean(wrJson?.ready));
      } catch {
        setIsReady(null);
      }
    }

    const handleOpen = (evt: Event) => {
      // Using CustomEvent to access detail safely
      const ce = evt as KalifinderOpenEvent;
      const q = ce?.detail?.query ?? '';
      setIsOpen(true);
      if (typeof q === 'string') {
        setSearchQuery(q);
        setHasSearched(Boolean(q.trim()));
      }
      if (import.meta.env.DEV)
        console.warn('[KaliFinder] Received open event from host with query:', q);
      void checkWidgetReady();
    };

    window.addEventListener('kalifinder:open', handleOpen as EventListener);
    return () => {
      window.removeEventListener('kalifinder:open', handleOpen as EventListener);
    };
  }, [storeUrl]);

  /**
   * Prevent host-site search shortcuts from opening while our widget is open
   * Common shortcuts: '/', 'Cmd+K', 'Ctrl+K'. Use capture phase to intercept before host listeners.
   * Also add a body class to allow merchants to hide their own search modal via CSS if needed.
   */
  useEffect(() => {
    const keydownBlocker = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
      const isCommandK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isSlash || isCommandK) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (isOpen) {
      document.body.classList.add('kalifinder-open');
      window.addEventListener('keydown', keydownBlocker, true); // capture
    } else {
      document.body.classList.remove('kalifinder-open');
    }

    return () => {
      window.removeEventListener('keydown', keydownBlocker, true);
      document.body.classList.remove('kalifinder-open');
    };
  }, [isOpen]);

  /**
   * Intercept host-site search triggers (icons, buttons, inputs, forms) in capture phase
   * and open our modal instead. Prevent default and stop propagation to avoid host modals.
   */
  useEffect(() => {
    const SEARCH_TRIGGER_SELECTORS = [
      'input[type="search"]',
      'button[aria-label*="search" i]',
      'button[title*="search" i]',
      'a[aria-label*="search" i]',
      '[role="search"] button',
      '[data-action="open-search"]',
      '[data-search-trigger]',
      '.search-toggle',
      '.site-search-toggle',
      '.header__search',
      '.js-search-open',
    ];

    const isInsideWidget = (el: EventTarget | null): boolean => {
      if (!containerRef.current || !(el instanceof Node)) return false;
      return containerRef.current.contains(el);
    };

    const matchesAny = (el: Element | null): boolean => {
      if (!el) return false;
      return SEARCH_TRIGGER_SELECTORS.some((sel) => el.matches(sel) || !!el.closest(sel));
    };

    const onClickCapture = (e: MouseEvent) => {
      if (isInsideWidget(e.target)) return; // allow clicks inside our widget
      const el = e.target as Element | null;
      if (el && matchesAny(el)) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
    };

    const onSubmitCapture = (e: Event) => {
      if (isInsideWidget(e.target)) return;
      const form = e.target as HTMLFormElement;
      const roleSearch = form?.getAttribute('role')?.toLowerCase() === 'search';
      const actionLooksSearch = typeof form?.action === 'string' && /search|query|q=/.test(form.action);
      if (roleSearch || actionLooksSearch) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
    };

    const onKeydownCapture = (e: KeyboardEvent) => {
      if (isInsideWidget(e.target)) return;
      const el = e.target as Element | null;
      const isSearchInput = el?.matches?.('input[type="search"]');
      if (isSearchInput && (e.key === 'Enter' || e.key === 'Return')) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
    };

    window.addEventListener('click', onClickCapture, true);
    window.addEventListener('submit', onSubmitCapture, true);
    window.addEventListener('keydown', onKeydownCapture, true);

    return () => {
      window.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('submit', onSubmitCapture, true);
      window.removeEventListener('keydown', onKeydownCapture, true);
    };
  }, []);

  /**
   * Close widget when clicking outside
   */
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="kalifinder-widget-root" data-testid="widget-embed">
      {/* Full widget in modal - only visible when triggered by host page */}
      {isOpen && (
        <div className="kalifinder-widget-modal" onClick={handleBackdropClick}>
          <div
            className="kalifinder-widget-modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent modal close on content click
          >
            {isReady === false && (
              <div className="kalifinder-widget-banner" role="status" aria-live="polite">
                Indexing in progress. Results may be limited.
              </div>
            )}
            {/* Close button */}
            <button
              className="kalifinder-widget-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close search widget"
              title="Close"
            >
              ✕
            </button>

            {/* Search widget */}
            <div className="kalifinder-widget-content">
              <KalifindSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                hasSearched={hasSearched}
                setHasSearched={setHasSearched}
                storeUrl={storeUrl}
              />
            </div>

            {/* Footer - floating at bottom right */}
            <div className="absolute right-0 bottom-0 z-50 mr-4 mb-4">
              <span className="text-muted-foreground rounded-full bg-white px-3 py-2 text-xs shadow-md">
                Powered by KaliFinder
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
